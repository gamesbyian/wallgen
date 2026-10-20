import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const json=path=>JSON.parse(readFileSync(path,'utf8'));
const contract=json('docs/ui-reference/canonical-screen-contract.json');
const trace=json('docs/ui-reference/component-traceability.json');
const inventory=json('docs/ui-reference/source-control-inventory.json');
const manifest=json('assets/icons/roygbiv/manifest.json');
const html=readFileSync('index.html','utf8');
const historySource=readFileSync('src/exploration-history.js','utf8');
const iconNames=new Set(manifest.icons.map(icon=>icon.name));

test('all twelve canonical plates have distinct, parseable contracts and SVG sources',()=>{
  assert.equal(contract.screens.length,12,'canonical screen count changed');
  const ids=contract.screens.map(screen=>screen.id);
  assert.equal(new Set(ids).size,12,'duplicate canonical screen id');
  for(const screen of contract.screens){
    assert.ok(screen.title&&screen.nav,`missing title/navigation: ${screen.id}`);
    for(const key of ['required','conditional','forbidden','icons','rows']){
      assert.ok(Array.isArray(screen[key])&&screen[key].length,
        `missing ${key} inventory on ${screen.id}`);
      assert.equal(new Set(screen[key]).size,screen[key].length,
        `duplicate ${key} item on ${screen.id}`);
    }
    const svg='docs/ui-reference/'+screen.id+'.svg';
    assert.ok(existsSync(svg),`unreviewable plate: ${svg}`);
    assert.match(readFileSync(svg,'utf8'),/<svg(?:\s|>)/,
      `reference must be actual SVG: ${svg}`);
  }
});

test('every pictured icon maps to a unique shipped exact SVG family member',()=>{
  assert.equal(new Set(manifest.icons.map(icon=>icon.name)).size,manifest.icons.length,
    'duplicate icon identity in manifest');
  for(const screen of contract.screens){
    for(const icon of screen.icons){
      assert.ok(iconNames.has(icon),`${screen.id} describes missing icon ${icon}`);
    }
  }
  for(const icon of manifest.icons){
    assert.ok(existsSync('assets/icons/roygbiv/'+icon.name+'.svg'),
      `manifest icon missing source SVG: ${icon.name}`);
  }
  assert.equal(contract.global.brandIcon,'assets/roygbiv-logo.svg');
  assert.ok(existsSync(contract.global.brandIcon));
  assert.match(html,/class="brand-logo" src="assets\/roygbiv-logo\.svg"/);
});

test('five canonical destinations retain their original static source IDs',()=>{
  const nav=contract.global.navigation;
  assert.equal(nav.length,5);
  assert.equal(new Set(nav.map(n=>n.id)).size,5);
  for(const destination of nav){
    assert.ok(html.includes('id="'+destination.id+'"'),
      `missing real destination ID: ${destination.id}`);
    assert.ok(iconNames.has(destination.icon),
      `missing original navigation glyph: ${destination.icon}`);
  }
});

test('historical 116-ID snapshot and current source traceability stay distinct',()=>{
  assert.equal(inventory.counts.staticIds,116);
  assert.equal(inventory.staticIds.length,116);
  assert.equal(new Set(inventory.staticIds).size,116);
  assert.equal(inventory.counts.settings,87);
  assert.equal(inventory.counts.namedTools,40);
  assert.equal(inventory.counts.categories,7);
  assert.match(trace.sourceBaseline,/116-versioned historical static IDs/);
  assert.match(trace.sourceBaseline,/three old category-tab IDs retired/);
  assert.equal(new Set(trace.entries.map(item=>item.id)).size,trace.entries.length);
  assert.deepEqual(['tab-design','tab-textures','tab-refine'].filter(id=>inventory.staticIds.includes(id)).length,3);
  // The only id: trace target injected by JavaScript rather than first-paint
  // HTML is the real History panel. Do not replace this with phantom HTML.
  for(const item of trace.entries.filter(entry=>entry.sourceSelector.startsWith('id:'))){
    const id=item.sourceSelector.slice(3);
    const source=id==='editorHistory'?historySource:html;
    assert.ok(source.includes("id='"+id+"'")||source.includes('id="'+id+'"'),
      `unresolved static or documented dynamic source trace ${item.id}: ${id}`);
  }
});
