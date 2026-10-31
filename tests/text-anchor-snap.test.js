import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,DESIGN_WIDTH,DESIGN_HEIGHT} from '../src/model.js';
import {dragTextOverlay} from '../src/text-direct-geometry.js';
import {snapTextAnchor} from '../src/text-anchor-snap.js';
const view={cssWidth:300,cssHeight:650};
const recipe=normalizeRecipe({textOverlays:[
  {id:'moving',text:'RAINBOW',x:25,y:25,size:40},
  {id:'guide',text:'VISIBLE',x:60,y:40,size:40,locked:true},
  {id:'hidden',text:'HIDDEN',x:75,y:70,size:40,enabled:false},
  {id:'transparent',text:'GHOST',x:90,y:80,size:40,opacity:0}
]});
const items=recipe.textOverlays;
const snap=(point,options={},list=items,rect=view)=>
  snapTextAnchor(point,list,'moving',rect,{enabled:true,...options});
test('text anchors align in CSS screen units without editing the source',()=>{
  const original=structuredClone(recipe);
  const result=snap([DESIGN_WIDTH*.6+12,DESIGN_HEIGHT*.4+10]);
  assert.deepEqual(result.point,[DESIGN_WIDTH*.6,DESIGN_HEIGHT*.4]);
  assert.equal(result.locks.x.id,'text:guide');
  assert.equal(result.locks.y.id,'text:guide');
  assert.deepEqual(recipe,original);
  const source=items[0];
  const moved=dragTextOverlay(recipe,'moving',{
    x:result.point[0]-DESIGN_WIDTH*source.x/100,
    y:result.point[1]-DESIGN_HEIGHT*source.y/100});
  assert.equal(moved.textOverlays[0].x,60);
  assert.equal(moved.textOverlays[0].y,40);
  assert.equal(moved.textOverlays[1].locked,true);
});
test('hysteresis holds and releases independent guide axes',()=>{
  const held=snap([DESIGN_WIDTH*.6+12,DESIGN_HEIGHT*.4+10]);
  const still=snap([DESIGN_WIDTH*.6+23,DESIGN_HEIGHT*.4+10],
    {previous:held.locks});
  assert.equal(still.point[0],DESIGN_WIDTH*.6);
  const released=snap([DESIGN_WIDTH*.6+31,DESIGN_HEIGHT*.4+10],
    {previous:still.locks});
  assert.equal(released.point[0],DESIGN_WIDTH*.6+31);
  assert.equal(released.locks.x,null);
});
test('axis constraint excludes the stationary dimension',()=>{
  const result=snap([DESIGN_WIDTH*.6+12,DESIGN_HEIGHT*.4+10],{axis:'x'});
  assert.equal(result.point[0],DESIGN_WIDTH*.6);
  assert.equal(result.point[1],DESIGN_HEIGHT*.4+10);
  assert.equal(result.locks.y,null);
});
test('hidden ink cannot guide text; art centre remains a source guide',()=>{
  const hidden=snap([DESIGN_WIDTH*.75+4,DESIGN_HEIGHT*.7+4]);
  assert.equal(hidden.locks.x,null);
  assert.equal(hidden.locks.y,null);
  const centre=snap([DESIGN_WIDTH/2+8,DESIGN_HEIGHT/2+8],{},[]);
  assert.deepEqual(centre.point,[DESIGN_WIDTH/2,DESIGN_HEIGHT/2]);
  assert.equal(centre.locks.x.id,'design-centre');
});
test('physical snap reach follows the actual CSS display dimensions',()=>{
  assert.equal(snap([DESIGN_WIDTH*.6+12,DESIGN_HEIGHT*.4+10]).locks.x?.id,
    'text:guide');
  const large=snap([DESIGN_WIDTH*.6+12,DESIGN_HEIGHT*.4+10],{},items,
    {cssWidth:600,cssHeight:1300});
  assert.equal(large.locks.x,null);
  assert.equal(large.locks.y,null);
});
test('disabled and invalid viewports fail closed',()=>{
  const point=[42,70];
  assert.deepEqual(snapTextAnchor(point,items,'moving',view),
    {point,locks:{x:null,y:null}});
  assert.deepEqual(snap(point,{},items,{cssWidth:0,cssHeight:650}),
    {point,locks:{x:null,y:null}});
  assert.equal(snap([NaN,70]).point,null);
  assert.deepEqual(snap([12,43],{},null).point,[12,43]);
});
test('touch mover uses one canonical transaction and a separate 44px toggle',()=>{
  const source=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../text-overlays.css',import.meta.url),'utf8');
  assert.match(source,/snapButton\.setAttribute\('aria-pressed'/);
  assert.match(source,/snapEnabled,snapLocks:/);
  assert.match(source,/snapTextAnchor\(anchor,drag\.original\.textOverlays/);
  assert.match(source,/changeRecipe\(finished\.next,\{cause:'text_move_on_canvas'\}\)/);
  assert.match(css,/#textDirectSnap\{[^}]*min-height:44px/);
});
