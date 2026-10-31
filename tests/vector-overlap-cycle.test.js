import test from 'node:test';
import assert from 'node:assert/strict';
import {continuesVectorTapCycle,vectorTapCycle} from '../src/vector-overlap-cycle.js';
test('three coincident nodes cycle through all distinct IDs, even if hit distances reorder',()=>{
 const ids=['top','middle','bottom'],p=[100,200];
 const one=vectorTapCycle(null,ids,p,1000);
 assert.equal(one.selectedId,'top');
 const two=vectorTapCycle(one.state,['middle','top','bottom'],[101,200],1100);
 assert.equal(two.selectedId,'middle');
 const three=vectorTapCycle(two.state,['bottom','middle','top'],[102,200],1200);
 assert.equal(three.selectedId,'bottom');
 assert.equal(vectorTapCycle(three.state,ids,p,1300).selectedId,'top');
 assert.equal(continuesVectorTapCycle(two.state,ids,[110,210],1200),true);
});
test('distance, timeout and topology changes restart at the frontmost node',()=>{
 const first=vectorTapCycle(null,['a','b','c'],[100,200],1000);
 assert.equal(vectorTapCycle(first.state,['a','b','c'],[130,200],1100)
   .selectedId,'a');
 assert.equal(vectorTapCycle(first.state,['a','b','c'],[100,200],2301)
   .selectedId,'a');
 assert.equal(vectorTapCycle(first.state,['a','c'],[100,200],1100)
   .selectedId,'a');
 assert.equal(vectorTapCycle(first.state,['c','a','b','d'],[100,200],1100)
   .selectedId,'c');
});
test('invalid gesture state cannot select a spurious node',()=>{
 assert.deepEqual(vectorTapCycle(null,[],[0,0],10),
   {selectedId:null,state:null});
 assert.deepEqual(vectorTapCycle(null,['a'],[NaN,0],10),
   {selectedId:null,state:null});
 assert.equal(continuesVectorTapCycle(null,['a','b'],[1,2],100),false);
 assert.equal(vectorTapCycle(null,['single'],[0,0],10).state,null);
});
test('vector draw cycles only after stationary release and disarms on drag/cancel',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../src/vector-draw-ui.js',import.meta.url),'utf8');
 assert.match(source,/if\(!cancelled&&!current\.moved&&current\.kind==='node'/);
 assert.match(source,/vectorTapCycle\(overlapTap,current\.overlaps,/);
 assert.match(source,/if\(continuesVectorTapCycle\(overlapTap,ids,at,performance\.now\(\)\)\)/);
 assert.match(source,/drag\.moved=true;overlapTap=null;/);
 assert.match(source,/session=cancelVectorEdit\(session\);drag=null;overlapTap=null/);
 assert.doesNotMatch(source,/overlapCycle/);
});
