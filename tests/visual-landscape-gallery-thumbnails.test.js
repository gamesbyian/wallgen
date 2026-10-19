import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const theme=readFileSync('studio-themes.css','utf8');
const atlas=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
const short=theme.slice(theme.lastIndexOf('/* Short landscape has room'));

test('only short-landscape gallery previews get a full-image filmstrip',()=>{
  assert.match(short,/@media\(max-width:790px\) and \(max-height:670px\)/);
  assert.match(short,/body\.mobile-gallery-open \.gallery-grid \.thumb canvas/);
  assert.match(short,/height:46px!important/);
  assert.match(short,/width:auto!important/);
  assert.match(short,/object-fit:contain/);
  assert.match(short,/body\.mobile-gallery-open \.gallery-grid \.thumb-caption/);
});
test('populated landscape screenshots reject clipping of both wallpaper and caption',()=>{
  assert.match(atlas,/firstThumbCaption:rect\('#gallery \.thumb-caption'\)/);
  assert.match(atlas,/profile\.id==='landscape-700x412'/);
  assert.match(atlas,/canvas\.bottom>grid\.bottom\+1/);
  assert.match(atlas,/caption\.bottom>grid\.bottom\+1/);
  assert.match(atlas,/errors\.push\(\{key,error\}\)/);
});
