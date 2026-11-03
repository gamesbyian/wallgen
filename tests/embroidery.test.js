import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';
import {normalizeSurfaceTreatments,matchingEmbroidery,drawRibbonEmbroidery,drawRegionEmbroidery} from '../src/embroidery.js';
import {sandLighting} from '../src/sand-lighting.js';

const select=(opts={})=>normalizeSurfaceTreatments([{
  id:'thread-1',enabled:true,target:{scope:'palette',role:'fill',colorSlots:[1],ids:[]},
  pitch:5,relief:65,...opts
}])[0];

test('legacy artwork stays free of embroidery state, and treatment survives recipe transport',()=>{
  const old=normalizeRecipe({seed:'legacy',material:'linen'});
  assert.equal(Object.hasOwn(old,'surfaceTreatments'),false);
  assert.equal(Object.hasOwn(resolveScene(old),'surfaceTreatments'),false);
  const recipe=normalizeRecipe({...old,surfaceTreatments:[select()]});
  assert.equal(recipe.surfaceTreatments.length,1);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual(normalizeRecipe(recipe),recipe);
});
test('targeting distinguishes authored object ID, palette slot and inactive roles',()=>{
  const red=select({target:{scope:'palette',role:'fill',colorSlots:[0],ids:[]}});
  const violet=select({id:'violet',target:{scope:'palette',role:'fill',colorSlots:[6],ids:[]}});
  const chosen=select({id:'exact',target:{scope:'object',role:'fill',colorSlots:[],ids:['region-3']}});
  const all=select({id:'all',target:{scope:'all',role:'fill',colorSlots:[],ids:[]}});
  assert.strictEqual(matchingEmbroidery([red,violet],{id:'region-0',colorSlot:0}),red);
  assert.strictEqual(matchingEmbroidery([red,violet],{id:'region-6',colorSlot:6}),violet);
  assert.equal(matchingEmbroidery([red,violet],{id:'region-3',colorSlot:2}),null);
  assert.strictEqual(matchingEmbroidery([chosen],{id:'region-3',colorSlot:5}),chosen);
  assert.equal(matchingEmbroidery([chosen],{id:'region-4',colorSlot:5}),null);
  assert.equal(matchingEmbroidery([all],{id:'region-3',colorSlot:0,role:'outline'}),null);
  assert.strictEqual(matchingEmbroidery([all],{id:'region-3',colorSlot:0}),all);
  assert.equal(matchingEmbroidery([{...all,enabled:false}],{id:'region-3',colorSlot:0}),null);
});
test('hostile records are bounded, deduplicated and cannot inject wildcard object IDs',()=>{
  const incoming=[{id:'valid',enabled:true,pitch:-100,relief:800,
    target:{scope:'object',ids:['region-2','invalid id','region-2'],colorSlots:[0,9,-1],role:'outline'}},
    {id:'valid',enabled:true},{id:'<script>',enabled:true}];
  const values=normalizeSurfaceTreatments(incoming);
  assert.equal(values.length,1);
  assert.deepEqual(values[0].target.ids,['region-2']);
  assert.deepEqual(values[0].target.colorSlots,[0]);
  assert.equal(values[0].target.role,'fill');
  assert.equal(values[0].pitch,2);
  assert.equal(values[0].relief,100);
});
const fakeContext=()=>{
  const counters={strokes:0,segments:0,rotates:0,saves:0,restores:0};
  return {counters,save(){counters.saves++},restore(){counters.restores++},
    beginPath(){},moveTo(){counters.segments++},lineTo(){},stroke(){counters.strokes++},
    translate(){},rotate(){counters.rotates++}};
};
test('a straight path uses its actual width/tangent to emit bounded transverse rows',()=>{
  const scene=resolveScene({seed:'embroidered-path',geometry:'straight',motif:'solid'});
  const stripe=scene.stripes[0], ctx=fakeContext();
  const count=drawRibbonEmbroidery(ctx,stripe,scene.extent,select());
  assert.ok(count>100);
  assert.equal(ctx.counters.strokes,count*2);
  assert.equal(ctx.counters.saves,ctx.counters.restores);
  assert.equal(drawRibbonEmbroidery(ctx,stripe,scene.extent,null),0);
});
test('closed circle and compound silhouette produce deterministic thread rows',()=>{
  const ctx=fakeContext(),style=select();
  const circle={circle:{cx:200,cy:230,r:28}};
  const paths={rings:[[{x:20,y:10},{x:110,y:10},{x:110,y:100},{x:20,y:100}]],
    vertices:[{x:20,y:10},{x:110,y:10},{x:110,y:100},{x:20,y:100}]};
  const a=drawRegionEmbroidery(ctx,circle,style);
  const b=drawRegionEmbroidery(ctx,paths,style);
  assert.ok(a>0&&b>0);
  assert.equal(ctx.counters.rotates,2);
  assert.equal(ctx.counters.saves,ctx.counters.restores);
  assert.equal(drawRegionEmbroidery(ctx,circle,null),0);
});

test('specific target outranks palette and all treatments regardless of array order',()=>{
  const global=select({id:'global',target:{scope:'all',role:'fill',colorSlots:[],ids:[]}});
  const palette=select({id:'palette',target:{scope:'palette',role:'fill',colorSlots:[2],ids:[]}});
  const object=select({id:'object',target:{scope:'object',role:'fill',colorSlots:[],ids:['region-4']}});
  for(const treatments of [[global,palette,object],[object,global,palette],[palette,object,global]]){
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-4',colorSlot:2}),object);
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-5',colorSlot:2}),palette);
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-5',colorSlot:3}),global);
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-4',colorSlot:2,role:'outline'}),null);
  }
  assert.strictEqual(matchingEmbroidery([global,global],{id:'anything',colorSlot:4}),global);
});
test('tatami on a clipped region draws staggered short rows; satin remains long ribs',()=>{
  const rectangle={rings:[[{x:0,y:0},{x:200,y:0},{x:200,y:80},{x:0,y:80}]],
    vertices:[{x:0,y:0},{x:200,y:0},{x:200,y:80},{x:0,y:80}]};
  const segments=()=>{const strokes=[];let first=null;
    return {strokes,save(){},restore(){},translate(){},rotate(){},beginPath(){},
      moveTo(x,y){first=[x,y]},lineTo(x,y){strokes.push([first,[x,y]])},stroke(){}};
  };
  const satin=segments(),tatami=segments();
  const long=drawRegionEmbroidery(satin,rectangle,select({style:'satin',pitch:8}));
  const short=drawRegionEmbroidery(tatami,rectangle,select({style:'tatami',pitch:8}));
  assert.ok(long>0&&short>long);
  assert.equal(satin.strokes.length,long*2);
  assert.equal(tatami.strokes.length,short*2);
  assert.ok(tatami.strokes.every(([[a],[b]])=>b-a<80),'tatami threads must be short');
  const repeat=segments();
  drawRegionEmbroidery(repeat,rectangle,select({style:'tatami',pitch:8}));
  assert.deepEqual(tatami.strokes,repeat.strokes,'same authored grid, no RNG');
});

test('authored tatami courses cannot claim transverse contact between parallel source rows',()=>{
  // Source truth: the production painter lays each region-tatami centreline
  // at y=k*pitch before one global rotation. Separate courses remain
  // parallel under that rotation; shadow/glint offsets are NOT new yarn
  // crossings. Keep the issue conditional on a genuinely authored
  // intersecting course, not a proximity-based fake shadow.
  const object={rings:[[
    {x:50,y:640},{x:550,y:640},{x:550,y:660},{x:50,y:660}
  ]]};
  for(const [pitch,direction] of [[2,0],[5,38],[16,73]]){
    const paths=[],context={
      save(){},restore(){},translate(){},rotate(){},beginPath(){},
      moveTo(x,y){this.start={x,y}},
      lineTo(x,y){paths.push({start:{...this.start},end:{x,y}})},
      stroke(){}
    };
    const stitches=drawRegionEmbroidery(context,object,
      select({style:'tatami',pitch,direction,relief:100}),null);
    assert.ok(stitches>0,'test must exercise the live source painter');
    assert.equal(paths.length,2*stitches,
      'unlit original tatami has two ink strokes for each real source stitch');
    const courses=new Map();
    for(let i=0;i<paths.length;i+=2){
      const lower=paths[i],upper=paths[i+1];
      assert.equal(lower.start.x,upper.start.x);
      assert.equal(lower.end.x,upper.end.x);
      assert.equal(lower.start.y-lower.end.y,0);
      assert.equal(upper.start.y-upper.end.y,0);
      const y=(lower.start.y+upper.start.y)/2;
      assert.ok(Math.abs(lower.start.y-upper.start.y-1)<1e-9,
        'two side shadings must still belong to one unchanged source course');
      if(!courses.has(y))courses.set(y,[]);
      courses.get(y).push([lower.start.x,lower.end.x]);
    }
    const ys=[...courses.keys()].sort((a,b)=>a-b);
    assert.ok(ys.length>1,'source must contain multiple original courses');
    for(let i=1;i<ys.length;i++)assert.ok(ys[i]-ys[i-1]>=pitch-1e-8,
      'distinct tatami source centrelines are pitch-separated, never transverse');
    for(const pieces of courses.values()){
      pieces.sort((a,b)=>a[0]-b[0]);
      for(let i=1;i<pieces.length;i++)
        assert.ok(pieces[i][0]-pieces[i-1][1]>=1.4-1e-8,
          'tatami centrelines retain their 1.4-unit original station gap; round yarn caps may overlap at high pitch');
    }
    // Applying the single ctx.rotate(direction) to every course cannot
    // manufacture a transverse intersection from these parallel lines.
    // New cross-hatching or manually crossing source segments would need
    // their own intentionally authored geometry before contact shading.
  }
});

test('only genuine same-row round tatami cap overlap receives bounded directional contact ink',()=>{
  const object={rings:[[
    {x:50,y:640},{x:550,y:640},{x:550,y:660},{x:50,y:660}
  ]]};
  const lamp=sandLighting({lightingMood:'daylight',
    lightDirection:'top-left',lightStrength:90,shadowStrength:80});
  const record=()=>{const ops={strokes:0,clips:0,arcs:0,fills:0,saves:0,restores:0};
    return {...ops,ops,save(){ops.saves++},restore(){ops.restores++},
      translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},
      stroke(){ops.strokes++},arc(){ops.arcs++},closePath(){},
      clip(){ops.clips++},fill(){ops.fills++}};
  };
  const low=record(),standard=record(),wide=record(),unlit=record(),
    fibre=record(),fibreLow=record(),fibreUnlit=record(),
    running=record(),rotated=record();
  // Original adjacent short stitch centres are separated by exactly 1.4;
  // at pitch 5, real round yarn width 1.25 has no endcap overlap.
  assert.ok(drawRegionEmbroidery(low,object,
    select({style:'tatami',pitch:5}),lamp)>0);
  assert.equal(low.ops.fills,0);
  assert.equal(low.ops.clips,0);
  // Pitch 8 -> 2-unit round yarn: adjacent 1.4-unit gap has a true
  // 0.6-unit overlapping capsule lens. It is legitimate source contact.
  const count=drawRegionEmbroidery(standard,object,
    select({style:'tatami',pitch:8}),lamp);
  assert.ok(count>0&&standard.ops.fills>0);
  assert.equal(standard.ops.clips,standard.ops.fills*2,
    'each contact is clipped to BOTH exact original lower and upper yarn capsules');
  assert.equal(standard.ops.arcs,standard.ops.fills*5,
    'each pair of round capsules contributes four semicircles and one local contact shadow disk');
  assert.equal(standard.ops.saves,standard.ops.restores,
    'nested intersection clip always restores the original region canvas state');
  drawRegionEmbroidery(wide,object,select({style:'tatami',pitch:16}),lamp);
  assert.ok(wide.ops.fills>0);
  assert.equal(wide.ops.clips,wide.ops.fills*2);
  // The same 8-unit source without an active lamp retains its exact
  // historical double-ink paths, with no extra contact clip/painting.
  assert.equal(drawRegionEmbroidery(unlit,object,
    select({style:'tatami',pitch:8}),null),count);
  assert.equal(unlit.ops.fills,0);
  // Fibre tatami's actual underlying shadow stroke has width .32*pitch,
  // whereas the visible microstrands are too thin to reach one another.
  // The 1.4-unit source gap is physically bridged at pitch 8 (2.56-wide
  // underlay) but not at pitch 4 (1.28-wide underlay).
  drawRegionEmbroidery(running,object,select({style:'running',pitch:8}),lamp);
  drawRegionEmbroidery(fibre,object,select({style:'tatami-fibre',pitch:8}),lamp);
  drawRegionEmbroidery(fibreLow,object,select({style:'tatami-fibre',pitch:4}),lamp);
  drawRegionEmbroidery(fibreUnlit,object,select({style:'tatami-fibre',pitch:8}),null);
  assert.equal(running.ops.fills,0);
  assert.ok(fibre.ops.fills>0,'only real adjacent source underlay cap overlaps are shaded');
  assert.equal(fibre.ops.clips,fibre.ops.fills*2,
    'fibre contact shade is clipped by both original underlay capsules');
  assert.equal(fibre.ops.arcs,fibre.ops.fills*5);
  assert.equal(fibre.ops.saves,fibre.ops.restores);
  assert.equal(fibreLow.ops.fills,0,
    'an underlay narrower than the original station gap must remain unchanged');
  assert.equal(fibreUnlit.ops.fills,0,
    'disabling lighting never introduces contact shadows');
  drawRegionEmbroidery(rotated,object,select({style:'tatami',pitch:8,direction:38}),lamp);
  assert.ok(rotated.ops.fills>0,
    'rotating the whole original row may not erase real local same-row contacts');
});

test('source-bounded region tatami omits thousands of off-clip strokes without restarting stitch phases',()=>{
  const object={rings:[[
    {x:50,y:640},{x:550,y:640},{x:550,y:660},{x:50,y:660}
  ]]};
  const record=()=>{const paths=[];let a=null;return{
    paths,save(){},restore(){},translate(){},rotate(){},beginPath(){},
    moveTo(x,y){a=[x,y]},lineTo(x,y){paths.push([a,[x,y]])},stroke(){}
  }};
  const straight=record(),repeat=record(),rotated=record(),running=record();
  const tatami=select({style:'tatami',pitch:5,direction:0});
  const n=drawRegionEmbroidery(straight,object,tatami);
  assert.ok(n>300&&n<600,
    '500×20 original-world rectangle should not paint ~7,144 off-mask tatami pieces');
  assert.equal(straight.paths.length,n*2,
    'unlit tatami still paints the same two original shadow/highlight paths per retained source stitch');
  assert.equal(drawRegionEmbroidery(repeat,object,tatami),n);
  assert.deepEqual(repeat.paths,straight.paths,
    'source bounds do not regenerate the global tatami phase or inject RNG');
  const rotatedCount=drawRegionEmbroidery(rotated,object,
    select({style:'tatami',pitch:5,direction:38}));
  assert.ok(rotatedCount>n&&rotatedCount<2500,
    'oblique narrow-source bounds remain conservative without restoring the full diagonal-sized raster sweep');
  const runCount=drawRegionEmbroidery(running,object,
    select({style:'running',pitch:5,direction:0}));
  assert.ok(runCount>0&&runCount<1000);
  assert.equal(running.paths.length,runCount*2);
});

test('running stitch is an opt-in stable path-following alternative to satin',()=>{
  const source=resolveScene({seed:'stitch-run',structure:'paths',geometry:'wave',motif:'solid'});
  const base=source.stripes[1],step=6;
  const segments=()=>{const strokes=[];let from=null;
    return {strokes,save(){},restore(){},beginPath(){},
      moveTo(x,y){from=[x,y]},lineTo(x,y){strokes.push([from,[x,y]])},
      stroke(){}};
  };
  const satin=segments(),running=segments(),repeat=segments();
  const satinCount=drawRibbonEmbroidery(satin,base,source.extent,select({style:'satin',pitch:step}));
  const runStyle=select({style:'running',pitch:step});
  const runCount=drawRibbonEmbroidery(running,base,source.extent,runStyle);
  drawRibbonEmbroidery(repeat,base,source.extent,runStyle);
  assert.ok(satinCount>50&&runCount>50);
  assert.deepEqual(repeat.strokes,running.strokes);
  assert.notDeepEqual(running.strokes.slice(0,6),satin.strokes.slice(0,6));
  assert.equal(running.strokes.length,runCount*2);
  assert.ok(runCount<=1601*3,'full image must have bounded path-seam work');
  const packed=normalizeRecipe({seed:'stitch-run',surfaceTreatments:[runStyle]});
  assert.equal(decodeRecipe(encodeRecipe(packed)).surfaceTreatments[0].style,'running');
  assert.equal(normalizeSurfaceTreatments([{id:'x',enabled:true,style:'unknown'}])[0].style,'satin');
});

test('a crossing stitch replay uses original global lattice, not restarted local phase',()=>{
  const scene=resolveScene({seed:'run-crossings',structure:'paths',geometry:'loop'});
  const stripe=scene.stripes[0],style=select({style:'running',pitch:5});
  const segments=()=>{const strokes=[];let first=null;
    return {strokes,save(){},restore(){},beginPath(){},
      moveTo(x,y){first=[x,y]},lineTo(x,y){strokes.push([first,[x,y]])},stroke(){}};
  };
  const full=segments(),partial=segments();
  drawRibbonEmbroidery(full,stripe,scene.extent,style);
  drawRibbonEmbroidery(partial,stripe,scene.extent,style,
    {start:-scene.extent*.27,end:scene.extent*.27});
  assert.ok(partial.strokes.length>0&&partial.strokes.length<full.strokes.length);
  const key=stroke=>JSON.stringify(stroke);
  const all=new Set(full.strokes.map(key));
  assert.ok(partial.strokes.every(stroke=>all.has(key(stroke))),
    'foreground repaint must reproduce exactly the original seam stations');
});

test('many imported silhouette vertices never overflow region bound reduction',()=>{
  const ring=[];
  for(let i=0;i<60000;i++){
    const theta=i*Math.PI*2/60000;
    ring.push({x:250+Math.cos(theta)*75,y:340+Math.sin(theta)*45});
  }
  const ctx=fakeContext();
  assert.ok(drawRegionEmbroidery(ctx,{rings:[ring]},select({style:'running'}))>0);
  assert.equal(drawRegionEmbroidery(ctx,{rings:[[]]},select({style:'running'})),0);
  assert.equal(drawRegionEmbroidery(ctx,{rings:[[{x:Infinity,y:0}]]},select({style:'running'})),0);
});

test('Soft satin is opt-in, preserves exact stitch paths and keeps legacy shadow/ink values',()=>{
  const scene=resolveScene({seed:'soft-vs-legacy',structure:'paths',geometry:'loop'});
  const stripe=scene.stripes[1];
  const inkCapture=()=>{const strokes=[];let from=null;return{
    strokes,save(){},restore(){},beginPath(){},
    moveTo(x,y){from=[x,y]},lineTo(x,y){this.to=[x,y]},
    stroke(){strokes.push({start:from,end:this.to,ink:this.strokeStyle})}
  }};
  const old=inkCapture(),soft=inkCapture(),again=inkCapture();
  const previous=select({style:'satin',pitch:5,relief:65});
  const gentle=select({style:'satin-soft',pitch:5,relief:65});
  assert.equal(drawRibbonEmbroidery(old,stripe,scene.extent,previous),
    drawRibbonEmbroidery(soft,stripe,scene.extent,gentle));
  drawRibbonEmbroidery(again,stripe,scene.extent,gentle);
  assert.deepEqual(soft.strokes,again.strokes,'new style must be deterministic');
  assert.ok(soft.strokes.length>100);
  assert.deepEqual(soft.strokes.map(s=>[s.start,s.end]),
    old.strokes.map(s=>[s.start,s.end]),'no changes to station geometry');
  assert.equal(old.strokes[0].ink,'rgba(0,0,0,.31)');
  assert.equal(soft.strokes[0].ink,'rgba(0,0,0,.11)');
  assert.notEqual(old.strokes[1].ink,soft.strokes[1].ink,'highlight reduced');
  const encoded=normalizeRecipe({seed:'soft-persist',surfaceTreatments:[gentle]});
  assert.deepEqual(decodeRecipe(encodeRecipe(encoded)),encoded);
  assert.equal(encoded.surfaceTreatments[0].style,'satin-soft');
});
test('soft satin region retains same stroke geometry with reduced tint',()=>{
  const region={circle:{cx:100,cy:120,r:35}};
  const capture=()=>{const records=[];let start=null;return {records,
    save(){},restore(){},translate(){},rotate(){},beginPath(){},
    moveTo(x,y){start=[x,y]},lineTo(x,y){this.end=[x,y]},
    stroke(){records.push({start,end:this.end,ink:this.strokeStyle})}
  }};
  const old=capture(),gentle=capture();
  const previous=drawRegionEmbroidery(old,region,select({style:'satin'}));
  const modified=drawRegionEmbroidery(gentle,region,select({style:'satin-soft'}));
  assert.equal(previous,modified);
  assert.deepEqual(old.records.map(s=>[s.start,s.end]),gentle.records.map(s=>[s.start,s.end]));
  assert.equal(old.records[0].ink,'rgba(0,0,0,.25)');
  assert.equal(gentle.records[0].ink,'rgba(0,0,0,.09)');
});

test('authored regional stitch directions survive normalization and recipe transport',()=>{
  for(const direction of [-120.5,0,68.75,180]){
    const recipe=normalizeRecipe({seed:'angle-restore',structure:'regions',
      regionMode:'scattered',surfaceTreatments:[{id:'editor-stitches',
        enabled:true,style:'tatami',
        target:{scope:'all',role:'fill',colorSlots:[],ids:[]},
        direction,pitch:5,relief:65}]});
    assert.equal(recipe.surfaceTreatments[0].direction,direction);
    assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
    assert.deepEqual(normalizeRecipe(recipe),recipe);
  }
  assert.equal(normalizeSurfaceTreatments([{id:'safe',enabled:true,direction:900}])[0].direction,180);
  assert.equal(normalizeSurfaceTreatments([{id:'safe',enabled:true,direction:'invalid'}])[0].direction,38);
});

test('chain links use bounded cubic geometry with original-world crossing replay',()=>{
  const scene=resolveScene({seed:'embroider-linked-loop',structure:'paths',geometry:'loop'});
  const stripe=scene.stripes[0],thread=select({style:'chain',pitch:5});
  const capture=()=>{const links=[];let last=null;return{
    links,save(){},restore(){},beginPath(){last=[];links.push(last);},
    moveTo(...a){last.push(['M',...a])},
    bezierCurveTo(...a){last.push(['C',...a])},stroke(){}
  }};
  const full=capture(),partial=capture(),repeat=capture();
  const a=drawRibbonEmbroidery(full,stripe,scene.extent,thread);
  const b=drawRibbonEmbroidery(partial,stripe,scene.extent,thread,
    {start:-scene.extent*.31,end:scene.extent*.31});
  assert.ok(a>30&&b>0&&b<a);
  assert.equal(full.links.length,a*2);
  assert.equal(partial.links.length,b*2);
  drawRibbonEmbroidery(repeat,stripe,scene.extent,thread);
  assert.deepEqual(repeat.links,full.links);
  const source=new Set(full.links.map(JSON.stringify));
  assert.ok(partial.links.every(link=>source.has(JSON.stringify(link))),
    'branch replay must use same world-anchored loop stations');
  assert.ok(full.links.every(link=>link.filter(item=>item[0]==='C').length===2));
  assert.ok(a<=950*3);
});
test('chain region courses use curved loops within bounded work without repainting legacy styles',()=>{
  const region={rings:[[{x:20,y:30},{x:320,y:30},{x:320,y:570},{x:20,y:570}]],
    vertices:[{x:20,y:30},{x:320,y:30},{x:320,y:570},{x:20,y:570}]};
  const capture=()=>{const calls={curves:0,strokes:0};return{
    calls,save(){},restore(){},beginPath(){},moveTo(){},
    bezierCurveTo(){calls.curves++},stroke(){calls.strokes++},
    translate(){},rotate(){}
  }};
  const ctx=capture(),again=capture();
  const thread=select({style:'chain',direction:28,pitch:5});
  const count=drawRegionEmbroidery(ctx,region,thread);
  assert.ok(count>20&&count<=5200);
  assert.equal(ctx.calls.strokes,count*2);
  assert.equal(ctx.calls.curves,count*4);
  assert.equal(drawRegionEmbroidery(again,region,thread),count);
  assert.deepEqual(again.calls,ctx.calls);
  const saved=normalizeRecipe({seed:'chain-stitches',surfaceTreatments:[thread]});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
  assert.equal(saved.surfaceTreatments[0].style,'chain');
  assert.equal(normalizeSurfaceTreatments([{id:'x',enabled:true,style:'old-invalid'}])[0].style,'satin');
});

test('opt-in fibre shading preserves legacy branches, recipe identity and crossing phase',()=>{
  const scene=resolveScene({seed:'fibre-loop',structure:'paths',geometry:'loop',motif:'solid'});
  const stripe=scene.stripes[2],style=select({style:'satin-fibre',pitch:6,relief:80});
  const capture=()=>{const strokes=[];let start,end;return{
    strokes,save(){},restore(){},beginPath(){},moveTo(x,y){start=[x,y]},
    lineTo(x,y){end=[x,y]},stroke(){strokes.push({start,end,ink:this.strokeStyle,width:this.lineWidth})}
  }};
  const full=capture(),repeat=capture(),partial=capture(),legacy=capture();
  const count=drawRibbonEmbroidery(full,stripe,scene.extent,style);
  drawRibbonEmbroidery(repeat,stripe,scene.extent,style);
  const partialCount=drawRibbonEmbroidery(partial,stripe,scene.extent,style,
    {start:-scene.extent*.28,end:scene.extent*.28});
  drawRibbonEmbroidery(legacy,stripe,scene.extent,select({style:'satin',pitch:6,relief:80}));
  assert.ok(count>25&&partialCount>0&&partialCount<count);
  assert.equal(full.strokes.length,count*4,'underlay, shadow, strand and glint per station');
  assert.deepEqual(repeat.strokes,full.strokes,'fibre appearance is deterministic');
  const all=new Set(full.strokes.map(JSON.stringify));
  assert.ok(partial.strokes.every(item=>all.has(JSON.stringify(item))),
    'replayed crossing strokes keep their original glint phase');
  assert.equal(legacy.strokes[0].ink,'rgba(0,0,0,.31)');
  assert.ok(full.strokes.some(item=>item.ink.startsWith('rgba(255,255,255,')));
  assert.ok(full.strokes.some(item=>item.ink.startsWith('rgba(0,0,0,')));
  const recipe=normalizeRecipe({seed:'fibre-transport',surfaceTreatments:[style]});
  assert.equal(recipe.surfaceTreatments[0].style,'satin-fibre');
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});
test('opt-in tatami fibre remains clipped by its caller and bounded on a region',()=>{
  const region={rings:[[{x:0,y:0},{x:180,y:0},{x:180,y:90},{x:0,y:90}]],
    vertices:[{x:0,y:0},{x:180,y:0},{x:180,y:90},{x:0,y:90}]};
  const capture=()=>{let strokes=0,curves=0;return{
    get strokes(){return strokes},get curves(){return curves},
    save(){},restore(){},translate(){},rotate(){},beginPath(){},
    moveTo(){},lineTo(){},stroke(){strokes++},bezierCurveTo(){curves++}
  }};
  const fibre=capture(),plain=capture();
  const count=drawRegionEmbroidery(fibre,region,select({style:'tatami-fibre',pitch:7}));
  const prior=drawRegionEmbroidery(plain,region,select({style:'tatami',pitch:7}));
  assert.ok(count>prior/2&&count<=18000);
  assert.equal(fibre.strokes,count*4);
  assert.equal(plain.strokes,prior*2,'old Tatami continues its original painter');
  assert.equal(fibre.curves,0);
  assert.equal(normalizeSurfaceTreatments([{id:'s',enabled:true,style:'tatami-fibre'}])[0].style,
    'tatami-fibre');
});


test('Chain preserves straight links but eases inner-turn crowding on the canonical loop',()=>{
  const treatment=select({style:'chain',pitch:5,relief:85});
  const capture=()=>{const paths=[];let current;return{
    paths,save(){},restore(){},beginPath(){current=[];paths.push(current);},
    moveTo(x,y){current.push([x,y])},
    bezierCurveTo(...args){current.push(args)},stroke(){}
  }};
  const lengths=(ctx)=>ctx.paths.filter((_,i)=>i%2===0).map(path=>
    Math.hypot(path[1][4]-path[0][0],path[1][5]-path[0][1]));
  const straight=resolveScene({seed:'chain-bend-test',geometry:'straight'});
  const fullStraight=capture();
  drawRibbonEmbroidery(fullStraight,straight.stripes[0],straight.extent,treatment);
  const originalStep=Math.max(treatment.pitch*2.8,2*straight.extent/950);
  assert.ok(lengths(fullStraight).every(d=>Math.abs(d-originalStep*1.02)<1e-6),
    'unchanged straight links retain their original 51% half-length');

  const loop=resolveScene({seed:'stitch-art-review-001',structure:'paths',
    composition:'single',construction:'ribbon',geometry:'loop',
    stripeWidth:72,spread:54,chaos:0,individuality:0});
  let shortened=0,normal=0;
  for(const stripe of loop.stripes){
    const whole=capture(),again=capture(),partial=capture();
    const count=drawRibbonEmbroidery(whole,stripe,loop.extent,treatment);
    drawRibbonEmbroidery(again,stripe,loop.extent,treatment);
    drawRibbonEmbroidery(partial,stripe,loop.extent,treatment,
      {start:-loop.extent*.28,end:loop.extent*.28});
    assert.ok(count>0&&count<=950*3);
    assert.deepEqual(whole.paths,again.paths,'local bend sampling is deterministic');
    const seen=new Set(whole.paths.map(JSON.stringify));
    assert.ok(partial.paths.every(path=>seen.has(JSON.stringify(path))),
      'local crossing repaint must reproduce original bent links exactly');
    const nominal=Math.max(treatment.pitch*2.8,2*loop.extent/950)*1.02;
    for(const chord of lengths(whole)){
      assert.ok(chord<=nominal+1e-6);
      if(chord<nominal*.90)shortened++;
      if(chord>nominal*.999)normal++;
    }
  }
  assert.ok(shortened>0,'some tight inner loops must actually be uncrowded');
  assert.ok(normal>0,'outer/open spans must retain existing Chain geometry');
});
