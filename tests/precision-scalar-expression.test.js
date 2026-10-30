import test from 'node:test';
import assert from 'node:assert/strict';
import {parseScalarExpression as parse} from '../src/precision-scalar-expression.js';
import {readFileSync} from 'node:fs';
const percent={min:0,max:100,step:1,unit:'percent'};
const count={min:7,max:70,step:7,unit:'count'};
test('exact percent-position values and explicit relative scalar arithmetic',()=>{
  assert.equal(parse('50%',28,percent),50);
  assert.equal(parse('+=5',28,percent),33);
  assert.equal(parse('-=8',28,percent),20);
  assert.equal(parse('*=2',28,percent),56);
  assert.equal(parse('/=4',28,percent),7);
  assert.equal(parse('45 + 15',28,percent),60);
  assert.equal(parse('-5',28,percent),0);
  assert.equal(parse('−5',28,percent),0);
});
test('count quantization, real dimensions and bounded fine steps',()=>{
  assert.equal(parse('+=7',14,count),21);
  assert.equal(parse('12',14,count),14);
  assert.equal(parse('78',14,count),70);
  assert.equal(parse('4.5',3,{min:2,max:16,step:.5}),4.5);
  assert.equal(parse('+=.5',4,{min:2,max:16,step:.5}),4.5);
  assert.equal(parse('+=15°',350,{min:0,max:360,step:.1,unit:'angle'}),360);
  assert.equal(parse('+=10',-175,{min:-180,max:180,unit:'angle'}),-165);
  assert.equal(parse('−30deg',45,{min:-180,max:180,unit:'angle'}),-30);
});
test('ambiguous relative percentages, pixel units and executable expressions fail closed',()=>{
  for(const raw of ['', '+=10%', '*=1.2%', '50px','12deg','90°',
    'Math.random()','1;alert(1)','1/0','/=0','*=-Infinity','50%%',
    'NaN','1e999','1**2','2+3+4',' (40) '])
    assert.equal(parse(raw,30,percent),null,raw);
  assert.equal(parse('50%',30,count),null);
  assert.equal(parse('50%',30,{min:0,max:100,unit:'unitless'}),null);
  assert.equal(parse('50',NaN,percent),null);
  assert.equal(parse('50',30,{min:30,max:0}),null);
  assert.equal(parse('50',30,{min:0,max:100,step:0}),null);
  assert.equal(parse('1'.repeat(65),30,percent),null);
});
test('the original numeric slider commits through canonical existing form inputs',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/import \{parseScalarExpression\} from '\.\/precision-scalar-expression\.js';/);
  assert.match(app,/const parsed=parseScalarExpression\(numeric\.value,Number\(slider\.value\)/);
  assert.match(app,/if\(parsed===null\)\{/);
  assert.match(app,/updateControlsFromInputs\(\)/);
});
