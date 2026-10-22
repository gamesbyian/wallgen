import test from 'node:test';
import assert from 'node:assert/strict';
import { auditHomes, evaluate, TASKS } from '../scripts/ia-structure-evaluate.mjs';

test('the navigation research model covers the current 95 artistic settings and 17 representative tasks', () => {
  const audit = auditHomes();
  assert.deepEqual(audit.issues, []);
  assert.equal(audit.sourceKeys, 95);
  assert.equal(audit.candidateKeys, 95);
  assert.equal(TASKS.length, 17);
  const result = evaluate();
  assert.equal(result.kind, 'STRUCTURAL_ROUTE_PROXY_NOT_HUMAN_TEST');
  assert.equal(result.inventory.source, 95);
  assert.equal(result.inventory.proposed, 95);
  assert.equal(result.inventory.taskCount, 17);
});
