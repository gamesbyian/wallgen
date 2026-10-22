import test from 'node:test';
import {pathPosition} from '../src/path-geometry.js';
import {outlineDimensions} from '../src/renderer.js';
import {materialHeight,materialContourHeight} from '../src/material-surface.js';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import { DESIGN_WIDTH, DESIGN_HEIGHT, OUTPUT_WIDTH, OUTPUT_HEIGHT, HUES, NAMES, FAMILIES, GEOMETRIES, MOTIFS, MATERIALS, OUTLINES, normalizeRecipe, resolveScene, rng, encodeRecipe, decodeRecipe, TEXTURE_COVERAGES, BLEND_MODES, normalizeRotation, randomizeAllRecipe, LOCKABLE_SETTINGS, respectSettingLocks, isPrime, PRIME_PERCENTAGES, PRIME_ROTATIONS, LIGHTING_MOODS, LIGHT_DIRECTIONS, LINE_STYLES } from '../src/model.js';

test('Pixel 6 Pro export has 210% linear dimensions and unchanged aspect ratio',()=>{
  assert.equal(OUTPUT_WIDTH,1440*2.1);
  assert.equal(OUTPUT_HEIGHT,3120*2.1);
  assert.equal(OUTPUT_WIDTH/OUTPUT_HEIGHT,DESIGN_WIDTH/DESIGN_HEIGHT);
  assert.equal(OUTPUT_WIDTH*OUTPUT_HEIGHT,19813248);
});
test('ROYGBIV invariant, positive widths, strictly ascending stripe positions',()=>{
  for(const family of ['auto',...FAMILIES]){
    for(let i=0;i<100;i++){
      const scene=resolveScene({seed:`${family}-${i}`,family,chaos:100,stripeWidth:100,spread:90,individuality:100});
      assert.equal(scene.stripes.length,7);
      assert.deepEqual(scene.stripes.map(s=>s.name),NAMES);
      assert.equal(HUES.length,7);
      assert.ok(scene.stripes.every(s=>s.width>0 && typeof s.color==='string'));
      for(let j=1;j<7;j++)assert.ok(scene.stripes[j].center>scene.stripes[j-1].center);
    }
  }
});
test('same seed and settings are fully deterministic',()=>{
  const config={seed:'this-is-a-seed',family:'contour',palette:'pastel',material:'linen',orientation:'diagonal',individuality:93};
  assert.deepEqual(resolveScene(config),resolveScene(config));
  assert.deepEqual(Array.from({length:12},(_,i)=>rng(`test-${i}`)()),Array.from({length:12},(_,i)=>rng(`test-${i}`)()));
  assert.notDeepEqual(resolveScene({...config,seed:'another-seed'}).stripes,resolveScene(config).stripes);
});
test('all explicit choices override family suggestions',()=>{
  const recipe={seed:'explicit',family:'tapestry',orientation:'horizontal',geometry:'stepped',motif:'stars',palette:'electric',outline:'broken',material:'felt'};
  const scene=resolveScene(recipe);
  for(const key of ['family','orientation','geometry','motif','palette','outline','material']) assert.equal(scene[key],recipe[key]);
});
test('all families and combinations resolve without invalid styles',()=>{
  for(const family of FAMILIES)for(const geometry of GEOMETRIES)for(const motif of MOTIFS){
    const scene=resolveScene({seed:'matrix',family,geometry,motif});
    assert.ok(GEOMETRIES.includes(scene.geometry));
    assert.ok(MOTIFS.includes(scene.motif));
    assert.ok(MATERIALS.includes(scene.material));
    assert.ok(OUTLINES.includes(scene.outline));
  }
});
test('recipe URL survives Unicode, malformed data is rejected',()=>{
  const recipe=normalizeRecipe({seed:'虹🌈',material:'denim',chaos:99});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.equal(decodeRecipe('%notaJSON'),null);
  assert.equal(decodeRecipe('null'),null);
});
test('input normalization handles invalid slider settings and future versions',()=>{
  const recipe=normalizeRecipe({seed:'',geometry:'nonsense',material:'unavailable',chaos:999,stripeWidth:-45,spread:'garbage'});
  assert.equal(recipe.geometry,'auto');assert.equal(recipe.material,'auto');
  assert.equal(recipe.chaos,100);assert.equal(recipe.stripeWidth,0);assert.equal(recipe.spread,56);
  assert.equal(recipe.seed,'rainbow-001');
});


test('backgrounds default to black and white stays in saved recipes',()=>{
  assert.equal(normalizeRecipe({}).background,'black');
  assert.equal(normalizeRecipe({background:'white'}).background,'white');
  assert.equal(resolveScene({seed:'white-test',background:'white',outline:'black'}).background,'white');
  assert.equal(resolveScene({seed:'white-test',background:'white',outline:'black'}).outline,'black');
  assert.equal(decodeRecipe(encodeRecipe({background:'white',outline:'black-double'})).background,'white');
  assert.equal(decodeRecipe(encodeRecipe({background:'white',outline:'black-double'})).outline,'black-double');
  for(const outline of OUTLINES) assert.equal(normalizeRecipe({outline}).outline,outline);
});

test('material coverage defaults to both surfaces and survives URL recipes',()=>{
  assert.equal(normalizeRecipe({}).textureCoverage,'both');
  for(const textureCoverage of TEXTURE_COVERAGES){
    const recipe=normalizeRecipe({seed:'materials',textureCoverage,background:'white',material:'linen'});
    assert.equal(resolveScene(recipe).textureCoverage,textureCoverage);
    assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  }
  assert.equal(normalizeRecipe({textureCoverage:'invalid'}).textureCoverage,'both');
});
test('stripe individuality only changes geometry, never motifs',()=>{
  for(const family of FAMILIES)for(const individuality of [0,20,50,80,100]){
    for(const motif of MOTIFS){
      const scene=resolveScene({seed:'geometry-only',family,motif,individuality,chaos:100});
      assert.ok(scene.stripes.every(s=>s.motif===motif),family+'/'+motif+'/'+individuality);
      if(individuality===0)assert.ok(scene.stripes.every(s=>s.parallelMix===0 && s.geometry===scene.geometry));
      if(individuality===100){
        assert.ok(scene.stripes.every(s=>s.parallelMix===.45),'coherent mode limits stripe-to-stripe drift');
        const unrestricted=resolveScene({seed:'geometry-only',family,motif,individuality,chaos:100,geometrySafety:false});
        assert.ok(unrestricted.stripes.every(s=>s.parallelMix===1),'unrestricted uses full individuality range');
      }
    }
  }
});
test('pattern homogeneity and override persist without affecting stripe motif identity',()=>{
  const recipe=normalizeRecipe({seed:'homogeneous',motif:'stars',patternHomogeneity:27,individuality:100,overridePatternHomogeneity:true});
  assert.equal(recipe.patternHomogeneity,27);
  assert.equal(recipe.overridePatternHomogeneity,true);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.ok(resolveScene(recipe).stripes.every(s=>s.motif==='stars'));
  assert.equal(normalizeRecipe({}).patternHomogeneity,100);
  assert.equal(normalizeRecipe({}).overridePatternHomogeneity,false);
});
test('Randomize all provides complete normalized settings without preserving manual overrides',()=>{
  const recipe=randomizeAllRecipe();
  assert.equal(recipe.version,2);
  assert.ok(FAMILIES.includes(recipe.family));
  assert.ok(GEOMETRIES.includes(recipe.geometry));
  assert.ok(MOTIFS.includes(recipe.motif));
  assert.ok(MATERIALS.includes(recipe.material));
  assert.ok(OUTLINES.includes(recipe.outline));
  assert.ok(TEXTURE_COVERAGES.includes(recipe.textureCoverage));
  assert.ok(['black','white'].includes(recipe.background));
  for(const key of ['chaos','stripeWidth','spread','textureStrength','textureScale','individuality','gap','glow']){
    assert.ok(recipe[key]>=0 && recipe[key]<=100,key);
  }
  assert.equal(resolveScene(recipe).stripes.length,7);
});

test('directional canvas offsets are bounded, deterministic, and portable',()=>{
  const original=resolveScene({seed:'nudge-coordinate-check',orientation:'horizontal'});
  const moved=resolveScene({seed:'nudge-coordinate-check',orientation:'horizontal',positionX:8,positionY:-6});
  assert.equal(normalizeRecipe({}).positionX,0);
  assert.equal(normalizeRecipe({}).positionY,0);
  assert.equal(normalizeRecipe({positionX:500,positionY:-500}).positionX,30);
  assert.equal(normalizeRecipe({positionX:500,positionY:-500}).positionY,-30);
  // Nudge lives only in the presentation offset, not the underlying geometry.
  assert.equal(moved.centerX,original.centerX);
  assert.equal(moved.centerY,original.centerY);
  assert.deepEqual(moved.stripes,original.stripes);
  assert.equal(moved.positionX,8);
  assert.equal(moved.positionY,-6);
  const recipe=normalizeRecipe({seed:'move-portably',positionX:20,positionY:-12});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.equal(randomizeAllRecipe().positionX,0);
  assert.equal(randomizeAllRecipe().positionY,0);
});

test('three independent texture layers round-trip through share URLs and resolved scenes',()=>{
  const recipe=normalizeRecipe({
    seed:'adobe-corduroy',material:'adobe',textureCoverage:'both',textureRotation:30.5,
    textureLayer2Enabled:true,material2:'corduroy',textureCoverage2:'background',
    textureStrength2:64,textureScale2:22,textureRotation2:90,textureBlend2:'multiply',
    textureLayer3Enabled:true,material3:'foil',textureCoverage3:'stripes',
    textureStrength3:44,textureScale3:87,textureRotation3:255.5,textureBlend3:'screen',
  });
  const scene=resolveScene(recipe);
  assert.equal(scene.textureLayers.length,3);
  assert.deepEqual(scene.textureLayers.map(x=>x.material),['adobe','corduroy','foil']);
  assert.deepEqual(scene.textureLayers.map(x=>x.rotation),[30.5,90,255.5]);
  assert.deepEqual(scene.textureLayers.map(x=>x.coverage),['both','background','stripes']);
  assert.deepEqual(scene.textureLayers.map(x=>x.blend),['normal','multiply','screen']);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.ok(scene.materialSummary.includes('corduroy'));
});
test('one-layer recipes remain single-layer and optional layers can be selected independently',()=>{
  const legacy=normalizeRecipe({seed:'classic',material:'linen'});
  assert.equal(resolveScene(legacy).textureLayers.length,1);
  assert.equal(legacy.textureRotation,0);
  assert.equal(legacy.textureBlend,'normal');
  assert.equal(legacy.textureLayer2Enabled,false);
  assert.equal(legacy.textureLayer3Enabled,false);
  const hidden=resolveScene({...legacy,textureLayer3Enabled:true,material3:'adobe'});
  assert.equal(hidden.textureLayers.length,2);
  assert.equal(hidden.textureLayers[1].material,'adobe');
  const threeOnly=normalizeRecipe({...legacy,textureLayer2Enabled:false,
    material2:'none',textureLayer3Enabled:true,material3:'foil'});
  assert.deepEqual(resolveScene(threeOnly).textureLayers.map(x=>x.material),['linen','foil']);
  assert.deepEqual(decodeRecipe(encodeRecipe(threeOnly)),threeOnly);
  const none=resolveScene({...legacy,material:'none'});
  assert.equal(none.textureLayers.length,0);
});
test('normalizes rotations and blend modes and recognizes corduroy spelling',()=>{
  assert.equal(normalizeRotation(-90),270);
  assert.equal(normalizeRotation(450),90);
  assert.equal(normalizeRotation(360.5),0.5);
  assert.equal(normalizeRotation('invalid'),0);
  assert.equal(normalizeRecipe({material2:'courduroy'}).material2,'corduroy');
  assert.equal(normalizeRecipe({textureBlend:'unsupported'}).textureBlend,'normal');
  for(const mode of BLEND_MODES)assert.equal(normalizeRecipe({textureBlend3:mode}).textureBlend3,mode);
  assert.ok(MATERIALS.includes('adobe'));
  assert.ok(MATERIALS.includes('corduroy'));
});

test('stripe spread changes centre spacing without changing any stripe width or geometry',()=>{
  for(const family of FAMILIES)for(const seed of ['fixed-a','fixed-b','fixed-c']){
    const options={seed,family,stripeWidth:74,individuality:81,chaos:92};
    const compact=resolveScene({...options,spread:0});
    const normal=resolveScene({...options,spread:56});
    const expanded=resolveScene({...options,spread:100});
    for(let i=0;i<7;i++){
      const a=compact.stripes[i],b=normal.stripes[i],c=expanded.stripes[i];
      assert.ok(Math.abs(a.width-b.width)<1e-8 && Math.abs(a.width-c.width)<1e-8,`width changed: ${family}/${i}`);
      for(const key of ['displacement','sharedDisplacement','taper','tilt','geometry']){
        assert.equal(a[key],b[key],key);assert.equal(b[key],c[key],key);
      }
      if(i>0){
        const compactGap=compact.stripes[i].center-compact.stripes[i-1].center;
        const expandedGap=expanded.stripes[i].center-expanded.stripes[i-1].center;
        assert.ok(expandedGap>compactGap,`gap failed: ${family}/${i}`);
      }
    }
  }
  const thin=resolveScene({seed:'width-is-independent',spread:50,stripeWidth:0});
  const thick=resolveScene({seed:'width-is-independent',spread:50,stripeWidth:100});
  assert.ok(thick.stripes.every((stripe,i)=>stripe.width>thin.stripes[i].width));
});
test('texture displacement defaults off, clamps to the slider range, and round-trips',()=>{
  const legacy=normalizeRecipe({seed:'legacy'});
  assert.equal(legacy.textureDisplacement,0);
  assert.equal(normalizeRecipe({textureDisplacement:999}).textureDisplacement,100);
  assert.equal(normalizeRecipe({textureDisplacement:-99}).textureDisplacement,0);
  const mapped=normalizeRecipe({seed:'relief-seed',material:'stucco',textureDisplacement:72,
    textureLayer2Enabled:true,material2:'adobe',textureRotation2:90,textureCoverage2:'stripes'});
  assert.equal(resolveScene(mapped).textureDisplacement,72);
  assert.deepEqual(decodeRecipe(encodeRecipe(mapped)),mapped);
  const random=randomizeAllRecipe();
  assert.ok(random.textureDisplacement>=0 && random.textureDisplacement<=100);
});

test('locked settings are preserved by randomization and by attempted edits',()=>{
  const current=normalizeRecipe({
    seed:'do-not-change',family:'tapestry',geometry:'wave',background:'white',
    stripeWidth:83,textureRotation2:270,textureLayer2Enabled:true,
    lockedSettings:['seed','background','stripeWidth','textureRotation2','position'],
    positionX:12,positionY:-8,
  });
  const incoming=randomizeAllRecipe();
  const next=respectSettingLocks(current,incoming);
  for(const key of current.lockedSettings.filter(k=>k!=='position')){
    assert.equal(next[key],current[key],key);
  }
  assert.equal(next.positionX,12);
  assert.equal(next.positionY,-8);
  assert.deepEqual(next.lockedSettings,current.lockedSettings);
  assert.deepEqual(decodeRecipe(encodeRecipe(next)),next);
  assert.equal(LOCKABLE_SETTINGS.includes('textureLayer3Enabled'),false);
});
test('locked Follow family keeps the actually selected style through a new seed',()=>{
  const original=resolveScene({seed:'auto-lock-original',family:'auto',outline:'auto'});
  const recipe=normalizeRecipe({seed:'auto-lock-original',family:'auto',outline:'auto',
    lockedSettings:['family','outline'],
    lockedResolved:{family:original.family,outline:original.outline}});
  const newSeedRecipe=respectSettingLocks(recipe,{...recipe,seed:'completely-new-seed',family:'studio',outline:'black'});
  assert.equal(resolveScene(newSeedRecipe).family,original.family);
  assert.equal(resolveScene(newSeedRecipe).outline,original.outline);
  assert.equal(resolveScene(recipe).family,original.family);
  assert.equal(resolveScene(recipe).outline,original.outline);
  assert.deepEqual(decodeRecipe(encodeRecipe(newSeedRecipe)),newSeedRecipe);
});
test('lock list rejects unknown keys and normalizes stable order',()=>{
  const recipe=normalizeRecipe({lockedSettings:['spread','unknown','seed','spread','textureBlend3']});
  assert.deepEqual(recipe.lockedSettings,['seed','textureBlend3','spread']);
  assert.deepEqual(normalizeRecipe({lockedSettings:['geometry'],lockedResolved:{geometry:'zigzag',palette:'pastel'}}).lockedResolved,
    {geometry:'zigzag'});
});

test('prime-only randomization constrains every randomized percentage and texture rotation',()=>{
  const numeric=['chaos','stripeWidth','spread','textureStrength','textureScale','textureDisplacement',
    'textureStrength2','textureScale2','textureStrength3','textureScale3',
    'individuality','patternHomogeneity','gap','glow','lightStrength','shadowStrength','shapeFrequency','shapeDepth',
    'stripeShadowStrength','stripeShadowSoftness'];
  const angles=['textureRotation','textureRotation2','textureRotation3'];
  assert.equal(PRIME_PERCENTAGES[0],2);
  assert.equal(PRIME_PERCENTAGES.at(-1),97);
  assert.equal(PRIME_ROTATIONS[0],2);
  assert.equal(PRIME_ROTATIONS.at(-1),359);
  assert.equal(isPrime(0),false);
  assert.equal(isPrime(1),false);
  assert.equal(isPrime(2),true);
  assert.equal(isPrime(97),true);
  assert.equal(isPrime(100),false);
  for(let i=0;i<120;i++){
    const recipe=randomizeAllRecipe({primesOnly:true});
    assert.equal(recipe.primesOnly,true);
    for(const key of numeric)assert.ok(isPrime(recipe[key]),key+'='+recipe[key]);
    for(const key of angles)assert.ok(isPrime(recipe[key]),key+'='+recipe[key]);
    assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  }
});
test('prime-only mode respects locked non-prime values and leaves mode unchanged',()=>{
  const original=normalizeRecipe({
    seed:'prime-lock-seed',primesOnly:true,chaos:100,spread:52,textureRotation:90,
    lockedSettings:['chaos','textureRotation','primesOnly'],
  });
  for(let i=0;i<40;i++){
    const recipe=respectSettingLocks(original,randomizeAllRecipe({primesOnly:original.primesOnly}));
    assert.equal(recipe.chaos,100);
    assert.equal(recipe.textureRotation,90);
    assert.equal(recipe.primesOnly,true);
    assert.ok(isPrime(recipe.spread));
    assert.ok(isPrime(recipe.stripeWidth));
    assert.ok(isPrime(recipe.textureRotation2));
  }
  assert.equal(normalizeRecipe({}).primesOnly,false);
  assert.equal(normalizeRecipe({primesOnly:'true'}).primesOnly,true);
});

test('lighting is off for existing recipes and does not alter stripe geometry',()=>{
  const legacy={seed:'legacy-light',material:'linen',motif:'stars',individuality:77};
  const unchanged=resolveScene(legacy);
  assert.equal(unchanged.lightingMood,'off');
  assert.equal(unchanged.lightStrength,45);
  assert.equal(unchanged.shadowStrength,28);
  for(const mood of LIGHTING_MOODS){
    for(const direction of LIGHT_DIRECTIONS){
      const scene=resolveScene({...legacy,lightingMood:mood,lightDirection:direction,
        lightStrength:80,shadowStrength:80});
      assert.deepEqual(scene.stripes,unchanged.stripes);
      assert.equal(scene.centerX,unchanged.centerX);
      assert.equal(scene.centerY,unchanged.centerY);
    }
  }
});

test('lighting controls are bounded, saved and individually lockable',()=>{
  const recipe=normalizeRecipe({
    seed:'light-lock',lightingMood:'golden',lightDirection:'bottom-right',
    lightStrength:73,shadowStrength:19,
    lockedSettings:['lightingMood','lightDirection','shadowStrength'],
  });
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.ok(LOCKABLE_SETTINGS.includes('lightStrength'));
  assert.ok(LOCKABLE_SETTINGS.includes('shadowStrength'));
  const random=respectSettingLocks(recipe,randomizeAllRecipe({primesOnly:true}));
  assert.equal(random.lightingMood,'golden');
  assert.equal(random.lightDirection,'bottom-right');
  assert.equal(random.shadowStrength,19);
  assert.ok(isPrime(random.lightStrength));
  assert.equal(normalizeRecipe({lightingMood:'bad'}).lightingMood,'off');
  assert.equal(normalizeRecipe({lightDirection:'bad'}).lightDirection,'top-left');
  assert.equal(normalizeRecipe({lightStrength:900}).lightStrength,100);
  assert.equal(normalizeRecipe({shadowStrength:-9}).shadowStrength,0);
});

test('Prime mode is deliberately never lockable, including old saved recipes',()=>{
  assert.equal(LOCKABLE_SETTINGS.includes('primesOnly'),false);
  const legacy=normalizeRecipe({
    primesOnly:true,lockedSettings:['primesOnly','seed','stripeShadowStrength'],
    stripeShadowStrength:63,
  });
  assert.deepEqual(legacy.lockedSettings,['seed','stripeShadowStrength']);
  assert.equal(legacy.primesOnly,true);
  assert.deepEqual(decodeRecipe(encodeRecipe(legacy)),legacy);
});
test('optional stripe shadows are independent of ambient lighting and preserve geometry',()=>{
  const base={seed:'stripe-cast-shadow',lightingMood:'golden',shadowStrength:90};
  const original=resolveScene(base);
  assert.equal(original.stripeShadowStrength,0);
  assert.equal(original.stripeShadowSoftness,55);
  assert.equal(original.stripeShadowDirection,'top-left');
  const enabled=resolveScene({...base,stripeShadowStrength:85,
    stripeShadowSoftness:12,stripeShadowDirection:'bottom-right',lightingMood:'off'});
  assert.deepEqual(enabled.stripes,original.stripes);
  assert.equal(enabled.centerX,original.centerX);
  assert.equal(enabled.centerY,original.centerY);
  assert.equal(enabled.lightingMood,'off');
  assert.equal(enabled.stripeShadowStrength,85);
  assert.deepEqual(decodeRecipe(encodeRecipe(enabled)),normalizeRecipe(enabled));
});
test('stripe shadows honor locks while randomizing other options',()=>{
  const orig=normalizeRecipe({
    seed:'locked-shadow',stripeShadowStrength:75,
    stripeShadowSoftness:81,stripeShadowDirection:'bottom-left',
    lockedSettings:['stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection'],
  });
  for(let i=0;i<24;i++){
    const next=respectSettingLocks(orig,randomizeAllRecipe({primesOnly:true}));
    assert.equal(next.stripeShadowStrength,75);
    assert.equal(next.stripeShadowSoftness,81);
    assert.equal(next.stripeShadowDirection,'bottom-left');
    assert.equal(next.stripeShadowStrength,75);
  }
  assert.equal(normalizeRecipe({stripeShadowStrength:500}).stripeShadowStrength,100);
  assert.equal(normalizeRecipe({stripeShadowSoftness:-20}).stripeShadowSoftness,0);
  assert.equal(normalizeRecipe({stripeShadowDirection:'invalid'}).stripeShadowDirection,'top-left');
});

test('new path and line-style controls preserve existing recipes by default',()=>{
  const legacy=normalizeRecipe({seed:'legacy-chevron',geometry:'wave',motif:'dots'});
  assert.equal(legacy.lineStyle,'continuous');
  assert.equal(legacy.shapeFrequency,50);
  assert.equal(legacy.shapeDepth,50);
  assert.ok(GEOMETRIES.includes('chevron'));
  assert.deepEqual(LINE_STYLES,['continuous','dotted','dashed']);
  const existing=resolveScene(legacy), explicit=resolveScene({...legacy,
    lineStyle:'continuous',shapeFrequency:50,shapeDepth:50});
  assert.deepEqual(existing.stripes,explicit.stripes);
  assert.deepEqual(decodeRecipe(encodeRecipe(legacy)),legacy);
});
test('chevron is a geometry separate from the chevron motif; line styles combine with any pattern',()=>{
  for(const geometry of GEOMETRIES){
    for(const lineStyle of LINE_STYLES){
      const scene=resolveScene({seed:'combine-geometry',family:'studio',
        geometry,motif:'chevrons',lineStyle,individuality:0,
        ...(geometry==='drawn'?{customPath:[[.5,.1],[.6,.4],[.4,.8]]}:{})});
      assert.equal(scene.stripes.length,7);
      assert.ok(scene.stripes.every(s=>s.geometry===geometry&&s.motif==='chevrons'&&s.lineStyle===lineStyle));
    }
  }
  const chevron=normalizeRecipe({geometry:'chevron',motif:'solid'});
  assert.equal(chevron.geometry,'chevron');
  assert.equal(chevron.motif,'solid');
  assert.equal(normalizeRecipe({lineStyle:'not-valid'}).lineStyle,'continuous');
});
test('frequency controls pitch without changing widths; depth controls displacement',()=>{
  const base={seed:'shape-frequencies',family:'studio',geometry:'zigzag',individuality:0};
  const slow=resolveScene({...base,shapeFrequency:0,shapeDepth:50});
  const fast=resolveScene({...base,shapeFrequency:100,shapeDepth:50});
  assert.ok(slow.stripes[0].sharedPeriod>fast.stripes[0].sharedPeriod*4);
  assert.deepEqual(slow.stripes.map(s=>s.width),fast.stripes.map(s=>s.width));
  const flat=resolveScene({...base,shapeFrequency:50,shapeDepth:0});
  const deep=resolveScene({...base,shapeFrequency:50,shapeDepth:100});
  assert.ok(deep.stripes[0].sharedDisplacement>flat.stripes[0].sharedDisplacement*3);
  assert.deepEqual(flat.stripes.map(s=>s.width),deep.stripes.map(s=>s.width));
});
test('shape sliders and line-style selectors respect locks, Prime mode and saved URLs',()=>{
  const base=normalizeRecipe({seed:'shape-lock',lineStyle:'dashed',
    shapeFrequency:67,shapeDepth:79,lockedSettings:['shapeFrequency','lineStyle']});
  assert.ok(LOCKABLE_SETTINGS.includes('shapeFrequency'));
  assert.ok(LOCKABLE_SETTINGS.includes('shapeDepth'));
  assert.ok(LOCKABLE_SETTINGS.includes('lineStyle'));
  for(let i=0;i<25;i++){
    const value=respectSettingLocks(base,randomizeAllRecipe({primesOnly:true}));
    assert.equal(value.shapeFrequency,67);
    assert.equal(value.lineStyle,'dashed');
    assert.ok(isPrime(value.shapeDepth));
  }
  assert.deepEqual(decodeRecipe(encodeRecipe(base)),base);
  assert.equal(normalizeRecipe({shapeFrequency:900}).shapeFrequency,100);
  assert.equal(normalizeRecipe({shapeDepth:-30}).shapeDepth,0);
});

test('reverse stripe order keeps geometry stable but assigns violet to first and red to last',()=>{
  const base=resolveScene({seed:'reverse-order-seed',orientation:'vertical',geometry:'wave'});
  const flipped=resolveScene({seed:'reverse-order-seed',orientation:'vertical',geometry:'wave',reverseStripes:true});
  assert.deepEqual(flipped.stripes.map(x=>x.name),[...NAMES].reverse());
  assert.deepEqual(flipped.stripes.map(x=>x.center),base.stripes.map(x=>x.center));
  assert.deepEqual(flipped.stripes.map(x=>x.width),base.stripes.map(x=>x.width));
  assert.ok(flipped.stripes.every((x,i)=>x.index===i));
  assert.equal(normalizeRecipe({}).reverseStripes,false);
});
test('diagonal transforms are deterministic, portable and preserve legacy zero-angle scenes',()=>{
  const base={seed:'diagonal-transform',orientation:'diagonal',chaos:0};
  const original=resolveScene(base);
  const rotated=resolveScene({...base,diagonalRotation:60,mirrorHorizontal:true,mirrorVertical:true});
  assert.ok(Math.abs(rotated.angle-original.angle-Math.PI/3)<1e-10);
  assert.equal(rotated.mirrorHorizontal,true);
  assert.equal(rotated.mirrorVertical,true);
  assert.equal(resolveScene({...base,mirrorHorizontal:true,mirrorVertical:true,
    diagonalRotation:0}).angle,original.angle);
  assert.equal(resolveScene({...base,orientation:'horizontal',mirrorHorizontal:true}).mirrorHorizontal,false);
  assert.equal(normalizeRecipe({diagonalRotation:999}).diagonalRotation,180);
  assert.equal(normalizeRecipe({diagonalRotation:-999}).diagonalRotation,-180);
  const normalized=normalizeRecipe({...base,reverseStripes:true,diagonalRotation:-34,
    mirrorHorizontal:true,mirrorVertical:true,lockedSettings:['reverseStripes','diagonalRotation','mirrorHorizontal','mirrorVertical']});
  assert.deepEqual(decodeRecipe(encodeRecipe(normalized)),normalized);
  assert.deepEqual(resolveScene(normalized),resolveScene(decodeRecipe(encodeRecipe(normalized))));
  const locked=respectSettingLocks(normalized,{...normalized,reverseStripes:false,diagonalRotation:0,
    mirrorHorizontal:false,mirrorVertical:false});
  assert.equal(locked.reverseStripes,true);
  assert.equal(locked.diagonalRotation,-34);
  assert.equal(locked.mirrorHorizontal,true);
  assert.equal(locked.mirrorVertical,true);
});

test('larger spacing and stripe width exceed former maximums independently',()=>{
  const base={seed:'expanded-controls',geometry:'straight',orientation:'horizontal',
    family:'studio',individuality:0,chaos:0};
  const thin=resolveScene({...base,stripeWidth:50,spread:50});
  const broad=resolveScene({...base,stripeWidth:100,spread:50});
  const wide=resolveScene({...base,stripeWidth:50,spread:100});
  const spread=scene=>scene.stripes.at(-1).center-scene.stripes[0].center;
  assert.ok(spread(wide)>spread(thin)*2,'maximum spacing should be over double midpoint');
  assert.ok(broad.stripes[3].width>thin.stripes[3].width*2.5,'very thick stripes available');
  assert.equal(spread(broad),spread(thin),'thickness never changes stripe positions');
  assert.equal(wide.stripes[3].width,thin.stripes[3].width,'spacing never changes thickness');
});
test('hairpin turn angle changes tangent-continuous returning leg and survives recipes',()=>{
  const base={seed:'hairpin-angle',geometry:'hairpin',orientation:'vertical',
    individuality:0,turnRadius:50};
  const full=resolveScene({...base,hairpinAngle:180});
  const angled=resolveScene({...base,hairpinAngle:115});
  const fullStripe=full.stripes[3],angledStripe=angled.stripes[3],e=full.extent;
  const bottom=pathPosition(fullStripe,e*.5,e),angledBottom=pathPosition(angledStripe,e*.5,e);
  assert.ok(Math.abs(angledBottom.x-bottom.x)>150,'turn angle must visibly alter exit leg');
  assert.ok(pathPosition(fullStripe,e,e).y<pathPosition(fullStripe,0,e).y);
  assert.equal(normalizeRecipe({hairpinAngle:30}).hairpinAngle,60);
  assert.equal(normalizeRecipe({hairpinAngle:250}).hairpinAngle,180);
  assert.equal(decodeRecipe(encodeRecipe({...base,hairpinAngle:115})).hairpinAngle,115);
  assert.ok(LOCKABLE_SETTINGS.includes('hairpinAngle'));
});
test('chevron frequency and depth reach substantially smaller and larger profiles',()=>{
  const recipe={geometry:'chevron',family:'studio',individuality:0,shapeDepth:50};
  const low=resolveScene({...recipe,shapeFrequency:0});
  const high=resolveScene({...recipe,shapeFrequency:100});
  assert.ok(low.stripes[3].sharedPeriod/high.stripes[3].sharedPeriod>20);
  const small=resolveScene({...recipe,shapeDepth:0});
  const big=resolveScene({...recipe,shapeDepth:100});
  assert.ok(big.stripes[3].sharedDisplacement/small.stripes[3].sharedDisplacement>8);
});

test('random generations use at most the single primary texture layer',()=>{
  for(let i=0;i<120;i++){
    const r=randomizeAllRecipe({primesOnly:i%2===0});
    assert.equal(r.textureLayer2Enabled,false);
    assert.equal(r.textureLayer3Enabled,false);
    assert.ok(resolveScene(r).textureLayers.length<=1);
    // The ordinary editor still supports opt-in second and third layers.
    const optIn=normalizeRecipe({...r,textureLayer2Enabled:true,material2:'linen',textureStrength2:55,
      textureLayer3Enabled:true,material3:'grain',textureStrength3:55});
    assert.equal(optIn.textureLayer2Enabled,true);
    assert.equal(optIn.textureLayer3Enabled,true);
    assert.deepEqual(decodeRecipe(encodeRecipe(optIn)),optIn);
    assert.ok(resolveScene(optIn).textureLayers.length>=2);
  }
});

test('outline thickness and stripe-to-outline buffer are independent recipe controls',()=>{
  const original=normalizeRecipe({seed:'outline-separation',outline:'white'});
  assert.equal(original.outlineBuffer,0,'existing default has no gap');
  assert.equal(original.gap,28,'existing thickness setting remains editable');
  const thick=normalizeRecipe({...original,gap:95,outlineBuffer:0});
  const spaced=normalizeRecipe({...original,gap:28,outlineBuffer:95});
  assert.equal(thick.outlineBuffer,0);
  assert.equal(spaced.gap,28);
  assert.equal(resolveScene(thick).gap,95);
  assert.equal(resolveScene(spaced).outlineBuffer,95);
  assert.deepEqual(decodeRecipe(encodeRecipe(spaced)),spaced);
  assert.equal(normalizeRecipe({outlineBuffer:250}).outlineBuffer,100);
  assert.equal(normalizeRecipe({outlineBuffer:-2}).outlineBuffer,0);
  assert.equal(LOCKABLE_SETTINGS.includes('outlineBuffer'),true);
  for(const n of [0,25,75,100]){
    const r=normalizeRecipe({gap:n,outlineBuffer:100-n});
    assert.equal(r.gap,n);
    assert.equal(r.outlineBuffer,100-n);
  }
});

test('outline buffer moves the edge without changing outline thickness',()=>{
  for(const outline of ['white','hairline','double','broken','one-side','black-one-side']){
    const stripe={width:75};
    const base={outline,gap:45,outlineBuffer:0};
    const first=outlineDimensions(stripe,base);
    const shifted=outlineDimensions(stripe,{...base,outlineBuffer:90});
    const thickened=outlineDimensions(stripe,{...base,gap:95});
    assert.ok(shifted.separation>first.separation,outline);
    assert.equal(shifted.thickness,first.thickness,outline);
    assert.equal(thickened.separation,first.separation,outline);
    assert.ok(thickened.thickness>first.thickness,outline);
  }
});

test('soft-edge linen is an explicit serialized material, not a change to legacy linen',()=>{
  assert.ok(MATERIALS.includes('linen'));
  assert.ok(MATERIALS.includes('linen-soft'));
  const old=normalizeRecipe({seed:'weave-old',material:'linen',textureStrength:72,
    textureDisplacement:68});
  const newer=normalizeRecipe({...old,material:'linen-soft'});
  assert.equal(old.material,'linen');
  assert.equal(newer.material,'linen-soft');
  assert.deepEqual(decodeRecipe(encodeRecipe(old)),old);
  assert.deepEqual(decodeRecipe(encodeRecipe(newer)),newer);
  const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal(source.split('value="linen-soft"').length-1,3,
    'reuse existing Layer 1/2/3 material selectors without extra editor row');
  const seeded={heightSeed:12345,scale:43};
  const legacy={...seeded,material:'linen'};
  const soft={...seeded,material:'linen-soft'};
  const other={...seeded,material:'concrete'};
  let roughBefore=0,roughAfter=0;
  for(let i=0;i<240;i++){
    const x=i*1.38, y=87+i*.31;
    assert.equal(materialContourHeight(legacy,x,y),materialHeight(legacy,x,y),
      'legacy material contour must remain byte-compatible');
    assert.equal(materialContourHeight(other,x,y),materialHeight(other,x,y));
    assert.equal(materialHeight(soft,x,y),materialHeight(legacy,x,y),
      'new material retains the same visibly painted weave height field');
    if(i){
      const px=(i-1)*1.38,py=87+(i-1)*.31;
      roughBefore+=Math.abs(materialContourHeight(legacy,x,y)-
        materialContourHeight(legacy,px,py));
      roughAfter+=Math.abs(materialContourHeight(soft,x,y)-
        materialContourHeight(soft,px,py));
    }
  }
  assert.ok(roughAfter<roughBefore*.85,
    'soft variant should actually suppress periodic edge relief rather than just relabel it');
});
