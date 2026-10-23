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
  assert.match(app,/'embroideryObjectId','embroideryStyle','embroideryPitch'/);
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
