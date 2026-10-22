import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const importer = path.join(root, 'scripts/import-chatgpt-conversations.mjs');
const validator = path.join(root, 'scripts/validate-production-diary.mjs');

test('diary literary language, indices and evidence completeness are checked', () => {
  const result = spawnSync(process.execPath, [validator], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('ChatGPT export importer selects explicit IDs, preserves branches, excludes private roles', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'roygbiv-diary-'));
  const exportPath = path.join(temp, 'conversations.json');
  const idsPath = path.join(temp, 'selected.txt');
  const output = path.join(temp, 'for-review');
  const fixture = [
    { id: 'selected-123', title: 'Обои', create_time: 100,
      mapping: {
        a: { parent: null, message: { id: 'a', author: { role: 'user' },
          create_time: 100, content: { parts: ['a line\nwith spacing'] } } },
        b: { parent: 'a', message: { id: 'b', author: { role: 'assistant' },
          create_time: 101, content: { parts: ['answer'] } } },
        c: { parent: 'a', message: { id: 'c', author: { role: 'assistant' },
          create_time: 101, content: { parts: ['alternative', { image: 'not serialized' }] } } },
        secret: { parent: 'a', message: { id: 'secret', author: { role: 'tool' },
          content: { parts: ['PRIVATE TOOL OUTPUT'] } } },
      } },
    { id: 'other-456', title: 'unrelated', mapping: {
      a: { message: { author: { role: 'user' }, content: { parts: ['unrelated private chat'] } } },
    } },
  ];
  await writeFile(exportPath, JSON.stringify(fixture));
  await writeFile(idsPath, 'selected-123\n');
  const launch = (...extra) => spawnSync(process.execPath,
    [importer, '--input', exportPath, '--ids', idsPath, '--out', output, ...extra], { encoding: 'utf8' });
  const catalog = spawnSync(process.execPath, [importer, '--input', exportPath, '--list'], { encoding: 'utf8' });
  assert.equal(catalog.status, 0, catalog.stderr);
  assert.deepEqual(JSON.parse(catalog.stdout).conversations.map(c => c.id), ['selected-123', 'other-456']);
  assert(!catalog.stdout.includes('unrelated private chat'), 'catalog should display metadata only');
  const dry = launch('--dry-run');
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(JSON.parse(dry.stdout).count, 1);
  const result = launch();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await readdir(output), ['chatgpt-selected-123.json']);
  const archive = JSON.parse(await readFile(path.join(output, 'chatgpt-selected-123.json'), 'utf8'));
  assert.deepEqual(archive.messages.map(m => m.text_parts[0]), ['a line\nwith spacing', 'answer', 'alternative']);
  assert.equal(archive.messages[2].parent_node_id, 'a');
  assert.equal(archive.omissions.nontext_message_parts, 1);
  assert.equal(archive.omissions.excluded_system_developer_tool_messages, 1);
  assert.equal(archive.completeness, 'user_and_assistant_text_only');
  assert(!JSON.stringify(archive).includes('PRIVATE TOOL OUTPUT'));
  assert(!JSON.stringify(archive).includes('unrelated private chat'));
  assert.equal(launch().status, 1, 'never silently overwrite archived text');
  await writeFile(idsPath, 'unknown-id\n');
  assert.equal(launch('--dry-run').status, 1, 'do not guess missing IDs');
});
