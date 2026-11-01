import test from 'node:test';
import assert from 'node:assert/strict';
import {chainLinkCurves,traceChainLink,chainLinkContactEvents} from '../src/chain-thread-contacts.js';
import {drawRibbonEmbroidery,normalizeSurfaceTreatments} from '../src/embroidery.js';
import {sandLighting} from '../src/sand-lighting.js';
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
    fill(){ops.push(['fill',this.fillStyle]);},
    stroke(){ops.push(['stroke',this.strokeStyle]);}
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
  const clips=shaded.ops.filter(x=>x[0]==='clip');
  assert.ok(clips.length>0,'source-linked stitches should really overlap');
  assert.ok(clips.length<3*n,'bounded shadows cannot outrun authored links');
  assert.equal(shaded.ops.filter(x=>x[0]==='fill').length,clips.length);
  assert.ok(clips.every(x=>x[1].filter(p=>p[0]==='arc').length===2),
    'only local rounded lower-source yarn may receive contact ink');
  drawRibbonEmbroidery(unlit,stripe,scene.extent,treatment,null,null,
    {contactShadows:true});
  assert.equal(unlit.ops.filter(x=>x[0]==='clip').length,0);
  drawRibbonEmbroidery(crop,stripe,scene.extent,treatment,
    {start:-scene.extent*.2,end:scene.extent*.2},light,
    {contactShadows:true});
  assert.equal(crop.ops.filter(x=>x[0]==='clip').length,0,
    'a major-branch crossing replay must not invent its own chain z order');
});
