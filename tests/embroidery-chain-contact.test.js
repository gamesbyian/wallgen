import test from 'node:test';
import assert from 'node:assert/strict';
import {chainLinkCurves,traceChainLink,chainLinkContactEvents} from '../src/chain-thread-contacts.js';
import {drawRibbonEmbroidery,normalizeSurfaceTreatments,selectChainReplayContacts} from '../src/embroidery.js';
import {sandLighting,sandRibbonLighting} from '../src/sand-lighting.js';
import {findPathCrossings} from '../src/crossing-order.js';
import {samplePath} from '../src/path-geometry.js';
import {readFileSync} from 'node:fs';
import {resolveScene} from '../src/model.js';

const link=x=>chainLinkCurves(x,0,1,0,0,1,14.28,7.2);
const lamp=direction=>sandLighting({
  lightingMood:'daylight',lightDirection:direction||'top-left',
  lightStrength:85,shadowStrength:75
});
function capture(){
  const ops=[];
  let path=[];
  return {ops,save(){ops.push(['save']);},
    restore(){ops.push(['restore']);},
    beginPath(){path=[];ops.push(['begin']);},
    moveTo(...v){path.push(['move',...v]);ops.push(['move',...v]);},
    lineTo(...v){path.push(['line',...v]);ops.push(['line',...v]);},
    bezierCurveTo(...v){path.push(['cubic',...v]);ops.push(['cubic',...v]);},
    arc(...v){path.push(['arc',...v]);ops.push(['arc',...v]);},
    closePath(){path.push(['close']);ops.push(['close']);},
    clip(){ops.push(['clip',path.map(x=>x.slice())]);},
    fill(){ops.push(['fill',this.fillStyle,path.map(x=>x.slice())]);},
    stroke(){ops.push(['stroke',this.strokeStyle,this.lineWidth]);}
  };
}
const style=()=>normalizeSurfaceTreatments([{
  id:'chain-topology',enabled:true,style:'chain',pitch:10,relief:85,
  target:{scope:'all',role:'fill',ids:[],colorSlots:[]}
}])[0];

test('two actual linked cubic branch intersections exist at nominal adjacent stations',()=>{
  const earlier=link(0),later=link(28);
  assert.ok(earlier&&later);
  const events=chainLinkContactEvents(earlier,later);
  assert.equal(events.length,2,'upper and lower loops both truly interlock');
  assert.deepEqual(events.map(x=>x.lowerBranch),[0,1]);
  assert.deepEqual(events.map(x=>x.upperBranch),[0,1]);
  for(const hit of events){
    assert.ok(hit.x>13&&hit.x<15);
    assert.ok(Math.abs(hit.y)>0&&Math.abs(hit.y)<1);
    assert.ok(Math.hypot(hit.lowerA.x-hit.lowerB.x,
      hit.lowerA.y-hit.lowerB.y)>.75,
    'the clipping tangent must be an actual lower-source cubic segment');
  }
  assert.deepEqual(chainLinkContactEvents(later,earlier).length,2,
    'intersection geometry does not depend on which link is above');
  assert.deepEqual(chainLinkContactEvents(earlier,link(40)),[],
    'nearby, nonintersecting loops cannot produce invented shadows');
  assert.deepEqual(chainLinkContactEvents(earlier,link(0).map(c=>
    c.map(p=>({x:p.x,y:p.y+25})))),[],
    'a physically separate lane cannot become an inferred crossing');
});
test('original cubic path is traced from the same two topology branches',()=>{
  const curves=link(0),ctx=capture();
  assert.equal(traceChainLink(ctx,curves),true);
  const commands=ctx.ops.map(x=>x[0]);
  assert.deepEqual(commands,['begin','move','cubic','cubic']);
  const first=ctx.ops[1],last=ctx.ops[3];
  assert.deepEqual(first.slice(1),[curves[0][0].x,curves[0][0].y]);
  assert.deepEqual(last.slice(-2),[curves[1][3].x,curves[1][3].y]);
  assert.deepEqual(chainLinkContactEvents(null,curves),[]);
  assert.deepEqual(chainLinkContactEvents(curves,[[{x:NaN,y:0}]]),[]);
});
test('real chain ribbon adds projected contacts only on full, lit Over painting',()=>{
  const scene=resolveScene({seed:'chain-adjacent-link-source',
    structure:'paths',geometry:'straight',construction:'ribbon',
    motif:'solid',stripeWidth:85,spread:35});
  const stripe=scene.stripes[3],treatment=style(),light=lamp();
  const plain=capture(),shaded=capture(),unlit=capture(),crop=capture();
  const n=drawRibbonEmbroidery(plain,stripe,scene.extent,treatment,null,light);
  const m=drawRibbonEmbroidery(shaded,stripe,scene.extent,treatment,null,light,
    {contactShadows:true});
  assert.equal(n,m,'adding contacts may not change the source stitch lattice');
  assert.ok(n>9);
  assert.equal(plain.ops.filter(x=>x[0]==='clip').length,0);
  assert.equal(shaded.ops.filter(x=>x[0]==='clip').length,0,
    'source lower-cord geometry must contain the narrow contact stroke');
  const plainStrokes=plain.ops.filter(x=>x[0]==='stroke');
  const shadedStrokes=shaded.ops.filter(x=>x[0]==='stroke');
  assert.ok(shadedStrokes.length>plainStrokes.length,
    'actual source chain intersections must draw their lower-cord contacts');
  const additions=shadedStrokes.filter(x=>x[2]<Math.max(.8,Math.min(2,treatment.pitch*.24)));
  assert.ok(additions.length>0&&additions.length<3*n,
    'contact count is bounded by source links, not screen pixels');
  assert.ok(additions.every(x=>x[2]>0&&x[2]<
    Math.max(.8,Math.min(2,treatment.pitch*.24))),
    'contact ink must fit entirely inside real lower underlay width');
  assert.equal(shaded.ops.filter(x=>x[0]==='fill').length,0,
    'no giant arc area or ambient fabric darkening is permitted');
  drawRibbonEmbroidery(unlit,stripe,scene.extent,treatment,null,null,
    {contactShadows:true});
  assert.equal(unlit.ops.filter(x=>x[0]==='clip').length,0);
  const range={start:-scene.extent*.2,end:scene.extent*.2};
  drawRibbonEmbroidery(crop,stripe,scene.extent,treatment,range,light,
    {contactShadows:true});
  const replayWithoutContacts=capture();
  drawRibbonEmbroidery(replayWithoutContacts,stripe,scene.extent,treatment,
    range,light);
  assert.deepEqual(crop.ops,replayWithoutContacts.ops,
    'major-branch crossing replay must be byte-for-byte source-stroke identical');
});

test('original chain branch contacts reverse top source order at one genuine figure-eight junction',()=>{
  const scene=resolveScene({seed:'replay-source-true-chain',
    structure:'paths',geometry:'drawn',construction:'ribbon',motif:'solid',
    customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],
    stripeWidth:100,spread:45,lightingMood:'daylight',
    lightDirection:'top-left',lightStrength:88,shadowStrength:82});
  const stripe=scene.stripes[3],lighting=sandRibbonLighting(scene),pitch=style();
  const hit=findPathCrossings(stripe,scene.extent,samplePath)[0];
  assert.ok(hit,'must derive junction from the actual source sampler');
  const a=samplePath(stripe,hit.early,scene.extent),
    b=samplePath(stripe,hit.late,scene.extent);
  const sourceHit={...hit,x:(a.x+b.x)*.5,y:(a.y+b.y)*.5};
  const later=selectChainReplayContacts(stripe,scene.extent,pitch,lighting,
    sourceHit,200,true,stripe.width);
  const earlier=selectChainReplayContacts(stripe,scene.extent,pitch,lighting,
    sourceHit,200,false,stripe.width);
  assert.ok(later instanceof Map&&earlier instanceof Map);
  const count=map=>[...map.values()].reduce((n,items)=>
    n+items.reduce((sum,x)=>sum+x.events.length,0),0);
  assert.ok(count(later)>0&&count(earlier)>0,
    'real crossing of original coloured chain lanes must yield topological yarn contacts');
  const check=(map,laterTop)=>{
    for(const [index,items] of map){
      assert.ok(Number.isSafeInteger(index));
      for(const item of items){
        assert.equal(index,item.top.index);
        assert.equal(item.top.index>item.bottom.index,laterTop);
        assert.ok([-.66,0,.66].includes(item.lane));
        assert.ok(item.events.length>0);
        for(const hit of item.events)
          assert.ok((hit.x-sourceHit.x)**2+(hit.y-sourceHit.y)**2 <=
            Math.max(2,stripe.width*.85)**2);
      }
    }
  };
  check(later,true);
  check(earlier,false);
  const unchanged=selectChainReplayContacts(stripe,scene.extent,pitch,
    null,sourceHit,200,true,stripe.width);
  assert.equal(unchanged.size,0);
  assert.equal(selectChainReplayContacts(stripe,scene.extent,pitch,lighting,
    {...sourceHit,x:1e7,y:1e7},200,true,stripe.width).size,0);
  assert.equal(selectChainReplayContacts(stripe,scene.extent,pitch,lighting,
    sourceHit,200,'under',stripe.width).size,0);
  const render=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
  assert.match(render,/selectChainReplayContacts\(stripe,scene\.extent,/);
  assert.match(render,/sourceHit,halfLength,later,stripe\.width/);
});
test('crossing replay shades only original selected chain stations and leaves unlit/cropped controls unchanged',()=>{
  const scene=resolveScene({seed:'chain-source-station-replay',
    structure:'paths',geometry:'drawn',construction:'ribbon',motif:'solid',
    customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],
    stripeWidth:100,spread:45,lightingMood:'daylight',
    lightDirection:'top-left',lightStrength:88,shadowStrength:82});
  const stripe=scene.stripes[3],light=sandRibbonLighting(scene),treatment=style();
  const hit=findPathCrossings(stripe,scene.extent,samplePath)[0];
  const a=samplePath(stripe,hit.early,scene.extent),b=samplePath(stripe,hit.late,scene.extent);
  const plan=selectChainReplayContacts(stripe,scene.extent,treatment,light,
    {...hit,x:(a.x+b.x)*.5,y:(a.y+b.y)*.5},200,false,stripe.width);
  const range={start:hit.early-160,end:hit.early+160};
  const plain=capture(),replayed=capture(),unlit=capture();
  const n=drawRibbonEmbroidery(plain,stripe,scene.extent,treatment,range,light);
  const m=drawRibbonEmbroidery(replayed,stripe,scene.extent,treatment,range,light,
    {replayContacts:plan});
  assert.equal(n,m);
  assert.ok(replayed.ops.filter(x=>x[0]==='stroke').length>
    plain.ops.filter(x=>x[0]==='stroke').length,
    'original top branch should cast local contact ink on original lower curve');
  drawRibbonEmbroidery(unlit,stripe,scene.extent,treatment,range,null,
    {replayContacts:plan});
  const noLight=capture();
  drawRibbonEmbroidery(noLight,stripe,scene.extent,treatment,range,null);
  assert.deepEqual(unlit.ops,noLight.ops);
  const far=capture(),baseline=capture();
  drawRibbonEmbroidery(far,stripe,scene.extent,treatment,
    {start:-scene.extent,end:-scene.extent+45},light,{replayContacts:plan});
  drawRibbonEmbroidery(baseline,stripe,scene.extent,treatment,
    {start:-scene.extent,end:-scene.extent+45},light);
  assert.deepEqual(far.ops,baseline.ops,
    'unrelated crop may not replay a junction shadow');
});
