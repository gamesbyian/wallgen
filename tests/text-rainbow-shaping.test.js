import test from 'node:test';
import assert from 'node:assert/strict';
import {rainbowTextStops,textGraphemes,isSimpleRightToLeft} from '../src/text-rainbow-shaping.js';

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

test('only unambiguous Arabic/Hebrew lines opt in to visual-right first colour',()=>{
  assert.equal(isSimpleRightToLeft('السَّلَامُ عَلَيْكُمْ'),true);
  assert.equal(isSimpleRightToLeft('שָׁלוֹם עולם'),true);
  assert.equal(isSimpleRightToLeft('Hello مرحبا'),false);
  assert.equal(isSimpleRightToLeft('مرحبا 2026'),false);
  assert.equal(isSimpleRightToLeft('नमस्ते مرحبا'),false);
  assert.equal(isSimpleRightToLeft('HELLO'),false);
  assert.equal(isSimpleRightToLeft('🌈'),false);
});
test('RTL lettering reverses only rainbow stops, not logical graphemes or colour sequence',()=>{
  const line='سلام';
  const left=rainbowTextStops(line,'rainbow-letter',palette,0,width);
  const right=rainbowTextStops(line,'rainbow-letter',palette,0,width,{rightToLeft:true});
  assert.equal(right.nextIndex,left.nextIndex);
  assert.equal(right.nextIndex,4);
  assert.equal(right.stops[0].colour,'G','last logical RTL character appears at left');
  assert.equal(right.stops.at(-1).colour,'R','first logical character appears at right');
  assert.deepEqual(right.stops,left.stops.slice().reverse().map(stop=>({
    offset:1-stop.offset,colour:stop.colour
  })));
  assert.ok(right.stops.every((s,i)=>i===0||s.offset>=right.stops[i-1].offset));
});
test('RTL word boundaries preserve each logical word colour on its visual side',()=>{
  const first=rainbowTextStops('سلام  دنیا','rainbow-word',palette,3,width);
  const rtl=rainbowTextStops('سلام  دنیا','rainbow-word',palette,3,width,{rightToLeft:true});
  assert.equal(rtl.nextIndex,first.nextIndex);
  assert.equal(rtl.nextIndex,5);
  assert.equal(rtl.stops.at(-1).colour,'G');
  assert.equal(rtl.stops[0].colour,'B');
  assert.equal(rtl.stops.length,first.stops.length);
});
