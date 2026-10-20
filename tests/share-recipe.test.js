import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {encodePortableRecipe,decodePortableRecipe,portableShareUrl,
  portableShareTokenFromLocation,MAX_PORTABLE_LINK_CHARS} from '../src/share-recipe.js';

const large=normalizeRecipe({
  seed:'a4-compressed-share-canonical-large',structure:'regions',
  regionMode:'nested',viewZoom:.75,viewPanX:-17,
  interiorElements:Array.from({length:5},(_,n)=>({
    id:'inactive-ink-'+n,enabled:false,type:'line',shape:'wave',
    color:'custom',customColor:'#1166aa',placement:'contour',
    objectIds:Array.from({length:200},(_,i)=>
      'region-'+n+'-'+String(i).padStart(3,'0')+'-'+
      String(n*200+i).padStart(3,'0').repeat(30).slice(0,82))
  }))
});

test('five-layer large interior source compresses to safe self-contained URL fragment',async()=>{
  const oldLink='https://example.org/wallgen/index.html?r='+encodeRecipe(large);
  assert.ok(oldLink.length>100000,'fixture must exceed request-line limits');
  const token=await encodePortableRecipe(large);
  const compact=portableShareUrl(oldLink,token);
  assert.ok(compact.length<=MAX_PORTABLE_LINK_CHARS,
    'Compressed link still exceeds conservative static-host limit: '+compact.length);
  const url=new URL(compact);
  assert.equal(url.searchParams.has('r'),false);
  assert.equal(portableShareTokenFromLocation(url),token);
  assert.deepEqual(await decodePortableRecipe(token),large);
  assert.deepEqual(decodeRecipe(encodeRecipe(large)),large);
  assert.match(compact,/#s=v1\./);
  console.log('AGENT4_COMPRESSED_SHARE_COUNTS',JSON.stringify({
    legacyChars:oldLink.length,compactChars:compact.length,
    reduction:Math.round(100*(1-compact.length/oldLink.length))}));
});

test('complex locked/dormant/Drawn/Interior source survives portable link exactly',async()=>{
  const originals=[
    {seed:'ordinary',structure:'paths',geometry:'wave'},
    {seed:'unicode \u{1F308} and drawings',structure:'paths',geometry:'drawn',
      customPath:[[-.3,.1],[.38,.45],[1.25,.88]],drawnAnchors:[0,2],
      lockedSettings:['geometry','material2','interiorElements'],
      material2:'foil',textureLayer2Enabled:false,
      interiorElements:[{id:'line',type:'line',shape:'wave',
        color:'custom',customColor:'#aabb22',width:1.5,phase:60}]},
    {seed:'pan',structure:'radial',radialMode:'pinwheel',
      fieldCenterX:13,viewZoom:2.1,viewPanY:-18.4,
      reverseStripes:true,primesOnly:true},
    {seed:'default-other',structure:'regions',regionMode:'voronoi',
      lockedSettings:['regionMode'],textureLayer3Enabled:true,
      material3:'denim',textureRotation3:129.7}
  ];
  for(const raw of originals){
    const recipe=normalizeRecipe(raw);
    const token=await encodePortableRecipe(recipe);
    assert.deepEqual(await decodePortableRecipe(token),recipe,raw.seed);
    const href=portableShareUrl('https://example.org/?r=obsolete&mode=studio',token);
    assert.equal(new URL(href).searchParams.get('mode'),'studio');
  }
});

async function maliciousToken(obj){
  const source=new Blob([JSON.stringify(obj)]).stream()
    .pipeThrough(new CompressionStream('deflate'));
  const bytes=new Uint8Array(await new Response(source).arrayBuffer());
  let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
  return 'v1.'+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
test('unsupported and malicious compressed links fail explicitly without resetting to defaults',async()=>{
  for(const token of ['','v0.abc','v1.@bad','v1.abc','v1.'+'A'.repeat(8193)])
    await assert.rejects(decodePortableRecipe(token),/compressed|Unsupported|Invalid/i,
      'Accepted malformed token: '+token.slice(0,15));
  for(const record of [
    {v:1,r:{}},
    {v:1,r:{seed:'valid',structure:'alien'}},
    {v:1,r:{seed:'valid',structure:'paths',['__proto__']:'__danger'}},
    {v:1,r:{seed:'valid',structure:'paths',viewZoom:1}},
    {v:2,r:{seed:'valid',structure:'paths'}}
  ]){
    const token=await maliciousToken(record);
    await assert.rejects(decodePortableRecipe(token),/Invalid|Noncanonical|Unsupported/,
      'Accepted noncanonical or invalid recipe '+JSON.stringify(record));
  }
  const big=await maliciousToken({v:1,r:{seed:'valid',structure:'paths',
    data:'x'.repeat(2*1024*1024)}});
  await assert.rejects(decodePortableRecipe(big),/safety limit|Damaged compressed/,
    'Compressed zip bomb was not bounded during streaming decode');
});

function incompressibleRecipe(){
  let state=0x1f7acafe;
  const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  function next(){
    state^=state<<13;state^=state>>>17;state^=state<<5;
    return (state>>>0)%chars.length;
  }
  const objectIds=element=>Array.from({length:200},(_,index)=>
    'piece-'+element+'-'+index+'-'+Array.from({length:75},()=>chars[next()]).join(''));
  return normalizeRecipe({seed:'bounded-compression-fallback',structure:'regions',
    regionMode:'nested',material:'linen',viewZoom:.85,
    interiorElements:Array.from({length:8},(_,element)=>({
      id:'entropy-'+element,type:'line',shape:'wave',placement:'contour',
      objectIds:objectIds(element),colorSlots:[element%7],
      customColor:'#1188bb',color:'custom'}))
  });
}

test('high-entropy legal recipes remain lossless even when compression cannot fit 8192 characters',async()=>{
  const source=incompressibleRecipe();
  assert.equal(source.interiorElements.length,8);
  assert.equal(source.interiorElements.reduce((total,el)=>total+el.objectIds.length,0),1600);
  const token=await encodePortableRecipe(source);
  assert.ok(token.length>MAX_PORTABLE_LINK_CHARS,
    'Fixture unexpectedly compressed into a portable URL');
  await assert.rejects(decodePortableRecipe(token),/Compressed design link is too long/,
    'Reader incorrectly accepted a token above its intentional 8,192-character limit');
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(source))),source,
    'High-entropy valid recipe lost fields in its guaranteed JSON fallback');
  assert.deepEqual(decodeRecipe(encodeRecipe(source)),source,
    'Legacy recipe serialization lost hidden Interior fields');
  const original='https://example.org/wallgen/?r='+encodeRecipe(source);
  assert.ok(original.length>MAX_PORTABLE_LINK_CHARS);
  assert.throws(()=>portableShareUrl(original,token),
    /Compressed link is still too long/,
    'A compressed but oversized valid recipe must not be advertised as a portable link');
  console.log('AGENT4_HIGH_ENTROPY_FALLBACK',JSON.stringify({
    originalChars:original.length,compressedTokenChars:token.length,
    portableMax:MAX_PORTABLE_LINK_CHARS,
    sourceJSONPreserved:true,oversizeTokenRejected:true,copyShouldRefuse:true}));
});
