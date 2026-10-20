import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {imagePathActionAvailability} from '../src/image-path-ui.js';
import {normalizeRecipe} from '../src/model.js';

const source=(overrides={})=>normalizeRecipe({
  seed:'live-image-modal-lock-availability',structure:'paths',
  geometry:'wave',viewZoom:.5,viewPanX:17,positionX:11,...overrides});
const line={kind:'line',angle:179,points:[[.1,.1],[.9,.9]]};
const contour={kind:'contour',points:[[.2,.2],[.3,.8],[.8,.8]]};

test('live imported path Apply respects newly locked Geometry/Structure, including analyzing state',()=>{
  const cases=[
    [source(),true,true],
    [source({lockedSettings:['structure']}),true,true],
    [source({lockedSettings:['geometry']}),false,false],
    [source({structure:'radial',lockedSettings:['structure']}),false,false],
    [source({structure:'regions',lockedSettings:['structure']}),false,false],
  ];
  for(const [recipe,canApply,canAnother] of cases){
    const status=imagePathActionAvailability(recipe,line);
    assert.equal(status.canApply,canApply,recipe.structure+' '+recipe.lockedSettings);
    assert.equal(status.canChooseAnother,canAnother);
    assert.equal(!!status.blocked,!canApply);
    const loading=imagePathActionAvailability(recipe,line,true);
    assert.equal(loading.canApply,false);
    assert.equal(loading.canAngle,false);
    assert.equal(loading.canChooseAnother,false);
  }
  assert.equal(imagePathActionAvailability(source(),null).canApply,false);
  assert.equal(imagePathActionAvailability(source(),null).canChooseAnother,true);
});

test('detected line angle is permitted only when the actual onAngle fields can change',()=>{
  const cases=[
    [source(),true],
    [source({lockedSettings:['structure']}),true],
    [source({lockedSettings:['geometry']}),true],
    [source({geometry:'drawn',customPath:[[.1,.2],[.7,.8]],
      lockedSettings:['geometry']}),false],
    [source({lockedSettings:['orientation']}),false],
    [source({lockedSettings:['diagonalRotation']}),false],
    [source({structure:'radial',lockedSettings:['structure']}),false],
    [source({structure:'regions',lockedSettings:['structure']}),false],
  ];
  for(const [recipe,expected] of cases){
    const access=imagePathActionAvailability(recipe,line);
    assert.equal(access.canAngle,expected,
      'geometry='+recipe.geometry+' structure='+recipe.structure+
        ' locks='+recipe.lockedSettings.join(','));
    assert.equal(imagePathActionAvailability(recipe,contour).canAngle,false,
      'contour never offers a fake detected angle');
    assert.equal(imagePathActionAvailability(recipe,line,true).canAngle,false,
      'angle remains unavailable while candidates are still analyzing');
  }
});

test('actual image modal synchronizes Apply, Angle and Choose another after lock transitions',()=>{
  const sourceCode=readFileSync(new URL('../src/image-path-ui.js',import.meta.url),'utf8');
  assert.match(sourceCode,/const access=imagePathActionAvailability\(getRecipe\(\),candidate,working\)/);
  assert.match(sourceCode,/const access=imagePathActionAvailability\(recipe,candidates\[selected\],working\)/);
  assert.match(sourceCode,/apply\.disabled=!access\.canApply/);
  assert.match(sourceCode,/angleButton\.disabled=!access\.canAngle/);
  assert.match(sourceCode,/another\.disabled=!access\.canChooseAnother/);
  assert.match(sourceCode,/selected=0;working=false;choose\(0\)/,
    'finishing decode must compute candidate permissions after leaving analyzing');
  assert.match(sourceCode,/else if\(!working\)choose\(selected\)/,
    'unlock reuses the selected candidate without a second file upload');
  assert.match(sourceCode,/another\.disabled=!imagePathActionAvailability\(\s*getRecipe\(\),candidates\[selected\],false\)\.canChooseAnother/,
    'async completion cannot blindly reenable forbidden file chooser');
  const occurrences=(sourceCode.match(/drawAuthoringLockReason\(getRecipe\(\)\)/g)||[]).length;
  assert.equal(occurrences,4,
    'launch, async file load, Choose another, Apply retain their own lock guards');
});
