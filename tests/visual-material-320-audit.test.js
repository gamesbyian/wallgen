import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const live=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('the real mobile material toolbar reports six source-backed interactive cells',()=>{
  assert.match(live,/editor-tool-card\[data-editor-tool="finish1"\] \.texture-rotation-field \.rotation-controls/);
  assert.match(live,/querySelectorAll\('button,input\[type=number\]'\)/);
  assert.match(live,/document\.elementFromPoint/);
  assert.match(live,/centerTarget:el===probe\|\|el\.contains\(probe\)/);
  assert.match(live,/MATERIAL ROTATION/);
  assert.match(live,/profile\.width<=360&&name==='material'/);
});
test('the minimum-width populated gallery must show a complete card and caption',()=>{
  assert.match(live,/minimum-320x640'.*'explore-populated'/);
  assert.match(live,/profile\.id==='landscape-700x412'\|\|profile\.id==='minimum-320x640'/);
  assert.match(live,/canvas\.bottom>grid\.bottom\+1/);
  assert.match(live,/caption\.bottom>grid\.bottom\+1/);
});
test('320px full rotation row is supported by source-owned, width-gated four columns',()=>{
  const css=readFileSync('editor-redesign.css','utf8');
  const tiny=css.slice(css.lastIndexOf('/* 320px Chromium:'));
  assert.match(tiny,/@media\(max-width:340px\)/);
  assert.match(tiny,/grid-template-columns:50px minmax\(0,1fr\) 24px 24px!important/);
  assert.match(tiny,/\.texture-rotation-field>span/);
  assert.match(live,/cells\.length!==6\|\|cells\.some/);
  assert.match(live,/!cell\.centerTarget\|\|cell\.x<frame\.x-1\|\|cell\.right>frame\.right\+1/);
});
test('320px Explore uses a bounded portrait-only tray increase, keeping complete thumbnails',()=>{
  const css=readFileSync('studio-themes.css','utf8');
  const tiny=css.slice(css.lastIndexOf('/* The real 320×640 populated Explore strip'));
  assert.match(tiny,/@media\(max-width:340px\) and \(min-height:620px\) and \(max-height:670px\)/);
  assert.match(tiny,/body\.mobile-studio\.mobile-gallery-open/);
  assert.match(tiny,/--mobile-tray-height:206px/);
  assert.match(live,/card\.bottom>grid\.bottom\+1\|\|caption\.bottom>grid\.bottom\+1/);
});
