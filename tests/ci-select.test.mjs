import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyChanges, parseNameStatusZ, chooseTier } from '../scripts/ci-select.mjs';

const item = (p, status = 'M') => ({ status, paths: [p] });
const SHA = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const choose = (diff, opts = {}) => chooseTier({
  event: 'pull_request', base: SHA, head: HEAD, depth: 'quick',
  diff: () => Buffer.from(diff), ...opts
});

test('docs-only edits and additions use the minimal tier', () => {
  assert.equal(classifyChanges([item('README.md'), item('docs/PLAN.md', 'A'), item('docs/archive/old.md')]), 'docs');
  assert.equal(choose('M\0README.md\0').tier, 'docs');
});

test('code, config, CI standards, dependencies, images and mixed changes fail closed', () => {
  for (const p of ['src/model.js', 'tests/model.test.js', 'assets/icons/new.svg',
    'docs/img.png', 'docs/CI-ENGINEERING-STANDARD.md', 'AGENTS.md',
    '.github/workflows/check.yml', 'package.json', 'package-lock.json',
    'scripts/ci-select.mjs']) {
    assert.equal(classifyChanges([item(p)]), 'quick', p);
  }
  assert.equal(classifyChanges([item('README.md'), item('src/render-coordinator.js')]), 'quick');
  assert.equal(classifyChanges([]), 'quick');
  assert.equal(classifyChanges([{ status: 'T', paths: ['docs/PLAN.md'] }]), 'quick');
});

test('renames evaluate both old and new paths', () => {
  assert.deepEqual(parseNameStatusZ(Buffer.from('R100\0docs/old.md\0docs/new.md\0')), [
    { status: 'R100', paths: ['docs/old.md', 'docs/new.md'] }
  ]);
  assert.equal(choose('R100\0docs/old.md\0docs/new.md\0').tier, 'docs');
  assert.equal(choose('R100\0docs/old.md\0src/exec.js\0').tier, 'quick');
  assert.equal(choose('R100\0src/exec.js\0docs/old.md\0').tier, 'quick');
});

test('missing, malformed or inaccessible diffs never skip the quick gate', () => {
  assert.equal(choose('M\0README.md').tier, 'quick');
  assert.equal(choose('R100\0docs/old.md\0').tier, 'quick');
  assert.equal(choose('', { base: 'invalid' }).tier, 'quick');
  assert.equal(choose('', { diff: () => { throw Error('shallow checkout'); } }).tier, 'quick');
  assert.equal(choose('', { event: 'push' }).tier, 'quick');
  assert.equal(choose('', { event: 'merge_group' }).tier, 'quick');
  assert.equal(choose('', { event: 'workflow_dispatch', depth: 'full' }).tier, 'full');
  assert.equal(choose('', { event: 'workflow_dispatch', depth: 'quick' }).tier, 'quick');
});

test('only opt-in main pushes with a valid parent qualify for docs-only publication', () => {
  const mainPush = { event: 'push', allowDocsPush: true, ref: 'refs/heads/main' };
  assert.equal(choose('M\0docs/notes.md\0', mainPush).tier, 'docs');
  assert.equal(choose('M\0README.md\0', mainPush).tier, 'docs');
  assert.equal(choose('M\0docs/notes.md\0', { ...mainPush, base: '0'.repeat(40) }).tier, 'quick');
  assert.equal(choose('M\0docs/notes.md\0', { event: 'push', ref: 'refs/heads/main' }).tier, 'quick');
  assert.equal(choose('M\0docs/notes.md\0', { ...mainPush, ref: 'refs/heads/development' }).tier, 'quick');
  assert.equal(choose('M\0src/renderer.js\0', mainPush).tier, 'quick');
  assert.equal(choose('M\0docs/notes.md\0M\0package.json\0', mainPush).tier, 'quick');
  assert.equal(choose('R100\0docs/notes.md\0src/renderer.js\0', mainPush).tier, 'quick');
  assert.equal(choose('', { ...mainPush, diff: () => { throw Error('missing ancestor'); } }).tier, 'quick');
});
