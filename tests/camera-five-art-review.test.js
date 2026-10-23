import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {PHOTO_PRESETS} from '../src/photo-look.js';
const script=readFileSync(new URL('../scripts/review-photo-looks.mjs',import.meta.url),'utf8');
test('existing opt-in photo reviewer selects five exact camera comparisons',()=>{
  assert.match(script,/opts\.focusCamera\?\[cases\[0\],/);
  for(const id of ['camera-natural','camera-hdr','camera-webcam-signal','camera-digicam-signal'])
    assert.ok(Object.hasOwn(PHOTO_PRESETS,id),id);
  assert.match(script,/cases\[5\],cases\[6\]/);
  assert.match(script,/comparison:opts\.focusCamera\?'camera-family-five'/);
  assert.match(script,/if\(opts\.focusDeepBlack&&opts\.focusCamera\)/);
  assert.match(script,/--recipe',source,'--width','600','--height','1300'/);
  assert.match(script,/Review output already exists/);
});
test('focused camera renderer help uses no browser and advertises both independent scopes',()=>{
  const result=spawnSync(process.execPath,[
    new URL('../scripts/review-photo-looks.mjs',import.meta.url).pathname,'--help'
  ],{encoding:'utf8',timeout:10000});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/--focus-deep-black\|--focus-camera/);
});
