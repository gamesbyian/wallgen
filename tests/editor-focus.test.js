import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {focusEligible,adjustedValue,focusChipDestination,focusUnavailableReason,
  sameFocusChipInventory,focusSelectedField} from '../src/editor-focus.js';
const field=(value='40',min='0',max='100',step='1')=>({tagName:'INPUT',type:'range',
 name:'stripeWidth',value,min,max,step,disabled:false,closest:()=>null});
test('only actual available named range controls qualify; no proxy recipe keys',()=>{
 assert.equal(focusEligible(field()),true);
 assert.equal(focusEligible({...field(),disabled:true}),true);
 assert.equal(focusEligible({...field(),type:'checkbox'}),false);
 assert.equal(focusEligible({...field(),name:''}),false);
 assert.equal(focusEligible({...field(),closest:()=>({hidden:true})}),false);
});
test('one-step adjustments clamp, support decimals and never modify the source object',()=>{
 const a=field('100');assert.equal(adjustedValue(a,1),'100');assert.equal(a.value,'100');
 assert.equal(adjustedValue(a,-1),'99');
 assert.equal(adjustedValue(field('0'),-1),'0');
 assert.equal(adjustedValue(field('2.4','0','10','.1'),1),'2.5');
 assert.equal(adjustedValue(field('2.4','0','10','.1'),-1),'2.3');
});

test('Focus controls must not masquerade as named tool chips',()=>{
  // Named tool chips are enumerated by the atlas and browser tests.
  // Focus is a secondary view, not a 41st generated editor tool.
  const fs=requireFocusSource();
  assert.ok(fs.includes("const toggle=create('button','editor-focus-toggle','Focus');"));
  assert.equal(fs.includes("'editor-tool-tab editor-focus-toggle'"),false);
});
function requireFocusSource(){return readFileSync(new URL('../src/editor-focus.js',import.meta.url),'utf8');}

test('optional Focus listens to every completed source control sync',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const focus=requireFocusSource();
  assert.match(app,/document\.dispatchEvent\(new Event\('roygbiv-controls-synced'\)\)/);
  assert.match(focus,/addEventListener\('roygbiv-controls-synced',sync\)/);
  assert.match(focus,/else slider\.style\.removeProperty\('--roygbiv-slider-color'\)/);
});

test('empty Focus tools surrender unused sheet height but retain an exit',()=>{
 const js=requireFocusSource();
 const css=readFileSync(new URL('../editor-focus.css',import.meta.url),'utf8');
 assert.match(js,/form\.classList\.toggle\('editor-focus-empty',empty\)/);
 assert.match(js,/chips\.hidden=empty/);
 assert.match(js,/form\.classList\.remove\('editor-focus-empty'\)/);
 assert.match(css,/:has\(#controls\.editor-focus-active\.editor-focus-empty\)/);
 assert.match(css,/--mobile-tray-height:clamp\(192px,23dvh,215px\)/);
});

test('Focus chip arrows wrap while Home/End choose bounds',()=>{
  assert.equal(focusChipDestination('ArrowRight',2,3),0);
  assert.equal(focusChipDestination('ArrowLeft',0,3),2);
  assert.equal(focusChipDestination('Home',2,3),0);
  assert.equal(focusChipDestination('End',0,3),2);
  assert.equal(focusChipDestination('ArrowRight',0,1),0);
  assert.equal(focusChipDestination('ArrowLeft',0,1),0);
  assert.equal(focusChipDestination('Enter',0,3),-1);
  assert.equal(focusChipDestination('ArrowRight',0,0),-1);
  assert.equal(focusChipDestination('ArrowRight',-1,3),-1);
  const js=requireFocusSource();
  assert.match(js,/chips\.addEventListener\('keydown',event=>\{/);
  assert.match(js,/chip\.tabIndex=selected\?0:-1/);
  assert.match(js,/choose\(source\)/);
  assert.match(js,/next\.focus\(\{preventScroll:true\}\)/);
});

test('Focus distinguishes user locks, contextual inactivity and other disabled sources',()=>{
  assert.equal(focusUnavailableReason({}), '');
  assert.match(focusUnavailableReason({locked:true}),/locked.*unlock/i);
  assert.match(focusUnavailableReason({locked:true,unlockHere:true}),/locked.*Unlock here/i);
  assert.doesNotMatch(focusUnavailableReason({locked:true,unlockHere:true}),/Open All controls/i);
  assert.match(focusUnavailableReason({locked:true,unlockHere:false}),/Open All controls/i);
  assert.match(focusUnavailableReason({inactive:true}),/inactive.*current design/i);
  assert.match(focusUnavailableReason({disabled:true}),/temporarily unavailable/i);
  assert.match(focusUnavailableReason({inactive:true,locked:true}),/locked/i);
  const src=readFileSync(new URL('../src/editor-focus.js',import.meta.url),'utf8');
  assert.match(src,/help\.textContent=disabled\?unavailableReason\(original\)/);
  assert.match(src,/locked:Boolean\(sourceLock\?\.classList\.contains\('is-locked'\)\)/);
  assert.match(src,/unlockHere:Boolean\(sourceLock&&!sourceLock\.disabled\)/);
});

test('Focus expands only its own tall-phone viewport reservation',()=>{
  const css=readFileSync(new URL('../editor-focus.css',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(css, /mobile-edit-open:has\(#controls\.editor-focus-active\)/);
  assert.match(css, /--mobile-tray-height:clamp\(295px,34dvh,330px\)!important/);
  assert.match(css, /--mobile-tray-height:clamp\(192px,23dvh,215px\)!important/);
  assert.match(html, /editor-focus\.css\?v=20261019-viewport1/);
});

test('Focus chip reconciliation keeps stable semantic identity across routine source syncs',()=>{
  const chips=[{dataset:{focusKey:'textureStrength'}},
    {dataset:{focusKey:'textureScale'}}];
  const fields=[{name:'textureStrength'},{name:'textureScale'}];
  assert.equal(sameFocusChipInventory(chips,fields),true);
  // Replacing the source input instance or its numeric value does not change
  // the active tool's chip inventory or justify destroying keyboard focus.
  assert.equal(sameFocusChipInventory(chips,[
    {name:'textureStrength',value:'72'},{name:'textureScale',value:'30'}]),true);
  assert.equal(sameFocusChipInventory(chips,fields.slice(0,1)),false);
  assert.equal(sameFocusChipInventory(chips,[fields[1],fields[0]]),false);
  assert.equal(sameFocusChipInventory(chips,[fields[0],{name:'textureRotation'}]),false);
  assert.equal(sameFocusChipInventory([],[]),true);
  assert.equal(sameFocusChipInventory(null,fields),false);
  assert.equal(sameFocusChipInventory(chips,[fields[0],{}]),false);
  const source=requireFocusSource();
  assert.match(source,/const sameInventory=sameFocusChipInventory\(existing,available\)/);
  assert.match(source,/if\(!sameInventory\)\{\s*chips\.replaceChildren\(\)/);
  assert.match(source,/if\(focusedKey&&!sameInventory\)/);
  assert.match(source,/if\(focusedKey\)all\.focus\(\{preventScroll:true\}\)/);
  assert.match(source,/const current=available\.find\(candidate=>candidate\.name===chip\.dataset\.focusKey\)/);
});


test('Focus keeps the selected named parameter through source input replacement',()=>{
  const first={name:'embroideryDirection',value:'15'};
  const second={name:'textureRotation',value:'30'};
  const fields=[first,second];
  assert.equal(focusSelectedField(fields,second),second,
    'retain the identical live source instance when available');
  const newFields=[{name:'embroideryDirection',value:'88'},
    {name:'textureRotation',value:'45'}];
  assert.equal(focusSelectedField(newFields,second),newFields[1],
    'retained Focus choice must follow semantic identity, not first-chip order');
  assert.equal(focusSelectedField(newFields,{name:'removedParameter'}),newFields[0],
    'a tool change with no matching parameter falls back to the first live one');
  assert.equal(focusSelectedField(newFields,null),newFields[0]);
  assert.equal(focusSelectedField([],second),null);
  assert.equal(focusSelectedField(null,second),null);
  const source=requireFocusSource();
  assert.match(source,/choose\(focusSelectedField\(available,original\)\)/,
    'the real mounted Focus installer must reuse the same semantic resolver');
});
