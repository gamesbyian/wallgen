import test from 'node:test';
import assert from 'node:assert/strict';
import {rainbowTextStops,textGraphemes} from '../src/text-rainbow-shaping.js';

const palette=['R','O','Y','G','B','I','V'];
const width=unit=>Array.from(unit).length*5;
test('segmentation respects composed graphemes, family emoji and combining marks',()=>{
  const samples=textGraphemes('e\u0301🌈👨‍👩‍👧‍👦a');
  if(typeof Intl.Segmenter==='function')
    assert.deepEqual(samples,['e\u0301','🌈','👨‍👩‍👧‍👦','a']);
  const result=rainbowTextStops('e\u0301🌈','rainbow-letter',palette,0,width);
  assert.equal(result.nextIndex,2);
  assert.equal(result.stops[0].colour,'R');
  assert.equal(result.stops.at(-1).colour,'O');
});
test('word rainbow retains one hue per word and ignores whitespace for index',()=>{
  const result=rainbowTextStops('ONE  TWO   THREE','rainbow-word',palette,0,width);
  assert.equal(result.nextIndex,3);
  assert.equal(result.stops[0].colour,'R');
  assert.equal(result.stops.at(-1).colour,'Y');
  assert.ok(result.stops.some(s=>s.colour==='O'));
  assert.ok(result.stops.every(s=>s.offset>=0&&s.offset<=1));
});
test('a long line uses monotonic identical-boundary stops without glyph splitting',()=>{
  const sample=rainbowTextStops('RAINBOW','rainbow-letter',palette,0,width);
  assert.equal(sample.nextIndex,7);
  assert.equal(sample.stops.length,14);
  for(let i=1;i<sample.stops.length;i++)
    assert.ok(sample.stops[i].offset>=sample.stops[i-1].offset);
  assert.equal(sample.stops[1].offset,sample.stops[2].offset);
  assert.equal(sample.stops[0].offset,0);
  assert.equal(sample.stops.at(-1).offset,1);
});
test('continuous new lines keep deterministic rainbow order and do not colour empty',()=>{
 const first=rainbowTextStops('HELLO','rainbow-letter',palette,0,width);
 const empty=rainbowTextStops('','rainbow-letter',palette,first.nextIndex,width);
 const second=rainbowTextStops('WORLD','rainbow-letter',palette,empty.nextIndex,width);
 assert.equal(first.nextIndex,5);
 assert.equal(empty.stops.length,0);
 assert.equal(second.stops[0].colour,palette[5]);
 assert.equal(second.nextIndex,10);
});
test('Arabic/RTL input remains a single canvas paint; stop bounds are finite',()=>{
 const input='السَّلامُ عَلَيْكُمْ';
 const result=rainbowTextStops(input,'rainbow-letter',palette,0,width);
 assert.ok(result.stops.length>4);
 assert.ok(result.stops.every(s=>Number.isFinite(s.offset)));
 for(let i=1;i<result.stops.length;i++)
   assert.ok(result.stops[i].offset>=result.stops[i-1].offset);
});
test('zero-width or malformed advances cannot create invalid Canvas gradient stops',()=>{
 const result=rainbowTextStops('AB','rainbow-letter',palette,0,()=>0);
 assert.deepEqual(result.stops,[]);
 assert.equal(result.nextIndex,2);
 const weird=rainbowTextStops('AB','rainbow-letter',palette,0,
   unit=>unit==='A'?Infinity:2);
 assert.ok(weird.stops.every(s=>Number.isFinite(s.offset)));
});
