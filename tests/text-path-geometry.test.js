import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeTextOverlays} from '../src/text-overlays.js';
import {canCurveText,layoutTextOnPath,textPathStation,prepareTextFollowPath,
  hitTextAtLayout} from '../src/text-path-geometry.js';
import {drawTextOverlays} from '../src/text-overlay-renderer.js';
import {hitTextOverlay,measuredTextBounds} from '../src/text-direct-geometry.js';
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

test('curved layout expands direct-manipulation hit guide without changing straight hit geometry',()=>{
  const line={text:'RAINBOW',x:50,y:50,size:64,rotation:0,
    enabled:true,outline:'none'};
  const curved={...line,path:'circle',pathHeight:150};
  const straight=measuredTextBounds(line,t=>t.length*13);
  const curvedBounds=measuredTextBounds(curved,t=>t.length*13);
  assert.equal(straight.height,64*1.17);
  assert.ok(curvedBounds.height>straight.height+200);
  const point={x:300,y:520};
  assert.equal(hitTextOverlay([line],point,(item,t)=>t.length*13),null);
  assert.equal(hitTextOverlay([curved],point,(item,t)=>t.length*13),curved);
});

test('authored Draw path is the canonical text baseline and stays live-editable',()=>{
  const item={path:'drawn',size:64,pathHeight:90,x:50};
  const points=[[.16,.4],[.28,.34],[.5,.45],[.72,.56],[.85,.48]];
  const path=prepareTextFollowPath(item,points);
  assert.ok(path.total>100);
  const a=layoutTextOnPath(item,'DRAW ALONG ME',t=>t.length*12,points);
  assert.equal(a.supported,true);
  assert.ok(a.glyphs.some(g=>Math.abs(g.angle)>.05));
  assert.ok(a.glyphs.every(g=>[g.x,g.y,g.angle].every(Number.isFinite)));
  const shifted=points.map(([x,y],i)=>[x,y+(i===2?.17:0)]);
  const b=layoutTextOnPath(item,'DRAW ALONG ME',t=>t.length*12,shifted);
  assert.notDeepEqual(a.glyphs.map(g=>g.y),b.glyphs.map(g=>g.y),
    'editing canonical Draw points must change the text curve without a sidecar');
  assert.equal(layoutTextOnPath(item,'WORDS',t=>t.length*12,[]).supported,false,
    'missing Draw path must use the unfragmented native straight fallback');
});
test('hairpin and loop sample the existing path geometry by actual arc length',()=>{
  for(const mode of ['hairpin','loop']){
    const item={path:mode,size:56,pathHeight:110,x:50};
    const path=prepareTextFollowPath(item);
    assert.ok(path?.total>1000);
    const chars=layoutTextOnPath(item,'A LENGTHY CURVE',t=>t.length*13);
    assert.ok(chars.supported);
    assert.equal(chars.glyphs.length,15);
    assert.ok(chars.glyphs.every(g=>[g.x,g.y,g.angle].every(Number.isFinite)));
    const distances=chars.glyphs.map(g=>g.distance);
    assert.ok(distances.every((d,i)=>i===0||d>=distances[i-1]));
    assert.ok(chars.glyphs.some(g=>Math.abs(g.angle)>.05));
  }
});
test('new path modes survive transport and conservative hit bounds are finite',()=>{
  const recipe=normalizeRecipe({customPath:[[.1,.1],[.9,.9]],
    textOverlays:[{id:'a',text:'SOME WORDS',path:'drawn',font:'editorial'},
      {id:'b',text:'LOOP ME',path:'loop',pathHeight:140}]});
  assert.equal(recipe.textOverlays[0].path,'drawn');
  assert.equal(recipe.textOverlays[1].path,'loop');
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe);
  for(const item of recipe.textOverlays){
    const bounds=measuredTextBounds(item,t=>t.length*17);
    assert.ok([bounds.width,bounds.height].every(x=>Number.isFinite(x)&&x>0));
  }
});

const pickMeasure=(item,value)=>[...value].length*item.size*.55;
test('direct picking ignores hollow arc centre, exposes underlying text and selects actual glyph stations',()=>{
  const bottom={id:'bottom',text:'X',enabled:true,x:50,y:50,size:64,
    rotation:0,outline:'none'};
  const top={id:'top',text:'RAINBOW',enabled:true,x:50,y:50,
    size:64,rotation:0,path:'circle',pathHeight:175,outline:'none'};
  const center={x:300,y:650};
  assert.equal(hitTextOverlay([bottom,top],center,pickMeasure)?.id,'top',
    'historic broad guide falsely captures the hollow centre');
  assert.equal(hitTextAtLayout([bottom,top],center,pickMeasure)?.id,'bottom');
  const shaped=layoutTextOnPath(top,top.text,s=>pickMeasure(top,s));
  const glyph=shaped.glyphs.find(g=>g.text==='N');
  const onInk={x:300+glyph.x,y:650+glyph.y};
  assert.equal(hitTextAtLayout([bottom,top],onInk,pickMeasure)?.id,'top');
  assert.equal(hitTextAtLayout([top],center,pickMeasure),null);
});
test('multiline blank gutter is not a text hit even within overall guide',()=>{
  const item={id:'two',text:'TOP\nBOTTOM',enabled:true,
    x:50,y:50,size:42,rotation:0,lineSpacing:100,outline:'none'};
  assert.ok(measuredTextBounds(item,s=>pickMeasure(item,s)).height>170);
  assert.equal(hitTextAtLayout([item],{x:300,y:650},pickMeasure),null);
  const offset=item.size*1.17*2/2;
  assert.equal(hitTextAtLayout([item],{x:300,y:650-offset},pickMeasure)?.id,'two');
  assert.equal(hitTextAtLayout([item],{x:300,y:650+offset},pickMeasure)?.id,'two');
});
test('rotated authored Draw pick tracks actual editable source geometry',()=>{
  const customPath=[[.08,.45],[.3,.38],[.5,.52],[.76,.62],[.94,.54]];
  const item={id:'drawn',text:'FOLLOW',enabled:true,
    x:50,y:50,size:64,rotation:55,path:'drawn',
    outline:'none',pathHeight:80};
  const layout=layoutTextOnPath(item,item.text,s=>pickMeasure(item,s),customPath);
  assert.equal(layout.supported,true);
  const glyph=layout.glyphs.find(g=>g.text==='O');
  const theta=item.rotation*Math.PI/180;
  const point={x:300+glyph.x*Math.cos(theta)-glyph.y*Math.sin(theta),
    y:650+glyph.x*Math.sin(theta)+glyph.y*Math.cos(theta)};
  assert.equal(hitTextAtLayout([item],point,pickMeasure,{customPath})?.id,'drawn');
  assert.equal(hitTextAtLayout([item],{x:0,y:0},pickMeasure,{customPath}),null);
  assert.equal(hitTextAtLayout([item],{x:300,y:650},pickMeasure,
    {customPath:[]})?.id,'drawn',
    'missing Draw path falls back to native straight-line hit');
});
test('unsupported joining scripts are selected as whole native lines',()=>{
  const item={id:'rtl',text:'مرحبا',enabled:true,
    x:50,y:50,size:64,path:'wave',outline:'none'};
  assert.equal(hitTextAtLayout([item],{x:300,y:650},pickMeasure)?.id,'rtl');
});

test('prepared curves preserve exactly the same native canonical station positions',()=>{
  const points=[[.04,.36],[.18,.3],[.39,.46],[.62,.55],[.87,.38],[.98,.44]];
  const measure=value=>[...value].length*15;
  for(const mode of ['drawn','hairpin','loop']){
    const item={text:'ROYGBIV\\nCURVES',x:50,y:50,size:60,
      path:mode,pathHeight:125,outline:'none'};
    const prepared=prepareTextFollowPath(item,points);
    assert.ok(prepared?.total>100);
    for(const line of ['ROYGBIV','CURVES','A DRAWN LINE','FOLLOW THE RAINBOW']){
      const regular=layoutTextOnPath(item,line,measure,points);
      const shared=layoutTextOnPath(item,line,measure,points,{preparedPath:prepared});
      assert.deepEqual(shared,regular,mode+' shared path must not alter a station');
    }
  }
});
test('a provided layout sampler is called once per glyph and cached invalid Draw path stays invalid',()=>{
  const item={text:'TEXT',x:50,y:50,size:52,path:'drawn',pathHeight:90};
  let calls=0;
  const sample={total:500,sample(distance){
    calls++;
    return {x:distance,y:distance/4,angle:.2};
  }};
  const result=layoutTextOnPath(item,'TEXT',()=>18,[],{preparedPath:sample});
  assert.equal(result.supported,true);
  assert.equal(calls,4,'already prepared geometry must be reused rather than recalculated');
  assert.equal(layoutTextOnPath(item,'TEXT',()=>18,[],{preparedPath:null}).supported,false,
    'null marks an already checked but invalid Draw path, avoiding repeat work');
});
