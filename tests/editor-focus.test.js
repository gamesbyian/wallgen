import test from 'node:test';
import assert from 'node:assert/strict';
import {focusEligible,adjustedValue} from '../src/editor-focus.js';
const field=(value='40',min='0',max='100',step='1')=>({tagName:'INPUT',type:'range',
 name:'stripeWidth',value,min,max,step,disabled:false,closest:()=>null});
test('only actual available named range controls qualify; no proxy recipe keys',()=>{
 assert.equal(focusEligible(field()),true);
 assert.equal(focusEligible({...field(),disabled:true}),false);
 assert.equal(focusEligible({...field(),type:'checkbox'}),false);
 assert.equal(focusEligible({...field(),name:''}),false);
 assert.equal(focusEligible({...field(),closest:()=>({hidden:true})}),false);
});
test('one-step adjustments clamp, support decimals and never modify the source object',()=>{
 const a=field('100');assert.equal(adjustedValue(a,1),'100');assert.equal(a.value,'100');
 assert.equal(adjustedValue(a,-1),'99');
 assert.equal(adjustedValue(field('0'),-1),'0');
 assert.equal(adjustedValue(field('2.4','0','10','.1'),1),'2.5');
 assert.equal(adjustedValue(field('2.4','0','10','.1'),-1),'2.3');
});
