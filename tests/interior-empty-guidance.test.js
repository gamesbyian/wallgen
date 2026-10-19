import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../detail-controls.css',import.meta.url),'utf8');
test('empty interior tool cards explain the task, while + Add stays canonical',()=>{
 for(const [tool,copy] of [
  ['interior','No interior elements yet. Use + Add'],
  ['interior-style','Add a line or band in Elements'],
  ['interior-motion','adjust its shape and rhythm'],
  ['interior-placement','place it on the artwork'],
  ['interior-targets','choose which colours or shapes']]){
   assert.ok(app.includes(copy),tool);
 }
 assert.match(app,/message\.className='interior-empty-guidance'/);
 assert.match(app,/message\.setAttribute\('role','note'\)/);
 assert.match(app,/if\(!items\.length\)\{/);
 assert.match(app,/add\.addEventListener\('click'/);
 assert.match(css,/\.interior-empty-guidance\{/);
});
