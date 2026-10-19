import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';

// The independently versioned snapshot is frozen separately from current
// application code. Changing/removing a capability requires reviewing both.
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base=JSON.parse(read('docs/ui-reference/source-control-inventory.json'));
const verify=JSON.parse(read('docs/ui-reference/verification-matrix.json'));
const spec=JSON.parse(read('docs/ui-reference/canonical-screen-contract.json'));
const html=read('index.html');
const attr=(name)=>[...html.matchAll(new RegExp('\\b'+name+'="([^"]+)"','g'))].map(m=>m[1]);

test('frozen static DOM IDs are fully accounted for, not just a curated subset',()=>{
  const ids=attr('id');
  assert.equal(new Set(ids).size,ids.length,'Duplicate DOM id');
  assert.deepEqual(ids,base.staticIds,'HTML IDs changed: review baseline and traceability');
  assert.equal(ids.length,base.counts.staticIds);
});

test('every source setting has a reviewed identity and belongs to real editor controls',()=>{
  const actual=attr('data-setting');
  assert.equal(new Set(actual).size,actual.length,'Duplicate data-setting');
  assert.deepEqual(actual,base.settingNames,'Settings added/removed: review their UI contract');
  const assigned=EDITOR_CATEGORIES.flatMap(c=>c.tools.flatMap(t=>t.settings));
  assert.equal(new Set(assigned).size,assigned.length,'Editor tool setting has multiple owners');
  for(const key of actual.filter(k=>!base.exceptions.schemaOutsideSettings.includes(k))){
    assert.ok(assigned.includes(key),'Unmapped user setting '+key);
  }
  for(const key of assigned.filter(k=>!actual.includes(k))){
    assert.ok(base.exceptions.layerEnablingHiddenInputs.includes(key),'Unexpected invisible setting '+key);
    assert.ok(html.includes('name="'+key+'"'),'Hidden setting missing form identity: '+key);
  }
});

test('all 40 tool identities stay aligned with live editor schema',()=>{
  const live=EDITOR_CATEGORIES.flatMap(c=>c.tools.map(t=>c.id+'/'+t.id));
  assert.deepEqual(live,base.toolIds,'Tool omitted or renamed without reviewing contract');
  assert.equal(EDITOR_CATEGORIES.length,base.counts.categories);
  assert.equal(live.length,base.counts.namedTools);
  const contract=spec.global.sourceCategories.flatMap(c=>c.tools.map(t=>c.id+'/'+t.id));
  assert.deepEqual(contract,live);
});

test('source controls remain traced and required interactions are protected',()=>{
  assert.equal(base.tracked.length,base.counts.tracedUI);
  const listed=new Set(base.staticIds);
  for(const item of base.tracked){
    const sel=item.sourceSelector;
    if(sel.startsWith('id:')&&item.sourceKind==='Static index.html ID')
      assert.ok(listed.has(sel.slice(3)),'Missing traced static control '+sel);
    assert.ok(spec.screens.some(s=>s.id===item.canonicalScreen),'Invalid screen '+item.id);
  }
  const necessary=['mobileEdit','mobileExplore','mobileShuffle','mobileFavorite','mobileDownload','mobileMore',
    'drawApply','drawCancel','drawSmoothingStrength','drawExtendPath','drawEditPoints',
    'drawAddPoint','drawDeletePoint','drawCornerPoint','drawResmoothPoints',
    'metadataToggle','metadataRemember','metadataClear','downloadRecipe','importRecipePNG','viewPanStatus'];
  for(const id of necessary)assert.ok(listed.has(id),'Feature dropped without deliberate deprecation: '+id);
});

test('camera zoom, composition nudge and future viewport pan remain distinct',()=>{
  const req=new Map(verify.requirements.map(x=>[x.id,x]));
  for(const id of ['CAM-ZOOM','COMPOSE-NUDGE','CAM-PAN-NEW','CAM-FIT']){
    assert.ok(req.has(id),id);
  }
  assert.match(req.get('CAM-PAN-NEW').status,/merged PR #143/);
  assert.equal(req.get('CAM-PAN-NEW').kind,'behavior');
  assert.ok(req.get('CAM-PAN-NEW').proof.includes('tests/verify-export-geometry.mjs'));
  assert.ok(base.staticIds.includes('viewPanStatus'));
  assert.ok(spec.global.cameraSemantics.includes('viewPanX/Y'));
  assert.match(spec.global.cameraSemantics,/positionX\/Y/);
  assert.match(spec.global.cameraZoomState,/viewZoom/);
  const camera=read('src/mobile-preview-tools.js');
  const app=read('src/app.js');
  assert.match(camera,/roygbiv-view-zoom-request/);
  assert.match(app,/changeRecipe\(\{\.\.\.current,viewZoom:event\.detail\}\)/);
  assert.match(app,/recipe\.positionX=.*recipe\.positionX\+dx/);
  assert.match(app,/recipe\.positionY=.*recipe\.positionY\+dy/);
});

test('every qualified requirement points to available source and verification evidence',()=>{
  const ids=verify.requirements.map(x=>x.id);
  assert.equal(ids.length,new Set(ids).size);
  for(const item of verify.requirements){
    assert.match(item.id,/^[A-Z][A-Z0-9-]+$/);
    assert.ok(item.assertion.length>40);
    assert.ok(item.source.length);
    for(const file of [...item.source,...item.proof])assert.ok(existsSync(new URL('../'+file,import.meta.url)),item.id+' missing '+file);
    if(item.kind==='proposal'||item.kind==='optional-proposal')
      assert.ok(item.status.includes('not implemented')||item.status.includes('NOT implemented'));
  }
});
