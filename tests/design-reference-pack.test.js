import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {iconMarkup} from '../src/ui-icons.js';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const spec=JSON.parse(read('docs/ui-reference/canonical-screen-contract.json'));
const manifest=JSON.parse(read('assets/icons/roygbiv/manifest.json'));
test('canonical references enumerate all seven categories, all 40 tools and 12 illustrated states',()=>{
 assert.equal(spec.global.sourceCategories.length,7);
 assert.equal(spec.global.sourceCategories.reduce((n,c)=>n+c.tools.length,0),40);
 assert.equal(spec.screens.length,12);
 for(const sc of spec.screens){
  assert.ok(sc.required.length>=6 && sc.conditional.length && sc.forbidden.length,sc.id);
  assert.ok(read('docs/ui-reference/'+sc.id+'.svg').includes('IMPLEMENTATION-SAFE'));
  assert.ok(read('docs/ui-reference/'+sc.id+'.svg').includes('REQUIRED IN THIS STATE'));
 }
});
test('approved icon family remains available with 12 unwired flat SVG candidates',()=>{
 assert.equal(manifest.icons.length,68);
 const original=manifest.icons.filter(i=>i.extension!=='canvas-first-v2');
 assert.equal(original.length,56);
 for(const icon of manifest.icons){
  assert.ok(read('assets/icons/roygbiv/'+icon.name+'.svg').includes('<svg'));
  assert.ok(iconMarkup(icon.name).includes('data-roygbiv-icon="'+icon.name+'"'));
 }
 for(const icon of manifest.icons.filter(i=>i.extension==='canvas-first-v2')){
  assert.match(icon.status,/not wired/i);
  assert.doesNotMatch(read('assets/icons/roygbiv/'+icon.name+'.svg'),/(?:linear|radial)Gradient|<filter|<script/i);
 }
});
test('critical semantics documented, existing logo and pencil kept',()=>{
 assert.equal(spec.global.brandIcon,'assets/roygbiv-logo.svg');
 assert.deepEqual(spec.global.navigation.map(n=>n.label),['Studio','Edit','Explore','Saved','More']);
 assert.ok(spec.global.currentDockControls.some(x=>x.id==='mobileShuffle'));
 assert.ok(spec.global.currentDockControls.some(x=>x.id==='mobileDownload'));
 assert.ok(spec.global.actionRelocations.mobileShuffle&&spec.global.actionRelocations.mobileDownload);
 assert.ok(spec.global.noDedicatedCanvasHeader);
 assert.match(spec.global.cameraSemantics,/no recipe mutation/);
 assert.match(spec.global.sliderSemantics,/blue/);
 assert.ok(spec.screens.find(x=>x.id==='draw').icons.includes('draw-path'));
 assert.ok(spec.global.navigation.find(x=>x.label==='Edit').icon==='edit-controls');
});
