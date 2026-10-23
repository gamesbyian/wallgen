import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {normalizeRecipe as originalNormalize,resolveScene as originalScene}
  from '../docs/recipe-format-history/source-era/v1-37428b/src/model.js';
import {serializePngRecipe as originalSerialize,embedPngMetadata as originalWriter}
  from '../docs/recipe-format-history/source-era/v1-37428b/src/png-metadata.js';
import {normalizeRecipe as currentNormalize} from '../src/model.js';
import {readRawPngRecipe,scanPngChunks,extractPngRecipeWithProvenance}
  from '../src/png-metadata.js';
import {inspectPngMigration,migratePngMetadataOnly,archivePngRecipeRecords}
  from '../src/png-recipe-migration.js';

const root=new URL('../docs/recipe-format-history/source-era/v1-37428b/',import.meta.url);
const fixture=JSON.parse(readFileSync(new URL('EXPECTED-SEMANTICS.json',root),'utf8'));
const tiny=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/mXPo5QAAAABJRU5ErkJggg==',
  'base64'));
const hashGitBlob=source=>createHash('sha1').update(
  Buffer.concat([Buffer.from('blob '+source.length),Buffer.from([0]),source])).digest('hex');

// These unchanged files are the actual first v1 Git blobs, not retyped shadow
// defaults or guessed copy/paste render logic. CI fails if either is edited.
test('archived initial v1 normalizer and PNG writer are bit-for-bit first-release Git blobs',()=>{
  assert.equal(fixture.originCommit,'37428b624e55a0d4526b992bfe6fdf4a01b5f420');
  for(const [file,sha] of [
    ['src/model.js',fixture.sourceBlobs.model],
    ['src/png-metadata.js',fixture.sourceBlobs['png-metadata']]
  ]){
    const data=readFileSync(new URL(file,root));
    assert.equal(hashGitBlob(data),sha,file);
  }
});
test('four source-era v1 field states reproduce independent pinned semantics',()=>{
  for(const item of fixture.cases){
    const old=originalNormalize(item.input);
    for(const [key,expected] of Object.entries(item.expected))
      assert.deepEqual(old[key],expected,item.id+': '+key);
    assert.equal(old.version,1);
    assert.ok(!Object.hasOwn(old,'structure'),'regions did not exist in the first v1 normalizer');
    assert.equal(originalScene(old).stripes.length,7);
    assert.deepEqual(originalScene(old),originalScene(old),'original deterministic source scene');
    assert.equal(typeof currentNormalize(old).structure,'string',
      'modern model adds a structure field; normalizers are not interchangeable');
  }
});
test('actual original v1 exporter produces readable but never silently migratable PNGs',()=>{
  for(const item of fixture.cases){
    const old=originalNormalize(item.input);
    const string=originalSerialize(item.input);
    const written=originalWriter(tiny,{}, {recipe:item.input});
    const saved=Uint8Array.from(written);
    const envelope=JSON.parse(string);
    assert.deepEqual(envelope.recipe,old);
    assert.equal(envelope.format,'roygbiv-recipe-v1');
    assert.deepEqual(envelope.output,{width:3024,height:6552},
      'original writer reports native export size, not the tiny container used by tests');
    const scanned=scanPngChunks(saved);
    assert.deepEqual([scanned.width,scanned.height],[1,1]);
    assert.equal(scanned.chunks.filter(chunk=>chunk.type==='iTXt').length,1);
    const parsed=readRawPngRecipe(saved);
    assert.equal(parsed.selected.format,'roygbiv-recipe-v1');
    assert.deepEqual(parsed.selected.envelope,envelope);
    assert.deepEqual(parsed.selected.rawRecipe,old);
    const imported=extractPngRecipeWithProvenance(saved);
    assert.equal(imported.format,'roygbiv-recipe-v1');
    assert.equal(imported.normalizedFieldsChanged,true);
    const report=inspectPngMigration(saved);
    assert.equal(report.safe,false);
    assert.match(report.reason,/Historical v1/);
    assert.deepEqual(report.sourceEnvelope,envelope);
    assert.equal(report.historicalShadowEvidence.sourceSignature,
      'v1-with-stripeShadowEnabled');
    const paint=old.stripeShadowEnabled&&old.stripeShadowStrength>0;
    assert.equal(report.historicalShadowEvidence.sourceShadowWouldPaint,paint);
    const before=Buffer.from(saved);
    const backup=archivePngRecipeRecords(saved);
    assert.equal(backup.recordCount,1);
    assert.deepEqual(
      Buffer.from(backup.records[0].originalChunkBase64,'base64'),
      Buffer.from(scanned.chunks.find(chunk=>chunk.type==='iTXt').raw));
    assert.deepEqual(Buffer.from(saved),before);
    assert.throws(()=>migratePngMetadataOnly(saved),/Historical v1/);
  }
});

test('the pinned original v1 renderer is unchanged and the optional optical proof runs on source-era modules',()=>{
  const renderer=readFileSync(new URL('src/renderer.js',root));
  assert.equal(hashGitBlob(renderer),fixture.sourceBlobs.renderer);
  const review=readFileSync(new URL('../scripts/review-historical-v1-render.mjs',import.meta.url),'utf8');
  assert.ok(review.includes("'/docs/recipe-format-history/source-era/v1-37428b/src/renderer.js'"));
  assert.match(review,/v1PngWriter\(png,\{\}, \{recipe:original\}\)/);
  assert.match(review,/inspectPngMigration\(historic\)\.safe/);
  assert.match(review,/idatSha256:createHash\('sha256'\)/);
});
