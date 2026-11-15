import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNestedShapeContours,nestedContourDistances,
  nestedAnchorIndex,nestedAnchorClearance} from '../src/nested-shape-contours.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const base={enabled:true,objectId:'region-0',count:7,strokeWidth:2,
  gap:5,firstInset:12,colourOrder:'forward'};
const eq=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`expected ${a} == ${b}`);
test('outer, middle and inner offsets retain true Euclidean distances under gap edits',()=>{
  for(const anchor of ['outer','middle','inner']){
    const previous=nestedContourDistances(base);
    const index=nestedAnchorIndex(base,anchor);
    const active=anchor==='outer'?{...base}:{
      ...base,anchor,anchorDistance:previous[index]};
    assert.deepEqual(nestedContourDistances(active),previous);
    const reduced={...active,gap:4};
    eq(nestedContourDistances(reduced)[index],previous[index]);
    assert.ok(nestedContourDistances(reduced).every((v,i,a)=>i===0||v>a[i-1]));
  }
});
test('anchor never moves outer contour beyond source silhouette when gap becomes impossible',()=>{
  const start=nestedContourDistances(base);
  const selected={...base,anchor:'inner',anchorDistance:start[6],gap:20};
  const clearance=nestedAnchorClearance(selected);
  assert.equal(clearance.clamped,true);
  eq(nestedContourDistances(selected)[0],selected.strokeWidth/2);
  assert.ok(nestedContourDistances(selected)[6]>start[6]);
});
test('nested anchors normalize safely and round-trip as recipe-owned geometry',()=>{
  const recipe=normalizeRecipe({nestedShapeContours:{...base,
    anchor:'middle',anchorDistance:34.5}});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.equal(recipe.nestedShapeContours.anchor,'middle');
  assert.equal(normalizeNestedShapeContours({...base,anchor:'invalid'}).anchor,undefined);
  assert.equal(normalizeNestedShapeContours({...base,anchor:'inner',anchorDistance:NaN}).anchorDistance,undefined);
});
