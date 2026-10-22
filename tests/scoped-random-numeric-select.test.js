import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe} from '../src/model.js';
import {randomizeScope} from '../src/scoped-random.js';

const repeatSelect={
  tagName:'SELECT',dataset:{inactive:'false'},
  options:[2,3,4,5,6].map(value=>({value:String(value),disabled:false}))
};
const control=key=>key==='repeatCount'?repeatSelect:null;

test('repeat-count reroll never confuses numeric recipe values with string options',()=>{
  const current=normalizeRecipe({seed:'repeat-source',composition:'repeat',repeatCount:3});
  for(let n=0;n<100;n++){
    const result=randomizeScope(current,{scope:'setting',name:'repeatCount',
      seed:'repeat-reroll-'+n,mode:'reroll',control});
    assert.notEqual(result.recipe.repeatCount,3,'reroll '+n+' must choose a new count');
    assert.equal(typeof result.recipe.repeatCount,'number');
    assert.deepEqual(result.modified,['repeatCount']);
    assert.equal(result.recipe.seed,current.seed);
    assert.equal(result.recipe.composition,current.composition);
  }
});

test('every scoped randomization result truthfully lists only normalized changes',()=>{
  const current=normalizeRecipe({seed:'repeat-source',composition:'repeat',repeatCount:3});
  for(const mode of ['reroll','vary'])for(const strength of ['gentle','moderate','wild'])
    for(let n=0;n<100;n++){
      const result=randomizeScope(current,{scope:'setting',name:'repeatCount',
        seed:mode+'-'+strength+'-'+n,mode,strength,control});
      const actuallyChanged=result.recipe.repeatCount!==current.repeatCount;
      assert.deepEqual(result.modified,actuallyChanged?['repeatCount']:[],
        mode+' '+strength+' '+n+' must never claim a no-op changed the recipe');
      assert.equal(result.recipe.seed,current.seed);
    }
});
