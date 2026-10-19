import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('More groups preserve original settings and action node identities',()=>{
  const mobile=read('src/mobile-studio.js');
  const html=read('index.html');
  for(const title of ['Create & seed','Import, export & share',
    'Position & design details'])assert.ok(mobile.includes(title),title);
  for(const selector of ['.composition-positioner','.action-tray',
    '.export-metadata','.secondary-actions','.details-bar'])
    assert.ok(mobile.includes(selector),selector);
  assert.match(mobile,/moreGroups\.get\(originalGroups\[i\]\)\.append\(node\)/);
  assert.match(mobile,/placeholders\[i\]\.after\(node\)/);
  assert.match(mobile,/moreGroups\.get\('generate'\)\.append\(document\.getElementById\('mobileShuffle'\)\)/);
  assert.match(mobile,/section\.setAttribute\('aria-labelledby','mobileMoreHeading-'/);
  for(const id of ['seedInput','applySeed','randomize','download','favorite',
    'importRecipePNG','metadataToggle','metadataPanel','copyLink',
    'copyRecipe','downloadRecipe','positionStatus','detailFamily']){
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
  }
});
test('More grouping owns a distinct responsive stylesheet and preserves real inputs',()=>{
  const html=read('index.html');
  const css=read('mobile-more-groups.css');
  assert.match(html,/mobile-more-groups\.css\?v=/);
  assert.match(css,/\.mobile-more-group-body>\.action-tray/);
  assert.match(css,/\.mobile-more-group-body>\.export-metadata/);
  assert.match(css,/\.mobile-more-group-body>\.secondary-actions/);
  assert.match(css,/\.mobile-more-group-body>\.composition-positioner/);
  assert.match(css,/\.mobile-more-group-body>\.details-bar/);
  assert.doesNotMatch(css,/linear-gradient|radial-gradient/i);
});
