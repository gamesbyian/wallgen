import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('manual Seed Apply and Enter use canonical transaction instead of unsynchronized render',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const begin=app.indexOf("seedInput.addEventListener('keydown'");
  const end=app.indexOf("document.getElementById('randomize').addEventListener",begin);
  assert.ok(begin>0&&end>begin);
  const handlers=app.slice(begin,end);
  assert.match(handlers,/seedInput\.addEventListener\('keydown'[\s\S]*?changeRecipe\(fromControls\(\)\)/);
  assert.match(handlers,/getElementById\('applySeed'\)\.addEventListener\('click',\(\)=>changeRecipe\(fromControls\(\)\)\)/);
  assert.doesNotMatch(handlers,/render\(fromControls\(\)\)/);
  assert.match(app,/function changeRecipe\(recipe,options=\{\}\)\{[\s\S]*?cancelQueuedControlUpdate\(\)/);
});
