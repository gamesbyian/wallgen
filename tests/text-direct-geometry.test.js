import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe} from '../src/model.js';
import {designPointFromPointer,measuredTextBounds,
  hitTextOverlay,dragTextOverlay} from '../src/text-direct-geometry.js';

const sample=normalizeRecipe({textOverlays:[
 {id:'back',text:'ABCD',x:50,y:50,size:60,rotation:0,outline:'black'},
 {id:'front',text:'XY',x:50,y:50,size:65,rotation:45,outline:'white'},
 {id:'locked',text:'LOCK',x:25,y:30,size:44,locked:true}
]});
const measure=(item,value)=>value.length*item.size*.55;
test('pointer coordinates respect actual CSS-scaled portrait canvas without changing recipe geometry',()=>{
 const canvas={getBoundingClientRect:()=>({left:20,top:30,width:300,height:650})};
 assert.deepEqual(designPointFromPointer({clientX:170,clientY:355},canvas),{x:300,y:650});
 assert.deepEqual(designPointFromPointer({clientX:20,clientY:30},canvas),{x:0,y:0});
});
test('bounds use renderer\'s canonical 94%-width shrink and authored multiline rhythm',()=>{
 const item={text:'X'.repeat(100)+'\nY',size:60};
 const bounds=measuredTextBounds(item,s=>s.length*10);
 assert.equal(bounds.width,564);
 assert.equal(bounds.height,140.4);
});
test('topmost text wins overlap hit-test, rotated bbox and off-glyph misses are honored',()=>{
 const list=sample.textOverlays;
 const picked=hitTextOverlay(list,{x:300,y:650},measure);
 assert.equal(picked.id,'front');
 assert.equal(hitTextOverlay(list,{x:0,y:0},measure),null);
 // A 45° banner extends diagonally farther than an unrotated tight box.
 const sole=[list[1]];
 assert.equal(hitTextOverlay(sole,{x:328,y:682},measure)?.id,'front');
 assert.equal(hitTextOverlay(sole,{x:390,y:650},measure),null);
});
test('release changes only selected X/Y once, maintaining all other text objects',()=>{
 const after=dragTextOverlay(sample,'front',{x:60,y:-130});
 assert.notEqual(after,sample);
 assert.equal(after.textOverlays[1].x,60);
 assert.equal(after.textOverlays[1].y,40);
 assert.deepEqual(after.textOverlays[0],sample.textOverlays[0]);
 assert.deepEqual(after.textOverlays[2],sample.textOverlays[2]);
 assert.equal(after.textOverlays[1].text,sample.textOverlays[1].text);
 assert.equal(after.textOverlays[1].rotation,45);
 assert.equal(after.textOverlays[1].font,sample.textOverlays[1].font);
 assert.equal(dragTextOverlay(sample,'front',{x:0,y:0}),sample);
});
test('locked or invalid gestures do not mutate the canonical recipe',()=>{
 assert.equal(dragTextOverlay(sample,'locked',{x:100,y:100}),sample);
 assert.equal(dragTextOverlay(sample,'missing',{x:100,y:100}),sample);
 assert.equal(dragTextOverlay(sample,'front',{x:NaN,y:100}),sample);
 const clamped=dragTextOverlay(sample,'front',{x:9999,y:-9999});
 assert.equal(clamped.textOverlays[1].x,100);
 assert.equal(clamped.textOverlays[1].y,0);
});
