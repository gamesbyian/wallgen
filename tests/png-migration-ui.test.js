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
    'migrateRecipeStatus','migrateRecipeDownload','migrateRecipeReport'])
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
