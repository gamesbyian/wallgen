import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeTextOverlays} from '../src/text-overlays.js';
import {canCurveText,layoutTextOnPath,textPathStation} from '../src/text-path-geometry.js';
import {drawTextOverlays} from '../src/text-overlay-renderer.js';
function context(){
  const calls=[];
  return {calls,globalAlpha:1,
    save(){calls.push(['save']);},restore(){calls.push(['restore']);},
    scale(...p){calls.push(['scale',...p]);},
    translate(...p){calls.push(['translate',...p]);},
    rotate(v){calls.push(['rotate',v]);},
    measureText(t){return {width:[...t].length*13};},
    strokeText(...p){calls.push(['stroke',...p]);},
    fillText(...p){calls.push(['fill',...p,this.fillStyle]);},
    createLinearGradient(...p){
      const stops=[];calls.push(['gradient',p,stops]);
      return {addColorStop(offset,col){stops.push([offset,col]);}};
    },
  };
}
test('path metadata remains canonical opt-in and transferable',()=>{
  const before=normalizeTextOverlays([{text:'HELLO'}])[0];
  assert.ok(!Object.hasOwn(before,'path'));
  const after=normalizeTextOverlays([{text:'HELLO',path:'wave',pathHeight:999}])[0];
  assert.deepEqual({path:after.path,height:after.pathHeight},{path:'wave',height:240});
  assert.deepEqual(normalizeTextOverlays([after])[0],after);
  const reset=normalizeTextOverlays([{...after,path:'unsupported'}])[0];
  assert.ok(!Object.hasOwn(reset,'path'));
  assert.ok(!Object.hasOwn(reset,'pathHeight'));
  const recipe=normalizeRecipe({textOverlays:[{text:'RAINBOW',path:'circle',pathHeight:165}]});
  assert.deepEqual(recipe.textOverlays,resolveScene(recipe).textOverlays);
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe);
});
test('canonical wave and arch share source ribbon path sampling; circle has tangent',()=>{
  for(const path of ['wave','arc','circle']){
    const item={path,pathHeight:120,size:64,x:50};
    const samples=[-60,0,60].map(d=>textPathStation(item,d,564));
    assert.ok(samples.every(s=>Object.values(s).every(Number.isFinite)));
    assert.ok(samples.some(s=>Math.abs(s.angle)>.05),path+' bends tangent');
    assert.ok(samples.some(s=>Math.abs(s.y)>1),path+' bends baseline');
  }
});
test('curved layout is finite, bounded and preserves authored grapheme units',()=>{
  const item={path:'circle',pathHeight:80,size:64,x:50};
  const shaped=layoutTextOnPath(item,'A🌈e\u0301',s=>[...s].length*17);
  assert.equal(shaped.supported,true);
  assert.deepEqual(shaped.glyphs.map(g=>g.text),['A','🌈','e\u0301']);
  assert.ok(shaped.glyphs.every(g=>Math.abs(g.x)<150&&Math.abs(g.y)<150));
  const long=layoutTextOnPath(item,'W'.repeat(160),()=>30);
  assert.ok(long.shrink<1);
  assert.ok(long.glyphs.every(g=>[g.x,g.y,g.angle].every(Number.isFinite)));
});
test('Arabic, RTL and joining scripts are not fragmented on curved baselines',()=>{
  assert.equal(canCurveText('مرحبا بالعالم'),false);
  assert.equal(canCurveText('שלום'),false);
  assert.equal(canCurveText('हिन्दी'),false);
  assert.equal(canCurveText('👩‍🔬'),false);
  assert.equal(canCurveText('Hello 🌈'),true);
  const scene=resolveScene(normalizeRecipe({textOverlays:[
    {text:'مرحبا',path:'wave',font:'editorial',colour:'black',outline:'none'},
  ]}));
  const ctx=context();drawTextOverlays(ctx,600,1300,scene);
  assert.deepEqual(ctx.calls.filter(x=>x[0]==='fill').map(x=>x[1]),['مرحبا']);
});
test('curved letters paint in existing shared pass, rainbow and stroke retained',()=>{
  const scene=resolveScene(normalizeRecipe({textOverlays:[{
    id:'arc',text:'RAIN BOW',path:'arc',pathHeight:75,
    colour:'rainbow-letter',outline:'white',size:85
  }]}));
  const a=context(),b=context();
  drawTextOverlays(a,600,1300,scene);
  drawTextOverlays(b,3024,6552,scene);
  const fills=a.calls.filter(x=>x[0]==='fill');
  assert.equal(fills.length,8);
  assert.deepEqual(fills.map(x=>x[1]),[...'RAIN BOW']);
  assert.equal(a.calls.filter(x=>x[0]==='stroke').length,8);
  assert.deepEqual(a.calls.filter(x=>x[0]==='scale')[0],['scale',1,1]);
  assert.deepEqual(b.calls.filter(x=>x[0]==='scale')[0],['scale',3024/600,6552/1300]);
  assert.deepEqual(fills.map(x=>x[4]).filter((_,i)=>i!==4),
    scene.stripes.map(s=>s.color));
});
