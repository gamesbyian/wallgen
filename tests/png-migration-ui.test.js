import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('PNG metadata updater is in existing Files & sharing group, not the live design form',()=>{
  const html=file('index.html'),app=file('src/app.js');
  const exportStart=html.indexOf('class="export-metadata"'),
    panelAt=html.indexOf('id="migrateRecipePanel"'),
    editAt=html.indexOf('id="metadataToggle"');
  assert.ok(exportStart>=0&&exportStart<panelAt&&panelAt<editAt);
  for(const name of ['migrateRecipeToggle','migrateRecipePanel','migrateRecipeFile',
    'migrateRecipeStatus','migrateRecipeDownload','migrateRecipeReport','migrateRecipeArchive'])
    assert.equal((html.match(new RegExp('id="'+name+'"','g'))||[]).length,1);
  assert.match(html,/<input type="file" id="migrateRecipeFile" accept="image\/png,\.png"/);
  assert.match(html,/id="migrateRecipeStatus" role="status" aria-live="polite"/);
  assert.match(app,/inspectPngMigration\(bytes\)/);
  assert.match(app,/migratePngMetadataOnly\(migrationCandidate\)/);
  assert.match(app,/new Blob\(\[png\],\{type:'image\/png'\}\)/);
  assert.match(app,/safeFilename\(\(migrationFileName/);
});
test('More uses source controls and compact 44px touch targets',()=>{
  const mobile=file('src/mobile-studio.js'),css=file('png-recipe-migration.css');
  assert.match(mobile,/\.export-metadata/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/\.png-migration-panel\[hidden\]/);
  assert.match(css,/focus-visible/);
});

test('raw recipe archive remains available for refused historical PNG migration',()=>{
  const html=file('index.html'),app=file('src/app.js'),
    cli=file('scripts/update-png-recipe.mjs');
  assert.match(html,/id="migrateRecipeArchive" type="button" disabled/);
  assert.match(app,/if\(report\.recordCount>0\)\{migrationArchiveSource=bytes;/);
  assert.match(app,/archivePngRecipeRecords\(migrationArchiveSource\)/);
  assert.match(app,/original-recipe-records\.json/);
  assert.match(app,/migrationCandidate=null;migrationArchiveSource=null/);
  assert.match(cli,/--archive/);
  assert.match(cli,/archivePngRecipeRecords\(bytes\)/);
});

test('More offers exact-byte salvage even when recipe JSON inspection throws',()=>{
  const app=file('src/app.js');
  assert.match(app,/inspectPngRecipeArchive\(bytes\)/);
  assert.match(app,/migrationArchiveSource=bytes;migrationFileName=selected\.name/);
  assert.match(app,/migrationArchiveDownload\.disabled=false/);
  assert.match(app,/migrationInspection=\{\.\.\.archive,safe:false/);
  assert.match(app,/Save original recipe records \(exact bytes\)/);
});
