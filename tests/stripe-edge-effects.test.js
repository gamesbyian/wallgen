import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe,respectSettingLocks,
  EFFECT_PLACEMENTS,SHADOW_COLOUR_MODES,GLOW_COLOUR_MODES} from '../src/model.js';
import {artKey} from '../src/render-art-key.js';
import {stripeShadowParameters} from '../src/renderer.js';
import {cssRgb,effectRgb,effectRgba,paintInsetEdge,normalHex} from '../src/stripe-edge-effects.js';

test('shadow and glow modes normalize, serialize, and retain independently',()=>{
  const recipe=normalizeRecipe({
    stripeShadowStrength:100,stripeShadowSoftness:0,stripeShadowPlacement:'both',
    stripeShadowColorMode:'custom',stripeShadowCustomColor:'#123AbC',stripeShadowInvert:true,
    glow:50,glowPlacement:'inner',glowColorMode:'white',
    glowCustomColor:'#Ff0000',glowInvert:true
  });
  assert.equal(recipe.stripeShadowCustomColor,'#123abc');
  assert.equal(recipe.glowCustomColor,'#ff0000');
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  for(const placement of EFFECT_PLACEMENTS)assert.equal(
    normalizeRecipe({stripeShadowPlacement:placement,glowPlacement:placement}).glowPlacement,placement);
  for(const mode of SHADOW_COLOUR_MODES)assert.equal(normalizeRecipe({stripeShadowColorMode:mode}).stripeShadowColorMode,mode);
  for(const mode of GLOW_COLOUR_MODES)assert.equal(normalizeRecipe({glowColorMode:mode}).glowColorMode,mode);
  assert.equal(normalizeRecipe({stripeShadowPlacement:'outside',glowColorMode:'neon'}).stripeShadowPlacement,'outer');
  assert.equal(normalizeRecipe({stripeShadowCustomColor:'url(javascript:abc)'}).stripeShadowCustomColor,'#ffffff');
  assert.equal(normalHex('#bAdDad'),'#baddad');
});
test('new locks preserve shadow and glow choices under edits',()=>{
  const before=normalizeRecipe({stripeShadowInvert:true,glowPlacement:'both',
    stripeShadowColorMode:'black',lockedSettings:['stripeShadowInvert','glowPlacement','stripeShadowColorMode']});
  const after=respectSettingLocks(before,{...before,stripeShadowInvert:false,
    glowPlacement:'inner',stripeShadowColorMode:'white'});
  assert.equal(after.stripeShadowInvert,true);
  assert.equal(after.glowPlacement,'both');
  assert.equal(after.stripeShadowColorMode,'black');
});
test('stripe colours and inversion are exact and complement independently of opacity',()=>{
  assert.deepEqual(cssRgb('hsl(0.0 100% 50%)'),[255,0,0]);
  assert.deepEqual(cssRgb('hsl(120.0 100% 50%)'),[0,255,0]);
  assert.deepEqual(effectRgb('stripe','hsl(0 100% 50%)'),[255,0,0]);
  assert.deepEqual(effectRgb('stripe','hsl(0 100% 50%)','#ffffff',true),[0,255,255]);
  assert.deepEqual(effectRgb('black','hsl(0 100% 50%)','#ffffff',true),[255,255,255]);
  assert.deepEqual(effectRgb('white','hsl(0 100% 50%)','#ffffff',true),[0,0,0]);
  assert.deepEqual(effectRgb('custom','', '#13579b',true),[236,168,100]);
  assert.deepEqual(effectRgb('dark-stripe','hsl(0 100% 50%)'),[122,0,0]);
  assert.equal(effectRgba('white','',null,false,1),'rgba(255,255,255,1.0000)');
});
test('only legacy outer silhouette shadows use the instant compositor',()=>{
  const legacy=normalizeRecipe({stripeShadowStrength:55});
  assert.ok(stripeShadowParameters(legacy));
  assert.equal(stripeShadowParameters({...legacy,stripeShadowPlacement:'inner'}),null);
  assert.equal(stripeShadowParameters({...legacy,stripeShadowColorMode:'black'}),null);
  assert.equal(stripeShadowParameters({...legacy,stripeShadowInvert:true}),null);
  assert.ok(stripeShadowParameters({...legacy,stripeShadowPlacement:'both'}),
    'both retains the original outer shadow');
  assert.equal(artKey({...legacy,stripeShadowStrength:33}),artKey(legacy));
  assert.notEqual(artKey({...legacy,stripeShadowColorMode:'black'}),
    artKey({...legacy,stripeShadowColorMode:'black',stripeShadowStrength:33}));
  assert.notEqual(artKey({...legacy,stripeShadowPlacement:'inner'}),
    artKey({...legacy,stripeShadowPlacement:'inner',stripeShadowSoftness:12}));
});
test('inset painter clips compound silhouettes and never fills their interior directly',()=>{
  const oldPath=globalThis.Path2D;
  let clipRule,fillRule,composite;
  globalThis.Path2D=class {
    rect(){} addPath(shape){assert.ok(shape);}
  };
  const ctx={
    save(){},restore(){},
    clip(_path,rule){clipRule=rule;},
    fill(_path,rule){fillRule=rule;composite=this.globalCompositeOperation;},
  };
  try{paintInsetEdge(ctx,{}, {colour:'rgba(255,255,255,1)',rule:'evenodd',blur:0});}
  finally{globalThis.Path2D=oldPath;}
  assert.equal(clipRule,'evenodd');
  assert.equal(fillRule,'evenodd');
  assert.equal(composite,'source-atop');
});
