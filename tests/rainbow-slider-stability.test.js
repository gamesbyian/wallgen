import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('palette contains the seven named hue families including blue',()=>{
  const js=read('src/rainbow-sliders.js');
  for(const [name,hue] of [
    ['red',2],['orange',27],['yellow',49],['green',141],
    ['blue',217],['indigo',245],['violet',285]
  ])assert.ok(js.includes("{name:'"+name+"',h:"+hue+"}"),name);
  assert.match(js,/const sessionSeed=Math\.floor\(Math\.random\(\)\*0xffffffff\)/);
  assert.match(js,/const assignments=new WeakMap\(\)/);
  assert.match(js,/if\(!state\)\{state=\{palette:permutation/);
  assert.match(js,/if\(!state\.slots\.has\(key\)\)/);
});
test('the palette only updates original source controls, not recipes or renderer',()=>{
  const js=read('src/rainbow-sliders.js');
  assert.match(js,/slider\.style\.setProperty\('--roygbiv-slider-color'/);
  assert.match(js,/slider\.dataset\.rainbowKey\|\|slider\.name\|\|slider\.id/);
  assert.doesNotMatch(js,/changeRecipe\(|normalizeRecipe\(|drawWallpaper\(|render\(/);
  const css=read('ui-audit-fixes.css');
  assert.match(css,/#controls input\[type="range"\]\{accent-color:var\(--roygbiv-slider-color/);
});
