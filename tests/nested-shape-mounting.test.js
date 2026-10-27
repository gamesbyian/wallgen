import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('dynamic Regions card exists before saved silhouette and nesting UI are attached',()=>{
  const mounted=app.indexOf('const editor=mountEditor();');
  const attached=app.indexOf('regionsCard.append(useScatteredShape);');
  const nested=app.indexOf('const nestedShapeControls=installNestedShapeControls({');
  const before=app.indexOf("const useScatteredShape=document.createElement('button');");
  assert.ok(mounted>0&&attached>mounted&&nested>attached,
    'contextual buttons must be mounted AFTER editor cards are materialized');
  assert.ok(before>0&&before<mounted,'source action construction is harmless, but attachment must be deferred');
  assert.equal(app.includes("document.querySelector('.editor-tool-card[data-editor-tool=\"regions\"]')?.append(useScatteredShape);"),false,
    'old premature optional-chain attachment silently lost the button');
});
