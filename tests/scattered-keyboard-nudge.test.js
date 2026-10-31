import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nudgeScatteredRegion} from '../src/scattered-drag.js';
const recipe={structure:'regions',regionMode:'scattered',
  scatteredOverrides:[{index:1,x:.2,y:.4,radius:.12},
    {index:3,x:.77,y:.2,radius:.15}],otherSetting:'unchanged'};
const circle={cx:120,cy:520,r:72};
const nudge=(key,options={},input=recipe,shape=circle)=>
  nudgeScatteredRegion(input,1,shape,key,options);
test('shape keyboard arrows move in authored X/Y fractions independent of screen size',()=>{
  const before=structuredClone(recipe);
  const right=nudge('ArrowRight');
  const up=nudge('ArrowUp');
  assert.equal(right.scatteredOverrides[0].x,.21,'1% of 600 design units');
  assert.equal(up.scatteredOverrides[0].y,.39,'1% of 1300 design units');
  assert.equal(nudge('ArrowDown',{coarse:true}).scatteredOverrides[0].y,.45);
  assert.equal(nudge('ArrowLeft',{fine:true}).scatteredOverrides[0].x,.199);
  assert.equal(nudge('ArrowRight',{coarse:true,fine:true}).scatteredOverrides[0].x,.201,
    'fine Control/Command override takes precedence over coarse Shift');
  assert.deepEqual(right.scatteredOverrides[1],recipe.scatteredOverrides[1]);
  assert.equal(right.otherSetting,'unchanged');
  assert.deepEqual(recipe,before,'original source is immutable');
  assert.equal(right.scatteredOverrides[0].radius,.12);
});
test('invalid selection and non-arrow keys never write an override',()=>{
  assert.equal(nudge('Escape'),recipe);
  assert.equal(nudgeScatteredRegion(recipe,-1,circle,'ArrowRight'),recipe);
  assert.equal(nudgeScatteredRegion(recipe,70,circle,'ArrowRight'),recipe);
  assert.equal(nudgeScatteredRegion(recipe,1,{...circle,cx:NaN},'ArrowRight'),recipe);
  assert.equal(nudgeScatteredRegion(recipe,1,null,'ArrowRight'),recipe);
  assert.equal(nudgeScatteredRegion(null,1,circle,'ArrowRight'),null);
});
test('edges fail closed without no-op history and preserve allowable negative bounds',()=>{
  const farRight={cx:900,cy:0,r:30};
  const farLeft={cx:-300,cy:0,r:30};
  assert.equal(nudge('ArrowRight',{},recipe,farRight),recipe);
  assert.equal(nudge('ArrowLeft',{},recipe,farLeft),recipe);
  const high={cx:10,cy:-650,r:30};
  const low={cx:10,cy:1950,r:30};
  assert.equal(nudge('ArrowUp',{},recipe,high),recipe);
  assert.equal(nudge('ArrowDown',{},recipe,low),recipe);
  const advance=nudge('ArrowRight',{},recipe,farLeft);
  assert.equal(advance.scatteredOverrides[0].x,-.49);
});
test('keyboard outline is focusable, scope-limited and uses existing Undo route',()=>{
  const code=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../scattered-shapes.css',import.meta.url),'utf8');
  assert.match(code,/scatteredDirectOutline\.tabIndex=0/);
  assert.match(code,/scatteredDirectOutline\.setAttribute\('aria-keyshortcuts'/);
  assert.match(code,/event\.target!==scatteredDirectOutline/);
  assert.match(code,/nudgeScatteredRegion\(current,index,circle,event\.key/);
  assert.match(code,/cause:'scattered_move_keyboard'/);
  assert.match(code,/const mobileEntry=document\.body\.classList\.contains\('mobile-studio'\)/);
  assert.match(code,/\(mobileEntry\|\|moveOnCanvas\)\.focus/);
  assert.match(code,/event\.preventDefault\(\);event\.stopPropagation\(\);\s*setScatteredDirectActive\(false\)/);
  assert.match(css,/\.scattered-direct-outline:focus-visible/);
});
