import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveScene} from '../src/model.js';
import {sandLighting,sandRibbonLighting} from '../src/sand-lighting.js';
import {samplePath,widthAt} from '../src/path-geometry.js';
import {threadLightProfile} from '../src/thread-lighting.js';
import {normalizeSurfaceTreatments,drawRibbonEmbroidery} from '../src/embroidery.js';
import {planSatinThreadContacts,paintSatinThreadContacts,traceThreadContactCapsule,selectSatinReplayContacts} from '../src/thread-contact-shadows.js';
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
  assert.equal(clips[0][1].filter(op=>op[0]==='line').length,2);
  assert.equal(clips[0][1].filter(op=>op[0]==='arc').length,2,
    'contact clip must use real semicircular yarn endpoints, not rectangle corners');
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
  const point=ops=>ops.operations.filter(o=>o[0]==='arc').at(-1);
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
  assert.match(code,/drawRibbonEmbroidery\(g,stripe,scene\.extent,stitch,\s*\{start,end\},ribbonLight,\{replayContacts\}\)/);
});

test('capsules follow the original thread tangent with true rounded forward/back caps',()=>{
  for(const [start,end,width] of [
    [{x:0,y:0},{x:20,y:0},4],
    [{x:0,y:0},{x:0,y:20},4],
    [{x:0,y:0},{x:12,y:16},6],
    [{x:20,y:20},{x:0,y:0},2]
  ]){
    const ctx=capture();
    assert.equal(traceThreadContactCapsule(ctx,start,end,width),true);
    const arcs=ctx.operations.filter(e=>e[0]==='arc');
    const lines=ctx.operations.filter(e=>e[0]==='line');
    assert.equal(arcs.length,2);
    assert.equal(lines.length,2);
    assert.ok(arcs.every(a=>a[3]===width*.5&&a[6]===true));
    assert.deepEqual(arcs.slice(0,1).map(a=>a.slice(1,3)),[[end.x,end.y]],
      'first semicircle must be centered on far yarn endpoint');
    assert.deepEqual(arcs.slice(1).map(a=>a.slice(1,3)),[[start.x,start.y]],
      'second semicircle must be centered on near yarn endpoint');
    for(const a of arcs)assert.ok(Math.abs(a[5]-a[4]+Math.PI)<1e-8,
      'semicircle must cover exactly 180 degrees toward the end tangent');
    assert.equal(ctx.operations.at(-1)[0],'close',
      'the vector capsule must close before being used as a clip');
  }
  for(const [start,end,width] of [
    [{x:0,y:0},{x:0,y:0},2],
    [{x:0,y:0},{x:.2,y:.1},2],
    [{x:0,y:0},{x:10,y:10},0],
    [{x:0,y:0},{x:10,y:10},NaN]
  ]){
    const ctx=capture();
    assert.equal(traceThreadContactCapsule(ctx,start,end,width),false);
    assert.deepEqual(ctx.operations,[],
      'invalid source geometry must not leave a partial clip path behind');
  }
});


test('Under and Weave select only genuine full-source cross-traversal yarn contacts',()=>{
  const earlier=mark('earlier',[0,0],[20,20],10),
    later=mark('later',[0,20],[20,0],50);
  const hit=threadCrossingGraph([earlier,later])[0];
  assert.ok(hit);
  const pair={hit,top:later,bottom:earlier};
  const plan={byStation:new Map([[50,[pair]]])};
  const crossing={early:10,late:50,x:10,y:10};
  const after=selectSatinReplayContacts(plan,crossing,12,true,8);
  assert.deepEqual([...after.keys()],[50]);
  assert.equal(after.get(50)[0].top.id,'later');
  assert.equal(after.get(50)[0].bottom.id,'earlier');
  const before=selectSatinReplayContacts(plan,crossing,12,false,8);
  assert.deepEqual([...before.keys()],[10]);
  assert.equal(before.get(10)[0].top.id,'earlier');
  assert.equal(before.get(10)[0].bottom.id,'later');
  assert.deepEqual(hit,after.get(50)[0].hit);
  assert.deepEqual(hit,before.get(10)[0].hit,
    'a local replay cannot recompute or relocate original source intersection');
  assert.equal(selectSatinReplayContacts(plan,crossing,3,false,8).size,1);
  assert.equal(selectSatinReplayContacts(plan,{
    ...crossing,x:100,y:100
  },12,false,8).size,0,
  'unrelated source contacts outside the local original crossing are excluded');
  assert.equal(selectSatinReplayContacts(plan,{...crossing,late:13},
    50,true,8).size,0,
    'even overlapping replay windows must not misidentify original traversal');
  assert.equal(selectSatinReplayContacts(plan,crossing,12,'under',8).size,0,
    'only the actual renderer-owned boolean crossing policy is accepted');
});

test('only original top station receives replay contact ink before its own stitch',()=>{
  const scene=resolveScene({
    seed:'contact-replay-station-test',geometry:'drawn',
    customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],
    construction:'ribbon',stripeWidth:90,spread:45
  });
  const stripe=scene.stripes[3],pitch=7,style=thread(),light=lamp();
  const extent=scene.extent,interval=Math.max(pitch,2*extent/2500);
  const index= Math.max(20,Math.floor(extent/interval));
  const station=-extent+index*interval;
  const segment=mark('target',[0,0],[20,20],index);
  const upper=mark('under',[0,20],[20,0],index+7);
  const hit=threadCrossingGraph([segment,upper])[0];
  assert.ok(hit);
  const selected=new Map([[index,[{hit,top:segment,bottom:upper}]]]);
  const range={start:station-interval*.1,end:station+interval*.1};
  const plain=capture(),replay=capture();
  const a=drawRibbonEmbroidery(plain,stripe,extent,style,range,light);
  const b=drawRibbonEmbroidery(replay,stripe,extent,style,range,light,
    {replayContacts:selected});
  assert.equal(a,b);
  assert.equal(replay.operations.filter(op=>op[0]==='clip').length,1,
    'only selected true source crossing receives a lower-yarn contact clip');
  assert.equal(plain.operations.filter(op=>op[0]==='clip').length,0);
  const noContact=capture();
  drawRibbonEmbroidery(noContact,stripe,extent,style,range,light,
    {replayContacts:new Map([[index-30,selected.get(index)]])});
  assert.deepEqual(noContact.operations,plain.operations,
    'contacts for an unseen original source station cannot reach a replay crop');
  const noLight=capture();
  drawRibbonEmbroidery(noLight,stripe,extent,style,range,null,
    {replayContacts:selected});
  assert.equal(noLight.operations.filter(op=>op[0]==='clip').length,0);
});


test('ribbon fibre contact topology follows its actual projected underlay, not satin width',()=>{
  const scene=resolveScene({
    seed:'fibre-source-real-figure-eight',geometry:'drawn',structure:'paths',
    construction:'ribbon',motif:'solid',
    customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],
    stripeWidth:90,spread:45
  });
  const stripe=scene.stripes[3],extent=scene.extent;
  const light=lamp(),fibre=thread('satin-fibre');
  const plan=planSatinThreadContacts(stripe,extent,fibre,light);
  const tatami=planSatinThreadContacts(stripe,extent,thread('tatami-fibre'),light);
  const satin=planSatinThreadContacts(stripe,extent,thread(),light);
  assert.ok(plan&&tatami&&satin);
  assert.ok(plan.segments.length>100);
  assert.ok(plan.contacts>0,
    'only original transverse fibre underlays may generate true contacts');
  assert.equal(plan.contacts,tatami.contacts,
    'ribbon satin-fibre and tatami-fibre use the same actual original underlay');
  const actualWidth=Math.min(3.2,Math.max(.8,fibre.pitch*.32));
  const found=plan.segments.find(item=>item.sourceIndex>5);
  assert.equal(found.width,actualWidth);
  const station=found.station,p=samplePath(stripe,station,extent),
    w=widthAt(stripe,station,extent)*.485;
  const start={x:p.x-p.nx*w,y:p.y-p.ny*w},
    end={x:p.x+p.nx*w,y:p.y+p.ny*w};
  const dx=end.x-start.x,dy=end.y-start.y,l=Math.hypot(dx,dy);
  const nx=-dy/l,ny=dx/l;
  const profile=threadLightProfile(light,start.x,start.y,
    end.x,end.y,fibre.pitch,fibre.relief);
  assert.ok(profile);
  const shiftX=nx*.35+profile.shadowX,shiftY=ny*.35+profile.shadowY;
  assert.ok(Math.abs(found.start.x-start.x-shiftX)<1e-8);
  assert.ok(Math.abs(found.start.y-start.y-shiftY)<1e-8);
  assert.ok(Math.abs(found.end.x-end.x-shiftX)<1e-8);
  assert.ok(Math.abs(found.end.y-end.y-shiftY)<1e-8);
  assert.notEqual(found.start.x,satin.segments.find(x=>x.sourceIndex===found.sourceIndex)?.start.x,
    'fibre uses exact light-projected lower ink rather than satin default source mask');
  assert.equal(planSatinThreadContacts(stripe,extent,fibre,null),null);
});

test('fibre is shaded only at real source contact stations, never all coloured substrate',()=>{
  const scene=resolveScene({
    seed:'fibre-contact-complete',structure:'paths',geometry:'drawn',
    customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],
    construction:'ribbon',stripeWidth:90,spread:45
  });
  const stripe=scene.stripes[3],style=thread('satin-fibre'),light=lamp();
  const before=capture(),after=capture(),unlit=capture();
  const a=drawRibbonEmbroidery(before,stripe,scene.extent,style,null,light);
  const b=drawRibbonEmbroidery(after,stripe,scene.extent,style,null,light,
    {contactShadows:true});
  assert.equal(a,b,'original fibre stitch station/strand counts must stay intact');
  assert.ok(after.operations.filter(op=>op[0]==='clip').length>0,
    'actual crossing contacts should be clipped to the previously drawn fibre underlay');
  assert.equal(before.operations.filter(op=>op[0]==='clip').length,0);
  drawRibbonEmbroidery(unlit,stripe,scene.extent,style,null,null,{contactShadows:true});
  assert.equal(unlit.operations.filter(op=>op[0]==='clip').length,0);
  const clipped=capture();
  const range={start:-scene.extent*.1,end:scene.extent*.1};
  drawRibbonEmbroidery(clipped,stripe,scene.extent,style,range,light,
    {contactShadows:true});
  assert.equal(clipped.operations.filter(op=>op[0]==='clip').length,0,
    'cropped replay must not independently construct a partial contact graph');
});
