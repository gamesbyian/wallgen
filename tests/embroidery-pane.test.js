import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('embroidery disclosure keeps original Surface destination and native controls',()=>{
  const html=source('index.html'),layout=source('src/editor-layout.js');
  assert.match(html,/<details class="embroidery-controls" aria-label="Surface embroidery">/);
  assert.match(html,/<summary>Thread treatment <span class="thread-treatment-summary"/);
  assert.match(html,/<\/details>/);
  assert.match(layout,/surface:\['embroidery-controls'\]/);
  for(const name of ['embroideryTarget','embroideryPitch','embroideryRelief'])
    assert.equal((html.match(new RegExp('name="'+name+'"','g'))||[]).length,1);
});
test('compact Surface disclosure hides mutually exclusive sets without changing recipe state',()=>{
  const css=source('editor-material-status.css'),app=source('src/app.js');
  assert.match(css,/\.embroidery-controls:not\(\[open\]\)>:not\(summary\)/);
  assert.match(css,/\.editor-tool-card\[data-editor-tool="surface"\]:has\(>\.embroidery-controls\[open\]\)/);
  assert.match(css,/min-height:44px/);
  assert.match(app,/threadSummary\.textContent=selected==='off'/);
  assert.match(app,/NAMES\[Number\(selected\)\]/);
});

test('surface stitch style is one native persisted control, not a separate tab',()=>{
  const html=source('index.html'),app=source('src/app.js');
  assert.equal((html.match(/name="embroideryStyle"/g)||[]).length,1);
  assert.match(html,/<option value="tatami">Tatami fill \(regions\)<\/option>/);
  assert.match(app,/style:form\.elements\.namedItem\('embroideryStyle'\)\.value/);
  assert.match(app,/namedItem\('embroideryStyle'\)\.value=stitch\?\.style\?\?'satin'/);
  assert.match(app,/'embroideryObjectId','embroideryStyle','embroideryDirection'/);
});

test('running style is selectable through the same persisted native Thread field',()=>{
  const html=source('index.html'),app=source('src/app.js'),algorithm=source('src/embroidery.js');
  assert.equal((html.match(/value="running"/g)||[]).length,1);
  assert.match(app,/style:form\.elements\.namedItem\('embroideryStyle'\)\.value/);
  assert.match(algorithm,/const runInterval=Math\.max\(step\*2\.6,2\*extent\/1600\)/);
});

test('Soft satin is a distinct style option with existing recipe-bound style selector',()=>{
  const html=source('index.html'),app=source('src/app.js');
  assert.equal((html.match(/value="satin-soft"/g)||[]).length,1);
  assert.match(html,/Soft satin \(gentle shading\)/);
  assert.match(app,/style:form\.elements\.namedItem\('embroideryStyle'\)\.value/);
});

test('region angle restores authored direction and stays beside Stitch style',()=>{
  const html=source('index.html'),app=source('src/app.js'),css=source('editor-material-status.css');
  assert.equal((html.match(/name="embroideryDirection"/g)||[]).length,1);
  assert.match(html,/step="0\.1" inputmode="decimal" value="38"/);
  assert.match(css,/\.embroidery-style-grid\{display:grid/);
  assert.match(app,/direction:regionAngle/);
  assert.match(app,/regionAngleField\.value\.trim\(\)===''\?/);
  assert.match(app,/regionAngleInput\.value=String\(stitch\?\.direction\?\?38\)/);
  assert.match(app,/regionAngleInput\.disabled=current\.structure==='paths'/);
  assert.doesNotMatch(app,/direction:38,\s*\}\);/);
  assert.match(app,/'embroideryStyle','embroideryDirection'/);
});

test('interlinked chain stitch is opt-in in existing persisted embroidery style picker',()=>{
  const html=source('index.html'),app=source('src/app.js'),code=source('src/embroidery.js');
  assert.equal((html.match(/value="chain"/g)||[]).length,1);
  assert.match(html,/Chain stitch \(linked loops\)/);
  assert.match(app,/namedItem\('embroideryStyle'\)/);
  assert.match(code,/const chainStep=Math\.max/);
  assert.match(code,/chainLink\(ctx/);
});

test('compact Thread keeps native hidden picker and 44px touch targets in portrait',()=>{
  const html=source('index.html'),css=source('editor-material-status.css');
  for(const field of ['embroideryTarget','embroideryStyle','embroideryObjectId',
    'embroideryDirection','embroideryPitch','embroideryRelief'])
    assert.equal((html.match(new RegExp('name="'+field+'"','g'))||[]).length,1);
  assert.match(html,/<div class="embroidery-style-grid">[\s\S]*name="embroideryTarget"[\s\S]*name="embroideryStyle"/);
  assert.match(html,/<div class="embroidery-finish-grid">[\s\S]*name="embroideryDirection"[\s\S]*class="control-grid range-grid"/);
  assert.match(css,/\.embroidery-object-picker\[hidden\]\{\s*display:none!important/);
  assert.match(css,/\.embroidery-controls\[open\] \.range-grid input:not\(\[type="range"\]\)/);
  assert.match(css,/min-height:44px!important/);
  assert.match(css,/--mobile-tray-height:clamp\(390px,46dvh,450px\)/);
});
