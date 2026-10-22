import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.github/workflows');
const automaticEvents = new Map([
  ['check.yml', ['pull_request', 'push', 'workflow_dispatch']],
  ['mobile-browser.yml', ['pull_request', 'workflow_dispatch']],
  ['headless-render.yml', ['pull_request', 'workflow_dispatch']],
  ['agent3-mobile-acceptance.yml', ['pull_request', 'workflow_dispatch']],
  ['pages.yml', ['push', 'workflow_dispatch']],
  ['logo-raster.yml', ['push', 'workflow_dispatch']],
]);

function workflowEvents(source, file) {
  const lines = source.split(/\r?\n/);
  const start = lines.indexOf('on:');
  assert.notEqual(start, -1, file + ': top-level on: required');
  const events = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[a-zA-Z_][\w-]*:/.test(lines[i])) break;
    const match = lines[i].match(/^  ([a-zA-Z_][\w-]*):/);
    if (match) events.push(match[1]);
  }
  assert.equal(events.length, new Set(events).size, file + ': duplicate workflow events');
  return events.sort();
}

test('heavy acceptance workflows remain dispatchable without unbudgeted PR fanout', async () => {
  const files = (await readdir(directory)).filter(name => /\.ya?ml$/.test(name)).sort();
  assert(files.length >= automaticEvents.size, 'workflow inventory unexpectedly empty');
  for (const file of files) {
    const source = await readFile(path.join(directory, file), 'utf8');
    const events = workflowEvents(source, file);
    const expected = automaticEvents.get(file) ?? ['workflow_dispatch'];
    assert.deepEqual(events, [...expected].sort(),
      file + ': update CI policy and document impact before adding automatic triggers');
  }
  for (const file of automaticEvents.keys()) {
    assert(files.includes(file), file + ': required automatic gate missing');
  }
});

test('primary PR validation retains main safety net and cancels only superseded PRs', async () => {
  const check = await readFile(path.join(directory, 'check.yml'), 'utf8');
  assert.match(check, /  push:\n    branches: \[main\]/);
  assert.match(check, /- run: npm run check/);
  assert.match(check, /group: .*github\.workflow.*github\.event\.pull_request\.number/);
  assert.match(check, /cancel-in-progress: .*github\.event_name == 'pull_request'/);
  for (const file of ['mobile-browser.yml', 'headless-render.yml', 'agent3-mobile-acceptance.yml']) {
    const source = await readFile(path.join(directory, file), 'utf8');
    assert.match(source, /cancel-in-progress: .*github\.event_name == 'pull_request'/);
    assert.match(source, /^    paths:/m, file + ': retain a targeted PR path filter');
  }
});
