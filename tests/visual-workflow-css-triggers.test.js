import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const visual = readFileSync('.github/workflows/visual-agent1.yml', 'utf8');

test('optional visual review remains runnable without creating screenshots on every PR', () => {
  assert.match(visual, /^  workflow_dispatch:/m);
  assert.doesNotMatch(visual, /^  pull_request:/m);
  assert.match(visual, /node scripts\/visual-reference-audit-agent1\.mjs/);
  assert.match(visual, /upload-artifact@v4/);
  assert.match(visual, /if: always\(\)/);
});
