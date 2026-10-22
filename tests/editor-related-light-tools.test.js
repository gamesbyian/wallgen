import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOOL_LIST} from '../src/editor-schema.js';
import {RELATED_LIGHT_TOOLS,relatedLightTools} from '../src/editor-related-light-tools.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('light links connect only real source tool destinations',()=>{
  const homes=new Set(TOOL_LIST.map(t=>t.category+'/'+t.id));
  assert.equal(RELATED_LIGHT_TOOLS.length,6);
  for(const link of RELATED_LIGHT_TOOLS){
    assert.ok(homes.has(link.from.join('/')),'unknown source '+link.from);
    assert.ok(homes.has(link.to.join('/')),'unknown target '+link.to);
    assert.notDeepEqual(link.from,link.to);
  }
  assert.deepEqual(relatedLightTools('effects','lighting').map(l=>l.to[1]),
    ['shadows','glow']);
  assert.deepEqual(relatedLightTools('details','glow').map(l=>l.to[1]),
    ['lighting','shadows']);
  assert.deepEqual(relatedLightTools('material','layer1'),[]);
});
test('real buttons navigate into existing editor tool cards with no state duplication',()=>{
  const js=read('src/editor-layout.js');
  const helper=read('src/editor-related-light-tools.js');
  const css=read('editor-redesign.css');
  assert.match(js,/installRelatedLightTools\(\{chooser,/);
  assert.match(js,/relatedLightLinks\?\.sync\(category,tool\)/);
  assert.match(js,/source==='related'/);
  assert.match(helper,/anchor\.after\(\.\.\.shown\)/);
  assert.match(helper,/button\.setAttribute\('aria-label'/);
  assert.match(css,/\.editor-tool-chooser \.editor-related-tool\[hidden\]/);
  assert.doesNotMatch(helper,/createElement\('input'\)|current\.|changeRecipe/);
});
