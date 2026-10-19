import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,OUTPUT_WIDTH,OUTPUT_HEIGHT}
  from '../src/model.js';
import {embedPngMetadata,extractPngRecipe,serializePngRecipe} from '../src/png-metadata.js';
// This real minimal PNG fixture isolates the data transport from an expensive
// 19.8MP render. Full-resolution renderer and IDAT invariance have other tests.
const png=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64'));

const examples=[
  ['off-frame-drawn-weave',{
    seed:'freehand-outside-frame',structure:'paths',geometry:'drawn',
    customPath:[[-.31,.13],[.3,.7],[.7,.27],[1.32,.91]],
    drawnAnchors:[1,2],drawnCorners:[1],
    crossingMode:'weave',extendDrawnPath:true,viewZoom:.6,
    positionX:22,positionY:-18,geometrySafety:false,
    lockedSettings:['geometry','extendDrawnPath','position']
  }],
  ['three-layer-mixed-availability',{
    seed:'mixed-paper-foils',structure:'paths',material:'linen',
    textureCoverage:'both',textureStrength:63,textureRotation:315.5,
    textureLayer2Enabled:false,material2:'none',
    textureStrength2:0,textureScale2:72,textureRotation2:179.5,
    textureLayer3Enabled:true,material3:'foil',textureCoverage3:'background',
    textureStrength3:78,textureScale3:32,textureRotation3:256.25,
    textureBlend3:'multiply',stripeShadowStrength:49,
    lightingMood:'moonlight',lockedSettings:['textureRotation3','material3']
  }],
  ['radial-custom-ink-stack',{
    seed:'7-colours 🌈',structure:'radial',radialMode:'pinwheel',
    rayCount:21,rayTwist:45,fieldCenterX:62,fieldCenterY:38,
    interiorElements:[
      {id:'ring',type:'line',shape:'loop',stroke:'dotted',color:'custom',
        customColor:'#12ab56',colorSlots:[0,3,6],width:2.25,placement:'field'},
      {id:'separator',enabled:false,type:'band',shape:'straight',
        color:'white',width:23,opacity:.7}
    ],lockedSettings:['interiorElements']
  }],
  ['nested-region-decoration',{
    seed:'region-nested-v2',structure:'regions',regionMode:'nested',
    regionCount:11,regionSides:5,dividerColor:'black',dividerWidth:2.5,
    material:'construction',textureCoverage:'stripes',
    interiorElements:[{id:'contour',type:'line',shape:'wave',
      placement:'contour',frequency:9.3,phase:47,stroke:'dashed',
      objectIds:['region-1'],colorSlots:[2,4],width:1.5}]
  }],
  ['legacy-importable-tonal',{
    seed:'historical-tonal',structure:'paths',construction:'tonal',
    tonalContrast:77,motif:'solid',outline:'white',
    primesOnly:true,reverseStripes:true,mirrorHorizontal:true,
    background:'white'
  }]
];

test('complex source recipes survive JSON, shared URL and embedded PNG without losing hidden settings',()=>{
  for(const [name,original] of examples){
    const recipe=normalizeRecipe(original);
    const json=normalizeRecipe(JSON.parse(JSON.stringify(recipe)));
    const url=decodeRecipe(encodeRecipe(recipe));
    const embedded=embedPngMetadata(png,
      {title:'Transport · '+name,comment:'Contains original adjustable recipe 🌈'},
      {recipe});
    const restored=extractPngRecipe(embedded);
    for(const [transport,actual] of [['JSON',json],['URL',url],['PNG',restored]])
      assert.deepEqual(actual,recipe,name+' lost controls through '+transport);
    assert.deepEqual(resolveScene(restored),resolveScene(recipe),
      name+' changed generated scene in PNG transport');
    const envelope=JSON.parse(serializePngRecipe(recipe));
    assert.deepEqual(envelope.output,{width:OUTPUT_WIDTH,height:OUTPUT_HEIGHT});
    assert.deepEqual(envelope.recipe,recipe);
    assert.equal(restored.seed,recipe.seed);
    assert.deepEqual(restored.lockedSettings,recipe.lockedSettings);
  }
});

test('otherwise dormant path, material and interior fields remain available after transport',()=>{
  const drawn=extractPngRecipe(embedPngMetadata(png,{},{
    recipe:examples.find(([name])=>name==='off-frame-drawn-weave')[1]
  }));
  assert.equal(drawn.geometry,'drawn');
  assert.equal(drawn.extendDrawnPath,true);
  assert.ok(drawn.customPath[0][0]<0&&drawn.customPath.at(-1)[0]>1);
  assert.equal(drawn.crossingMode,'weave');

  const layer=extractPngRecipe(embedPngMetadata(png,{},{
    recipe:examples.find(([name])=>name==='three-layer-mixed-availability')[1]
  }));
  assert.equal(layer.textureLayer2Enabled,false);
  assert.equal(layer.textureLayer3Enabled,true);
  assert.equal(layer.textureRotation3,256.25);
  assert.equal(layer.textureBlend3,'multiply');

  const radial=decodeRecipe(encodeRecipe(examples.find(([name])=>
    name==='radial-custom-ink-stack')[1]));
  assert.deepEqual(radial.interiorElements.map(x=>x.enabled),[true,false]);
  assert.deepEqual(radial.interiorElements[0].colorSlots,[0,3,6]);
  assert.equal(radial.interiorElements[0].customColor,'#12ab56');

  const legacy=decodeRecipe(encodeRecipe(examples.find(([name])=>
    name==='legacy-importable-tonal')[1]));
  assert.equal(legacy.construction,'tonal',
    'a hidden new-recipe UI option is still supported in historical imports');
});
