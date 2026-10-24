import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {BUNDLED_FONTS,isBundledFontId,bundledFontFamily,bundledFontsReady} from '../src/bundled-fonts.js';
import {typefaceCssFamily,typefacesReady,recipeHasCustomTypefaces} from '../src/typography-fonts.js';

test('curated pack declares 27 named, unique, semantically grouped OFL faces',()=>{
  const entries=Object.entries(BUNDLED_FONTS);
  assert.equal(entries.length,27);
  assert.equal(new Set(entries.map(([,v])=>v.slug)).size,27);
  assert.ok(new Set(entries.map(([,v])=>v.group)).size>=8);
  for(const [id,value] of entries){
    assert.equal(id,'pack-'+value.slug);
    assert.match(value.label,/\S/);
    assert.match(value.group,/\S/);
    assert.equal(isBundledFontId(id),true);
    assert.equal(bundledFontFamily(id),'ROYGBIV-Bundle-'+value.slug);
    assert.equal(typefaceCssFamily(id),'"ROYGBIV-Bundle-'+value.slug+'"');
  }
  assert.equal(isBundledFontId('pack-missing'),false);
  assert.throws(()=>bundledFontFamily('user-123'),/Unknown bundled/);
});

test('bundled typefaces are canonical recipe values with strict missing-load policy',()=>{
  const recipe=normalizeRecipe({seed:'curated',textOverlays:[
    {id:'title',text:'HELLO',font:'pack-bangers',colour:'rainbow-word'},
    {id:'footer',text:'WORLD',font:'pack-pacifico'}]});
  assert.deepEqual(resolveScene(recipe).textOverlays,recipe.textOverlays);
  assert.equal(decodeRecipe(encodeRecipe(recipe)).textOverlays[0].font,'pack-bangers');
  assert.equal(bundledFontsReady(recipe),false);
  assert.equal(typefacesReady(recipe),false);
  assert.equal(recipeHasCustomTypefaces(recipe),true);
  assert.equal(normalizeRecipe({textOverlays:[{text:'A',font:'pack-not-listed'}]})
    .textOverlays[0].font,'bold');
});

test('asset manifest contains exact pinned-license source and all referenced binaries',()=>{
  const pathname=new URL('../assets/fonts/manifest.json',import.meta.url);
  assert.ok(existsSync(pathname),'vendored assets must be committed before merging this PR');
  const manifest=JSON.parse(readFileSync(pathname,'utf8'));
  assert.equal(manifest.schema,1);
  assert.equal(manifest.sourceCommit,'e7db6ca603fd4862010383ff17ffd6cc4ffac1c0');
  for(const {slug} of Object.values(BUNDLED_FONTS)){
    const entry=manifest.entries?.[slug];
    assert.ok(entry,'missing bundled font '+slug);
    assert.equal(entry.file,slug+'.ttf');
    assert.match(entry.sha256,/^[0-9a-f]{64}$/);
    assert.ok(entry.bytes>1000&&entry.bytes<2*1024*1024);
    assert.match(entry.license,/OFL\.txt$/);
    assert.ok(existsSync(new URL('../assets/fonts/'+entry.file,import.meta.url)));
    assert.ok(existsSync(new URL('../assets/fonts/'+entry.license,import.meta.url)));
  }
});
