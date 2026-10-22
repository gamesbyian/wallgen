#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'prod_diary');
const read = async p => (await readFile(path.join(directory, p), 'utf8'));
const sourceIndex = JSON.parse(await read('CONVERSATION-SOURCES.json'));
const provenance = JSON.parse(await read('EPISODE-PROVENANCE.json'));
assert.equal(sourceIndex.full_transcript_count, 0,
  'Do not declare full transcripts without a source export');
assert.equal(sourceIndex.source_excerpt_count, sourceIndex.sources.filter(s => s.capture_kind === 'source_excerpt').length);
assert.equal(sourceIndex.reconstructed_summary_count, sourceIndex.sources.filter(s => s.capture_kind === 'reconstructed_summary').length);
const sourceIds = new Set();
let countedUserMessages = 0;
for (const source of sourceIndex.sources) {
  assert(!sourceIds.has(source.source_id), 'duplicate source ID');
  sourceIds.add(source.source_id);
  assert(['source_excerpt', 'reconstructed_summary'].includes(source.capture_kind));
  assert.equal(source.full_transcript_verified, false);
  assert.equal(source.completeness, 'partial');
  await access(path.join(root, source.archive_path));
  if (source.capture_kind === 'reconstructed_summary') {
    assert.equal(source.verbatim_user_text, false);
    const reconstruction = await readFile(path.join(root, source.archive_path), 'utf8');
    assert(reconstruction.includes('не дословная стенограмма'));
    continue;
  }
  const archive = JSON.parse((await readFile(path.join(root, source.archive_path), 'utf8')));
  assert.equal(archive.source_id, source.source_id);
  assert.equal(archive.completeness, 'partial');
  assert.equal(archive.agent_messages_available, false);
  assert.equal(archive.messages.length, source.visible_user_message_count);
  countedUserMessages += archive.messages.length;
  assert(archive.messages.every(message => message.role === 'user' && typeof message.text === 'string'));
}
assert.equal(countedUserMessages, sourceIndex.visible_user_message_count);
const ids = new Set();
for (const episode of provenance.episodes) {
  assert(!ids.has(episode.episode_id), 'duplicate episode ID');
  ids.add(episode.episode_id);
  assert.equal(episode.complete_verbatim_transcript_verified, false);
  for (const source of episode.source_ids) assert(sourceIds.has(source), 'unregistered source ' + source);
  const diary = await read(episode.diary_file);
  assert(diary.includes('### ' + episode.episode_id + '.'), 'missing numbered episode ' + episode.episode_id);
}
assert.equal(ids.size, 16, 'expected sixteen dated chapters');
const narratives = ['PROLOGUE-2026-10-22.md',
  'PRODUCTION-DIARY-2026-10-16-TO-2026-10-19.md',
  'PRODUCTION-DIARY-2026-10-20-TO-2026-10-22.md',
  'RECONSTRUCTED-ORIGIN-2026-10-16.md'];
for (const filename of narratives) {
  // References are code-facing URL destinations, not Russian-language prose.
  const prose = (await read(filename)).replace(/\]\([^)]+\)/g, ']').replace(/https?:\/\/[^\s)]+/g, '');
  assert(!/[A-Za-z]/.test(prose), 'Non-Cyrillic literary prose in ' + filename);
}
process.stdout.write('Verified source classes, sixteen episodes and Cyrillic-only literary prose.\n');
