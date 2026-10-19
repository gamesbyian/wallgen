import test from 'node:test';
import assert from 'node:assert/strict';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {MOBILE_ATLAS_SMOKE_TOOLS,MOBILE_ATLAS_SMOKE_STATES}
  from '../scripts/ui-atlas-mobile-smoke-plan.mjs';
test('one stable named tool from each source category is in the mobile screenshot smoke',()=>{
 const sourceCategories=EDITOR_CATEGORIES.map(c=>c.id);
 const listed=MOBILE_ATLAS_SMOKE_TOOLS.map(x=>x.category);
 assert.deepEqual(listed,sourceCategories,'Never silently omit an editor category');
 for(const {category,tool} of MOBILE_ATLAS_SMOKE_TOOLS)
   assert.ok(EDITOR_CATEGORIES.find(c=>c.id===category).tools.some(t=>t.id===tool),
     'Mobile smoke tool missing from source: '+category+'/'+tool);
});
test('mobile capture plan retains camera, Focus, complex, cream/dark and navigation journeys',()=>{
 const expected=[
  'studio-default','editor-open','special-mobile-edit-rail',
  'tool-paths-material-finish1','tool-paths-details-interior-targets',
  'special-focus-stripe-width','conditional-diagonal',
  'conditional-material-layers','special-dark-theme',
  'shell-mobile-more','shell-mobile-explore'
 ];
 for(const x of expected)assert.ok(MOBILE_ATLAS_SMOKE_STATES.includes(x),'Lost mobile state '+x);
 assert.equal(new Set(MOBILE_ATLAS_SMOKE_STATES).size,MOBILE_ATLAS_SMOKE_STATES.length);
 assert.equal(MOBILE_ATLAS_SMOKE_STATES.length,17);
});
