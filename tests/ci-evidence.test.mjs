import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/ci-evidence.mjs', import.meta.url));

test('failure digest keeps exit status, relevant error, run provenance and redacts credentials', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'wallgen-ci-'));
  try {
    const result = spawnSync(process.execPath, [script, 'probe', '--', process.execPath, '-e',
      "console.error('Authorization: Bearer SECRET123');console.error('not ok 1 - deliberate failure');process.exit(7)"], {
      cwd: dir, encoding: 'utf8',
      env: { ...process.env, GITHUB_STEP_SUMMARY: path.join(dir, 'summary.md'),
        GITHUB_SHA: 'a'.repeat(40), GITHUB_REPOSITORY: 'gamesbyian/wallgen',
        GITHUB_RUN_ID: '1234', GITHUB_EVENT_NAME: 'pull_request' }
    });
    assert.equal(result.status, 7, result.stderr);
    const data = JSON.parse(readFileSync(path.join(dir, 'artifacts/ci/probe.json'), 'utf8'));
    assert.equal(data.schemaVersion, 1);
    assert.equal(data.status, 'failed');
    assert.equal(data.exitCode, 7);
    assert.equal(data.sha, 'a'.repeat(40));
    assert.match(data.runUrl, /actions\/runs\/1234/);
    assert.match(data.boundedExcerpt, /not ok 1 - deliberate failure/);
    assert.doesNotMatch(JSON.stringify(data), /SECRET123/);
    assert.match(readFileSync(path.join(dir, 'summary.md'), 'utf8'), /probe: FAIL/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('success is still success and does not upload failure evidence', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'wallgen-ci-'));
  try {
    const result = spawnSync(process.execPath, [script, 'pass', '--', process.execPath, '-e',
      'console.log("all clear")'], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(path.join(dir, 'artifacts/ci/pass.json')), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('spawning a missing command cannot be mistaken for an assertion pass', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'wallgen-ci-'));
  try {
    const result = spawnSync(process.execPath, [script, 'spawn', '--',
      'a-command-that-does-not-exist-ci-test-4791'], { cwd: dir, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    const data = JSON.parse(readFileSync(path.join(dir, 'artifacts/ci/spawn.json'), 'utf8'));
    assert.equal(data.failureClass, 'setup');
    assert.equal(data.status, 'failed');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
