import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/visual-agent1.yml','utf8');
test('the real Chromium atlas triggers for all owned CSS visual components',()=>{
  for(const file of [
    'styles.css','studio-themes.css','mobile-compact.css',
    'mobile-five-nav.css','mobile-more-groups.css','mobile-editor-rail.css',
    'editor-redesign.css','editor-setting-rows.css','editor-material-status.css',
    'detail-controls.css','image-path.css','draw-path.css','ui-audit-fixes.css'
  ])assert.ok(workflow.includes("      - '"+file+"'"),file+' must trigger visual QA');
});
test('reference/icon and first-paint HTML updates also trigger source-backed screenshot review',()=>{
  for(const pattern of [
    'docs/ui-reference/*.svg','assets/icons/roygbiv/*.svg',
    'assets/icons/roygbiv/state-matrix.html',
    'src/ui-icon-drawings-*.js','index.html',
    'scripts/visual-reference-audit-agent1.mjs'
  ])assert.ok(workflow.includes("      - '"+pattern+"'"),pattern+' must trigger visual QA');
  assert.match(workflow,/cancel-in-progress: true/);
  assert.match(workflow,/if: always\(\)/);
});
