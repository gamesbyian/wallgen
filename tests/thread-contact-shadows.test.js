import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveScene} from '../src/model.js';
import {sandLighting,sandRibbonLighting} from '../src/sand-lighting.js';
import {normalizeSurfaceTreatments,drawRibbonEmbroidery} from '../src/embroidery.js';
import {planSatinThreadContacts,paintSatinThreadContacts} from '../src/thread-contact-shadows.js';
import {threadCrossingGraph} from '../src/thread-crossings.js';

const thread=(style='satin')=>normalizeSurfaceTreatments([{
  id:'satin-topology',enabled:true,style,pitch:7,relief:88,
  target:{scope:'all',role:'fill',ids:[],colorSlots:[]}
}])[0];
const lamp=(direction='top-left')=>sandLighting({
  lightingMood:'daylight',lightDirection:direction,
  lightStrength:90,shadowStrength:80
});
const mark=(id,a,b,station)=>({
  id,owner:'stripe',course:'satin',sourceIndex:station,station,
  start:{x:a[0],y:a[1]},end:{x:b[0],y:b[1]},width:2
});
function capture(){
  const operations=[];
  let path=[];
  const ctx={operations,save(){operations.push(['save'])},
    restore(){operations.push(['restore'])},
    beginPath(){path=[];operations.push(['begin'])},
    moveTo(...p){path.push(['move',...p]);operations.push(['move',...p])},
    lineTo(...p){path.push(['line',...p]);operations.push(['line',...p])},
    arc(...a){path.push(['arc',...a]);operations.push(['arc',...a])},
    closePath(){path.push(['close']);operations.push(['close'])},
    clip(){operations.push(['clip',path.map(p=>[...p])])},
    fill(){operations.push(['fill',this.fillStyle])},
    stroke(){operations.push(['stroke',this.strokeStyle])}
  };
  return ctx;
}
test('only a genuine transverse over/under source intersection produces a lower-thread contact clip',()=>{
  const below=mark('lower',[0,0],[20,20],3);
  const above=mark('upper',[0,20],[20,0],9);
  const graph=threadCrossingGraph([below,above]);
  assert.equal(graph.length,1);
  const one={hit:graph[0],bottom:below,top:above};
  const ctx=capture();
  assert.equal(paintSatinThreadContacts(ctx,[one],lamp(),7,88),1);
  const clips=ctx.operations.filter(op=>op[0]==='clip');
  const fills=ctx.operations.filter(op=>op[0]==='fill');
  assert.equal(clips.length,1);
  assert.equal(fills.length,1);
  assert.equal(clips[0][1].filter(op=>op[0]==='line').length,3,
    'contact shadow clip is the original narrow lower-thread quadrilateral');
  assert.equal(ctx.operations.filter(op=>op[0]==='save').length,1);
  assert.equal(ctx.operations.filter(op=>op[0]==='restore').length,1);
  assert.ok(ctx.operations.findIndex(op=>op[0]==='clip')<
    ctx.operations.findIndex(op=>op[0]==='fill'));
  assert.ok(ctx.operations.findIndex(op=>op[0]==='fill')<
    ctx.operations.findIndex(op=>op[0]==='restore'));
  assert.equal(paintSatinThreadContacts(ctx,[],lamp(),7,88),0);
  assert.equal(paintSatinThreadContacts(ctx,[one],null,7,88),0);
});

test('contact position moves away from lamp but the existing lower-thread capsule never moves',()=>{
  // Separate yarn courses, not adjacent sections of one strand. The
  // crossing resolver correctly rejects adjacent sourceIndex neighbours.
  const lower=mark('lower',[0,0],[20,20],1),
    upper=mark('upper',[0,20],[20,0],8);
  const hit=threadCrossingGraph([lower,upper])[0];
  assert.ok(hit,'a real topological contact must exist before testing light');
  const contact={hit,top:upper,bottom:lower};
  const first=capture(),second=capture();
  paintSatinThreadContacts(first,[contact],lamp('top-left'),7,90);
  paintSatinThreadContacts(second,[contact],lamp('bottom-right'),7,90);
  const clip=ops=>ops.operations.find(o=>o[0]==='clip')[1];
  assert.deepEqual(clip(first),clip(second),
    'changing lamp must never move original lower source geometry');
  const point=ops=>ops.operations.find(o=>o[0]==='arc');
  const a=point(first),b=point(second);
  assert.ok(a[1]>b[1]&&a[2]>b[2],
    'NW lamp must push the tiny contact shade towards SE');
});

test('real drawn ribbon builds bounded original-station satin topology and never recomputes from crop',()=>{
  const scene=resolveScene({
    seed:'thread-crossing-real-figure-eight',structure:'paths',
    geometry:'drawn',customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],
    construction:'ribbon',motif:'solid',stripeWidth:90,spread:45
  });
  const stripe=scene.stripes[3],light=sandRibbonLighting({
    ...scene,lightingMood:'daylight',lightDirection:'top-left',
    lightStrength:80,shadowStrength:75
  });
  const plan=planSatinThreadContacts(stripe,scene.extent,thread(),light);
  assert.ok(plan,'source stitch study must fit its bounded work budget');
  assert.ok(plan.segments.length>60);
  for(const [station,items] of plan.byStation){
    assert.ok(Number.isInteger(station));
    for(const item of items){
      assert.equal(item.top.sourceIndex,station);
      assert.ok(item.bottom.sourceIndex<station);
      assert.equal(item.hit.owner,'source-ribbon');
    }
  }
  assert.equal(planSatinThreadContacts(stripe,scene.extent,thread(),null),null);
  assert.equal(planSatinThreadContacts(stripe,scene.extent,thread('chain'),light),null);
  assert.equal(planSatinThreadContacts(stripe,scene.extent,thread('running'),light),null);
  assert.equal(planSatinThreadContacts({...stripe,geometry:'straight',
    sharedGeometry:'straight'},scene.extent,thread(),light),null,
    'ordinary straight/wave ribbons should not pay to build contact topology');
  assert.equal(planSatinThreadContacts({...stripe,geometry:'wave',
    sharedGeometry:'wave'},scene.extent,thread(),light),null);
  const truncated={...stripe,segmentStart:-scene.extent*.12,
    segmentEnd:scene.extent*.18};
  const shortened=planSatinThreadContacts(truncated,scene.extent,thread(),light);
  assert.ok(shortened);
  assert.ok(shortened.segments.length<plan.segments.length);
  assert.ok(shortened.segments.every(s=>s.station>=truncated.segmentStart-1e-7&&
    s.station<=truncated.segmentEnd+1e-7),
    'invisible original floating ribbon stations cannot cast contact onto visible ink');
});

test('only fully painted, lit satin over-policy may add contacts; replay is unchanged',()=>{
  const scene=resolveScene({
    seed:'satin-contact-ribbon',geometry:'drawn',
    customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],construction:'ribbon',
    stripeWidth:90,spread:45
  });
  const stripe=scene.stripes[3],style=thread(),light=lamp();
  const plain=capture(),lit=capture(),cropped=capture(),unlit=capture();
  const a=drawRibbonEmbroidery(plain,stripe,scene.extent,style,null,light);
  const b=drawRibbonEmbroidery(lit,stripe,scene.extent,style,null,light,
    {contactShadows:true});
  assert.equal(a,b);
  assert.equal(lit.operations.filter(x=>x[0]==='stroke').length,
    plain.operations.filter(x=>x[0]==='stroke').length);
  const range={start:-scene.extent*.1,end:scene.extent*.1};
  const croppedCount=drawRibbonEmbroidery(cropped,stripe,scene.extent,style,
    range,light,{contactShadows:true});
  assert.ok(croppedCount<a);
  assert.equal(cropped.operations.filter(x=>x[0]==='clip').length,0);
  drawRibbonEmbroidery(unlit,stripe,scene.extent,style,null,null,
    {contactShadows:true});
  assert.equal(unlit.operations.filter(x=>x[0]==='clip').length,0);
  const code=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
  assert.match(code,/contactShadows:scene\.crossingMode==='over'/);
  assert.match(code,/drawRibbonEmbroidery\(g,stripe,scene\.extent,stitch,\{start,end\},ribbonLight\)/);
});
