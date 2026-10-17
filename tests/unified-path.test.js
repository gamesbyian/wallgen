import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecipe, resolveScene, GEOMETRIES, COMPOSITIONS, CONSTRUCTIONS,
  LOCKABLE_SETTINGS, encodeRecipe, decodeRecipe, randomizeAllRecipe } from '../src/model.js';
import { pathPosition, samplePath, ribbonEdge, widthAt } from '../src/path-geometry.js';
import { stripeLineMarks, balanceStripeEnds, stripeFrameContacts } from '../src/renderer.js';

test('one parametric path sampler covers old and new geometry vocabulary',()=>{
  for(const geometry of GEOMETRIES){
    const scene=resolveScene({seed:'unified-'+geometry,geometry,individuality:0});
    assert.equal(scene.stripes.length,7);
    for(const stripe of scene.stripes){
      for(const x of [-scene.extent,0,scene.extent]){
        const p=samplePath(stripe,x,scene.extent);
        const edge=ribbonEdge(stripe,x,scene.extent,1);
        assert.ok([p.x,p.y,p.tx,p.ty,p.nx,p.ny,edge.x,edge.y].every(Number.isFinite),geometry);
        assert.ok(Math.abs(p.nx*p.tx+p.ny*p.ty)<1e-8,'normal orthogonal to tangent');
      }
    }
  }
});
test('hairpin really returns with two legs and nested radii',()=>{
  const scene=resolveScene({seed:'returning-rainbow',geometry:'hairpin',
    orientation:'vertical',individuality:0,construction:'ribbon',turnRadius:65});
  assert.equal(scene.angle,0);
  const e=scene.extent;
  const centre=scene.stripes[3];
  const left=samplePath(centre,-e,e),bend=samplePath(centre,0,e),right=samplePath(centre,e,e);
  assert.ok(left.x<right.x);
  assert.ok(bend.y>left.y+500&&bend.y>right.y+500);
  const radii=scene.stripes.map(s=>samplePath(s,0,e).y);
  assert.ok(radii.every((v,i)=>i===0||v>radii[i-1]),
    'consecutive bands have ordered normal offsets through the returning bend');
});
test('loopy continuous path actually reverses longitudinal direction',()=>{
  const scene=resolveScene({seed:'spring-line',geometry:'loops',orientation:'horizontal',
    construction:'stroke',shapeFrequency:85,shapeDepth:95,individuality:0});
  const stripe=scene.stripes[3],e=scene.extent;
  const xs=Array.from({length:400},(_,i)=>pathPosition(stripe,-200+i,e).x);
  assert.ok(xs.some((v,i)=>i>0&&v<xs[i-1]),'loops must fold backward');
  assert.ok(xs.some((v,i)=>i>0&&v>xs[i-1]),'loops must also advance');
  assert.deepEqual(resolveScene({seed:'spring-line',geometry:'loops',orientation:'horizontal',
    construction:'stroke',shapeFrequency:85,shapeDepth:95,individuality:0}).stripes,scene.stripes);
});
test('repetition changes the composition while retaining seven stripe identities',()=>{
  const single=resolveScene({seed:'repeat-bands',composition:'single',geometry:'straight'});
  const repeated=resolveScene({seed:'repeat-bands',composition:'repeat',repeatCount:4,
    repeatSpacing:60,geometry:'straight'});
  assert.equal(single.bundleOffsets.length,1);
  assert.equal(repeated.bundleOffsets.length,4);
  assert.equal(repeated.stripes.length,7);
  assert.ok(repeated.bundleOffsets.every((v,i)=>i===0||v>repeated.bundleOffsets[i-1]));
  assert.equal(new Set(repeated.stripes.map(s=>s.name)).size,7);
});
test('floating compositions terminate independently inside the canvas',()=>{
  const recipe={seed:'floating-pencil',composition:'floating',geometry:'wave',
    orientation:'diagonal',individuality:72,spread:45,stripeWidth:36};
  const short=resolveScene({...recipe,pathLength:20,endTaper:80});
  const long=resolveScene({...recipe,pathLength:95,endTaper:80});
  for(let i=0;i<7;i++){
    const a=short.stripes[i],b=long.stripes[i];
    balanceStripeEnds(short,a);
    balanceStripeEnds(long,b);
    if(a.hidden||b.hidden)continue;
    assert.ok(a.segmentStart>a.segmentEnd-2*short.extent);
    assert.ok(a.segmentEnd-a.segmentStart<b.segmentEnd-b.segmentStart);
    const contacts=stripeFrameContacts(short,a);
    assert.ok(Object.values(contacts).every(v=>!v),'floating ends remain inset');
  }
});
test('dot diameter and spacing independently affect real marks',()=>{
  const scene=resolveScene({seed:'dot-columns',geometry:'straight',lineStyle:'dotted',
    dotSize:20,dotSpacing:20});
  const stripe=scene.stripes[3];
  const small=stripeLineMarks(stripe,scene.extent);
  const biggerScene=resolveScene({seed:'dot-columns',geometry:'straight',lineStyle:'dotted',
    dotSize:95,dotSpacing:20});
  const spacedScene=resolveScene({seed:'dot-columns',geometry:'straight',lineStyle:'dotted',
    dotSize:20,dotSpacing:95});
  const larger=stripeLineMarks(biggerScene.stripes[3],biggerScene.extent);
  const spaced=stripeLineMarks(spacedScene.stripes[3],spacedScene.extent);
  const synced=scene.stripes.map(s=>stripeLineMarks(s,scene.extent));
  assert.ok(synced.every(m=>m[0].x===synced[0][0].x&&m[0].radius===synced[0][0].radius),
    'all seven coloured columns share circular mark positions and sizes');
  assert.ok(small.length>4);
  assert.ok(larger[0].radius>small[0].radius);
  assert.ok(spaced.length<small.length);
});
test('taper reaches both physical endpoints without affecting centre thickness',()=>{
  const scene=resolveScene({geometry:'loops',endTaper:90,construction:'stroke'});
  const stripe=scene.stripes[3],e=scene.extent;
  assert.ok(widthAt(stripe,-e,e)<widthAt(stripe,0,e)*.2);
  assert.ok(widthAt(stripe,e,e)<widthAt(stripe,0,e)*.2);
});
test('all construction and composition settings are normalized, lockable and portable',()=>{
  for(const construction of CONSTRUCTIONS)for(const composition of COMPOSITIONS){
    const input={seed:'portable-build',geometry:'hairpin',construction,composition,
      repeatCount:6,repeatSpacing:73,tonalContrast:77,brushRoughness:26,
      dotSize:88,dotSpacing:44,turnRadius:31,endTaper:57};
    const normalized=normalizeRecipe(input);
    const recovered=decodeRecipe(encodeRecipe(normalized));
    assert.deepEqual(recovered,normalized);
  }
  for(const key of ['composition','construction','repeatCount','repeatSpacing','turnRadius',
    'tonalContrast','brushRoughness','dotSize','dotSpacing','pathLength','endTaper'])
    assert.ok(LOCKABLE_SETTINGS.includes(key),key);
  const random=randomizeAllRecipe();
  assert.ok(COMPOSITIONS.includes(random.composition));
  assert.ok(CONSTRUCTIONS.includes(random.construction));
});
