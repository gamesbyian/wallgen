#!/usr/bin/env node
/**
 * Prepare reviewable, text-only conversation archives from a user-supplied
 * ChatGPT export. Never discovers conversations, publishes, or commits files.
 *
 * Usage: node scripts/import-chatgpt-conversations.mjs
 *   --input /private/conversations.json --ids /private/project-ids.txt
 *   --out /private/review-directory [--dry-run]
 *
 * The ID file contains exactly one export conversation ID per line. Excluding
 * system/developer/tool messages and non-text parts is intentional; metadata
 * records these omissions and never claims full multimodal completeness.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

function argsFrom(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') { opts.dryRun = true; continue; }
    if (!['--input', '--ids', '--out'].includes(argv[i]) || !argv[i + 1]) {
      throw new Error('Usage: --input conversations.json --ids selected-ids.txt --out review-dir [--dry-run]');
    }
    if (opts[argv[i].slice(2)]) throw new Error('Duplicate argument: ' + argv[i]);
    opts[argv[i].slice(2)] = argv[++i];
  }
  for (const k of ['input', 'ids', 'out']) if (!opts[k]) throw new Error('Missing --' + k);
  return opts;
}

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const iso = seconds => typeof seconds === 'number' && Number.isFinite(seconds)
  ? new Date(seconds * 1000).toISOString() : null;
const safeId = value => {
  if (typeof value !== 'string' || !/^[\w-]{1,140}$/.test(value)) {
    throw new Error('Unsafe or unsupported conversation ID');
  }
  return value;
};

function messagesFrom(conversation) {
  const nodes = conversation.mapping || {};
  const out = [];
  let skippedNonTextParts = 0;
  let skippedOtherRoles = 0;
  for (const [nodeId, node] of Object.entries(nodes)) {
    const msg = node?.message;
    if (!msg) continue;
    const role = msg.author?.role;
    if (role !== 'user' && role !== 'assistant') { skippedOtherRoles++; continue; }
    const content = msg.content || {};
    const parts = Array.isArray(content.parts) ? content.parts
      : (typeof content.text === 'string' ? [content.text] : []);
    const textParts = parts.filter(part => typeof part === 'string');
    const missing = parts.length - textParts.length;
    skippedNonTextParts += missing;
    out.push({
      node_id: nodeId,
      parent_node_id: node.parent ?? null,
      role,
      original_message_id: msg.id || null,
      created_at: iso(msg.create_time),
      content_type: content.content_type || null,
      text_parts: textParts,
      omitted_nontext_parts: missing,
      // Even an empty textual message belongs in the source tree.
    });
  }
  out.sort((a, b) =>
    String(a.created_at || '').localeCompare(String(b.created_at || '')) ||
    a.node_id.localeCompare(b.node_id));
  return { messages: out, skippedNonTextParts, skippedOtherRoles };
}

function sensitiveHints(text) {
  const flags = [];
  if (/(?:github_pat_|gh[pousr]_|sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{16,})/i.test(text)) {
    flags.push('possible_access_token');
  }
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) {
    flags.push('possible_email_address');
  }
  return flags;
}

async function main() {
  const opts = argsFrom(process.argv.slice(2));
  const exportBytes = await readFile(opts.input);
  const parsed = JSON.parse(exportBytes.toString('utf8'));
  const conversations = Array.isArray(parsed) ? parsed : parsed?.conversations;
  if (!Array.isArray(conversations)) throw new Error('Expected a ChatGPT conversations JSON array');
  const idLines = (await readFile(opts.ids, 'utf8')).split(/\r?\n/);
  const selected = idLines.map(x => x.trim()).filter(x => x && !x.startsWith('#'));
  if (!selected.length || new Set(selected).size !== selected.length) {
    throw new Error('Selection file must list unique conversation IDs');
  }
  const found = new Map();
  for (const conversation of conversations) {
    if (conversation?.id && selected.includes(conversation.id)) {
      if (found.has(conversation.id)) throw new Error('Duplicate conversation ID in export');
      found.set(conversation.id, conversation);
    }
  }
  for (const id of selected) if (!found.has(id)) throw new Error('Selected conversation missing in export: ' + id);
  if (!opts.dryRun) await mkdir(opts.out, { recursive: true });
  const result = [];
  for (const id of selected) {
    const conversation = found.get(id);
    const { messages, skippedNonTextParts, skippedOtherRoles } = messagesFrom(conversation);
    const archive = {
      schema: 'roygbiv-chatgpt-export-text/1',
      source_id: 'chatgpt-' + id,
      capture_kind: 'verbatim_export_text_subset',
      original_conversation_id: id,
      original_title: conversation.title || null,
      original_created_at: iso(conversation.create_time),
      original_updated_at: iso(conversation.update_time),
      source_export_sha256: hash(exportBytes),
      source_record_json_sha256: hash(Buffer.from(JSON.stringify(conversation))),
      completeness: 'user_and_assistant_text_only',
      full_multimodal_transcript: false,
      omissions: {
        nontext_message_parts: skippedNonTextParts,
        excluded_system_developer_tool_messages: skippedOtherRoles,
        private_or_hidden_session_records: 'not available from export',
      },
      preserve_original_language: true,
      sensitive_content_review: 'required_before_publication',
      sensitive_hints: sensitiveHints(JSON.stringify(messages)),
      messages,
    };
    const destination = path.join(opts.out, 'chatgpt-' + safeId(id) + '.json');
    if (!opts.dryRun) {
      // wx means an existing archive is never silently replaced.
      await writeFile(destination, JSON.stringify(archive, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    }
    result.push({ id, messages: messages.length, nontext_omitted: skippedNonTextParts,
      excluded_other_roles: skippedOtherRoles, requires_review: true, destination });
  }
  process.stdout.write(JSON.stringify({ dry_run: !!opts.dryRun, count: result.length, archives: result }, null, 2) + '\n');
}
main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
