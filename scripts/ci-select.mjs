import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Unknown impact must retain the established full quick gate.
const SHA = /^[0-9a-f]{40}$/;
const DOC = /^(?:README\.md|CLAUDE\.md|docs\/(?!CI-)[^/]+(?:\/[^/]+)*\.md|assets\/fonts\/README\.md|assets\/icons\/references\/README\.md)$/;

export function parseNameStatusZ(bytes) {
  const str = Buffer.isBuffer(bytes) ? bytes.toString('utf8') : String(bytes);
  if (str && !str.endsWith('\0')) throw Error('Unterminated git diff output');
  const parts = str.split('\0');
  if (parts.at(-1) === '') parts.pop();
  const out = [];
  for (let i = 0; i < parts.length;) {
    const status = parts[i++];
    if (!/^[A-Z][0-9]*$/.test(status)) throw Error('Malformed git diff status');
    const count = /^[RC]/.test(status) ? 2 : 1;
    if (parts.length - i < count) throw Error('Truncated git diff names');
    const paths = parts.slice(i, i + count);
    i += count;
    if (paths.some(p => !p || p.includes('\n'))) throw Error('Unsafe path in git diff');
    out.push({ status, paths });
  }
  return out;
}

export function classifyChanges(changes) {
  if (!Array.isArray(changes) || changes.length === 0) return 'quick';
  // Evaluate BOTH sides of a rename; unexpected statuses fail closed.
  return changes.every(change =>
    /^(?:A|D|M|R[0-9]*)$/.test(change.status) &&
    Array.isArray(change.paths) &&
    change.paths.length === (change.status.startsWith('R') ? 2 : 1) &&
    change.paths.every(p => DOC.test(p))
  ) ? 'docs' : 'quick';
}

export function chooseTier({ event, base, head, depth, diff, allowDocsPush = false, ref = '' }) {
  if (event === 'workflow_dispatch' && depth === 'full') return { tier: 'full', reason: 'Explicit full-suite request' };
  const docsPush = event === 'push' && allowDocsPush === true && ref === 'refs/heads/main';
  if (event !== 'pull_request' && !docsPush) return { tier: 'quick', reason: 'Unclassified event or manual quick request' };
  if (!SHA.test(base || '') || !SHA.test(head || '') || /^0{40}$/.test(base || '')) return { tier: 'quick', reason: 'Missing or invalid SHA; fail-closed' };
  try {
    const entries = parseNameStatusZ(diff(base, head));
    const tier = classifyChanges(entries);
    return { tier, reason: tier === 'docs' ? 'Only non-CI Markdown documentation changed' : 'Code, config, CI, assets, ambiguous or mixed changes' };
  } catch (error) {
    return { tier: 'quick', reason: 'Diff unavailable or invalid; fail-closed: ' + String(error.message).slice(0, 160) };
  }
}

function main() {
  let head = '';
  try { head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  const result = chooseTier({
    event: process.env.GITHUB_EVENT_NAME,
    base: process.env.CI_BASE_SHA,
    head,
    depth: process.env.CI_DEPTH,
    allowDocsPush: process.env.CI_ALLOW_DOCS_PUSH === 'true',
    ref: process.env.GITHUB_REF,
    diff: (base, current) => execFileSync('git', ['diff', '--no-ext-diff', '--name-status', '-z', '-M', base, current, '--'], { maxBuffer: 5 * 1024 * 1024 })
  });
  console.log('CI selection: ' + result.tier + ' (' + result.reason + '), HEAD ' + head);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'tier=' + result.tier + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### CI dispatch\n' + result.tier + ': ' + result.reason + '\n\nExact checkout: ' + head + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
