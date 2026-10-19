import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {focusEligible,adjustedValue,focusChipDestination,focusUnavailableReason} from '../src/editor-focus.js';
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
  assert.match(focusUnavailableReason({inactive:true}),/inactive.*current design/i);
  assert.match(focusUnavailableReason({disabled:true}),/temporarily unavailable/i);
  assert.match(focusUnavailableReason({inactive:true,locked:true}),/locked/i);
  const src=readFileSync(new URL('../src/editor-focus.js',import.meta.url),'utf8');
  assert.match(src,/help\.textContent=disabled\?unavailableReason\(original\)/);
  assert.match(src,/locked:Boolean\(field\.closest\('\.lockable-setting'\)/);
});
