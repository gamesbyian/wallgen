import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');

test('named editor tool chooser supports roving keyboard focus',()=>{
  assert.match(source,/chooser\.addEventListener\('keydown',event=>\{/);
  assert.match(source,/event\.target\.closest\('\[data-editor-tool\]'\)/);
  assert.match(source,/\.filter\(chip=>!chip\.hidden&&!chip\.disabled\)/);
  for(const key of ['ArrowRight','ArrowLeft','Home','End'])
    assert.ok(source.includes("event.key==='"+key+"'"),key);
  assert.match(source,/selectEditorTool\(next\.dataset\.category,next\.dataset\.editorTool,\{source:'keyboard'\}\)/);
  assert.match(source,/next\.focus\(\{preventScroll:true\}\)/);
  assert.match(source,/entry\.chip\.tabIndex=id===tool\?0:-1/);
  assert.match(source,/if\(source==='search'\|\|source==='keyboard'\)/);
});

test('manual tool clicks preserve existing horizontal scroll behavior',()=>{
  assert.match(source,/button\.addEventListener\('click',\(\)=>selectEditorTool\(button\.dataset\.category,button\.dataset\.editorTool\)\)/);
  assert.match(source,/if\(source==='search'\|\|source==='keyboard'\)/);
});
