import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,rng,
  OUTPUT_WIDTH,OUTPUT_HEIGHT
} from '../src/model.js';
import {embedPngMetadata,extractPngRecipe,serializePngRecipe,
  RECIPE_KEYWORD} from '../src/png-metadata.js';

// Bounded, replayable structural coverage. Unlike a fuzz seed generated at
// runtime, this exact matrix is deterministic in CI and bisectable.
const random=rng('agent4-transport-matrix-2026-10-20');
const choice=items=>items[Math.floor(random()*items.length)];
const between=(min,max)=>min+random()*(max-min);
const integer=(min,max)=>Math.floor(between(min,max+1));
const structures=['paths','radial','regions'];
const geometries=['straight','wave','hairpin','loop','drawn'];
const materials=['none','linen','foil','denim','construction','stone'];
const palettes=['classic','electric','arctic','pastel','jewel'];
const names=['studio','currents','fracture','confetti','deco','tapestry','signal','contour'];
const png=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64'));
function path(count){
  const points=Array.from({length:count},(_,index)=>{
    const x=-.32+1.64*index/Math.max(1,count-1);
    const y=.5+.34*Math.sin(index*.2)+between(-.006,.006);
    return [x,y];
  });
  if(count>10)points[6]=[...points[5]]; // duplicate authored station
  return points;
}
function fixture(i){
  const structure=structures[i%structures.length],geometry=geometries[i%geometries.length];
  const count=i%13===0?120:i%7===0?77:integer(2,13);
  const shapes=path(count);
  const layers=i%4;
  const locked=['seed','orientation','palette','structure'];
  if(i%2===0)locked.push('material2','textureRotation3');
  if(i%5===0)locked.push('geometry','extendDrawnPath','interiorElements');
  const input={
    seed:'transport-'+String(i).padStart(3,'0')+(i%11===0?' 🌈':''),
    structure,geometry,
    family:i%5===0?'auto':choice(names),
    lockedResolved:{family:'contour',orientation:'diagonal',
      geometry:'straight',palette:'arctic'},
    orientation:i%4===0?'auto':choice(['diagonal','vertical','horizontal']),
    palette:i%4===0?'auto':choice(palettes),
    lockedSettings:locked,
    customPath:shapes,
    drawnAnchors:[1,6,count-1],drawnCorners:[0,Math.floor(count/2)],
    extendDrawnPath:i%2===0,
    crossingMode:choice(['over','under','weave']),
    geometrySafety:i%3!==0,composition:choice(['single','repeat','floating']),
    construction:choice(['ribbon','stroke','tonal','woven']),
    repeatCount:integer(2,6),repeatSpacing:integer(0,100),
    hairpinAngle:between(60,180),loopSweep:between(240,450),
    spread:integer(0,100),stripeWidth:integer(0,100),
    reverseStripes:i%2===0,mirrorHorizontal:i%3===0,
    mirrorVertical:i%5===0,primesOnly:i%7===0,
    radialMode:choice(['sunburst','pinwheel','concentric']),
    rayCount:integer(7,70),rayRotation:between(-180,180),
    rayTwist:between(-180,180),rayCoverage:integer(0,100),
    rayCore:integer(0,100),fieldCenterX:between(-50,150),
    fieldCenterY:between(-50,150),
    regionMode:choice(['voronoi','nested']),
    regionCount:integer(7,70),regionSides:integer(3,12),
    regionJitter:integer(0,100),dividerWidth:integer(0,100),
    material:choice(materials),textureStrength:integer(0,100),
    textureScale:integer(1,100),textureRotation:between(0,360),
    textureCoverage:choice(['both','stripes','background']),
    textureLayer2Enabled:layers>=2,material2:choice(materials),
    textureStrength2:integer(0,100),textureScale2:integer(1,100),
    textureRotation2:between(0,360),
    textureLayer3Enabled:layers===3,material3:choice(materials),
    textureStrength3:integer(0,100),textureScale3:integer(1,100),
    textureRotation3:between(0,360),
    viewZoom:between(.52,1.78),viewPanX:between(-35,35),
    viewPanY:between(-35,35),positionX:between(-20,20),
    positionY:between(-20,20),
    interiorElements:[{id:'ink-'+i,type:'line',shape:'wave',
      color:'custom',customColor:'#25aacc',colorSlots:[0,3,6],
      placement:i%2?'contour':'field',frequency:integer(4,20),
      width:between(.5,4),phase:between(0,360)}]
  };
  return normalizeRecipe(input);
}

test('180 deterministic source recipes preserve EVERY canonical field through JSON/URL/PNG',()=>{
  const stats={structures:{},drawn:0,offFrame:0,threeLayer:0,
    dormantSecondLayer:0,locks:0};
  for(let i=0;i<180;i++){
    const source=fixture(i),label='matrix case '+i+' ['+source.structure+']';
    assert.deepEqual(normalizeRecipe(source),source,
      label+' is not a stable normalized source recipe');
    const json=JSON.parse(JSON.stringify(source));
    const url=decodeRecipe(encodeRecipe(source));
    const file=embedPngMetadata(png,
      {title:'Deterministic wallpaper '+i+' 🧪'}, {recipe:source});
    const imported=extractPngRecipe(file);
    for(const [transport,actual] of [['JSON',normalizeRecipe(json)],
      ['shared URL',url],['PNG iTXt',imported]])
      assert.deepEqual(actual,source,label+' altered through '+transport);
    const envelope=JSON.parse(serializePngRecipe(source));
    assert.deepEqual(envelope.recipe,source,label+' PNG envelope loss');
    assert.deepEqual(envelope.output,{width:OUTPUT_WIDTH,height:OUTPUT_HEIGHT});
    const sourceScene=resolveScene(source);
    assert.deepEqual(resolveScene(imported),sourceScene,
      label+' changed geometry/material after PNG restore');
    stats.structures[source.structure]=(stats.structures[source.structure]||0)+1;
    if(source.geometry==='drawn')stats.drawn++;
    if(source.customPath.some(([x])=>x<0||x>1))stats.offFrame++;
    if(source.textureLayer3Enabled)stats.threeLayer++;
    if(!source.textureLayer2Enabled&&source.material2!=='none')
      stats.dormantSecondLayer++;
    if(source.lockedSettings.length)stats.locks++;
    assert.ok(file.length>png.length&&
      Buffer.from(file).includes(Buffer.from(RECIPE_KEYWORD)),
      label+' dropped machine-readable recipe chunk');
  }
  assert.deepEqual(stats.structures,{paths:60,radial:60,regions:60});
  assert.ok(stats.drawn>=25&&stats.offFrame>=120&&
    stats.threeLayer>=35&&stats.dormantSecondLayer>=25&&stats.locks===180,
    'Randomized test lost its deliberately adversarial structural coverage');
  console.log('AGENT4_RECIPE_MATRIX_PASS',JSON.stringify(stats));
});
