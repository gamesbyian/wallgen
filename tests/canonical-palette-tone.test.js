import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HUES,COLOR_STORIES,normalizeRecipe,resolveScene,paletteHsl,
  respectSettingLocks,encodeRecipe,decodeRecipe,randomizeAllRecipe,
  LOCKABLE_SETTINGS} from '../src/model.js';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';

const colours=recipe=>resolveScene(recipe).stripes.map(s=>s.color);
test('opt-in Tone has no rendering or colour-story effect for existing generated art',()=>{
  const plain=normalizeRecipe({seed:'colour-parity',family:'studio',palette:'jewel'});
  assert.equal(plain.paletteToneEnabled,false);
  assert.deepEqual(colours(plain),colours({...plain,
    paletteSaturation:23,paletteLightness:13,paletteToneEnabled:false}),
    'disabled custom values cannot silently change a palette');
  for(const palette of ['classic','pastel','jewel','muted','candy']){
    const base=normalizeRecipe({seed:'palette-parity',palette,
      family:'studio',orientation:'vertical'});
    assert.deepEqual(colours(base),colours({...base,paletteToneEnabled:false,
      paletteSaturation:1,paletteLightness:1}),palette);
    assert.equal(COLOR_STORIES[palette].sat>0,true);
  }
  assert.equal(randomizeAllRecipe().paletteToneEnabled,false,
    'unrestricted randomize must not silently opt into a new treatment');
});

test('independent saturation and lightness are real canonical scene colours across all seven objects',()=>{
  const base={seed:'tone-studio',family:'studio',palette:'classic',
    paletteToneEnabled:true,paletteSaturation:23,paletteLightness:70,
    structure:'regions',regionMode:'scattered',scatteredCount:7,
    outline:'none',material:'none'};
  const source=normalizeRecipe(base);
  const scene=resolveScene(source);
  assert.equal(scene.stripes.length,7);
  assert.ok(scene.stripes.every(s=>/ 23% 70%\)$/.test(s.color)));
  assert.equal(scene.objects.length,7);
  assert.deepEqual(scene.objects.map(o=>o.color),scene.stripes.map(s=>s.color));
  const dark=normalizeRecipe({...base,paletteSaturation:88,paletteLightness:13});
  assert.ok(colours(dark).every(value=>/ 88% 13%\)$/.test(value)),
    'very dark real source colours must now be representable without altering underlying geometry');
  const zero=normalizeRecipe({...base,paletteSaturation:-200,paletteLightness:Infinity});
  assert.equal(zero.paletteSaturation,0);
  assert.equal(zero.paletteLightness,58);
  assert.ok(colours(zero).every(value=>/ 0% 58%\)$/.test(value)));
  assert.deepEqual(decodeRecipe(encodeRecipe(dark)),dark);
});

test('a custom tone preserves distinct source hues and source-story offsets without changing seeded geometry',()=>{
  const recipe=normalizeRecipe({seed:'geometry-stable',palette:'sunset',
    orientation:'diagonal',geometry:'jagged',paletteToneEnabled:true,
    paletteSaturation:35,paletteLightness:22});
  const before=resolveScene({...recipe,paletteToneEnabled:false});
  const after=resolveScene(recipe);
  assert.deepEqual(before.stripes.map(s=>({center:s.center,width:s.width,phase:s.phase})),
    after.stripes.map(s=>({center:s.center,width:s.width,phase:s.phase})));
  assert.notDeepEqual(before.stripes.map(s=>s.color),after.stripes.map(s=>s.color));
  const randomized=()=>.5;
  const withStory=paletteHsl(HUES[0],'sunset',randomized,
    {enabled:true,saturation:35,lightness:22});
  assert.match(withStory,/ 35% 19%\)$/,'sunset individual light offsets remain authored');
});

test('individual tone controls lock and Undo-transport like ordinary creative settings',()=>{
  const current=normalizeRecipe({seed:'tone-lock',paletteToneEnabled:true,
    paletteSaturation:23,paletteLightness:70,
    lockedSettings:['paletteToneEnabled','paletteSaturation']});
  const next=normalizeRecipe({...current,paletteToneEnabled:false,
    paletteSaturation:100,paletteLightness:13});
  const protectedRecipe=respectSettingLocks(current,next);
  assert.equal(protectedRecipe.paletteToneEnabled,true);
  assert.equal(protectedRecipe.paletteSaturation,23);
  assert.equal(protectedRecipe.paletteLightness,13);
  assert.deepEqual(decodeRecipe(encodeRecipe(protectedRecipe)),protectedRecipe);
  for(const key of ['paletteToneEnabled','paletteSaturation','paletteLightness'])
    assert.ok(LOCKABLE_SETTINGS.includes(key));
});

test('editor exposes one separate compact Tone tool backed by canonical source inputs',()=>{
  const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const colour=EDITOR_CATEGORIES.find(x=>x.id==='colour');
  const tone=colour.tools.filter(t=>t.id==='tone');
  assert.equal(tone.length,1);
  assert.deepEqual(tone[0].settings,
    ['paletteToneEnabled','paletteSaturation','paletteLightness']);
  for(const key of tone[0].settings){
    assert.equal((page.match(new RegExp('name="'+key+'"','g'))||[]).length,1);
    assert.ok(app.includes("'"+key+"'"));
  }
  assert.ok(app.includes("inactive.add('paletteSaturation')"));
  assert.ok(app.includes("field.dataset.inactive='false'"),
    'newly activated ranges enter the same synchronous change/Undo transaction');
});
