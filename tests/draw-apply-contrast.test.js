import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../draw-path.css',import.meta.url),'utf8');
const toRGB=hex=>{
  let value=hex.slice(1);
  if(value.length===3)value=[...value].map(d=>d+d).join('');
  return [0,2,4].map(i=>parseInt(value.slice(i,i+2),16)/255)
    .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
};
const luminosity=hex=>toRGB(hex).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{
  const l1=luminosity(a),l2=luminosity(b);
  return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
};

test('both active Use path rules have AA-level small-text contrast',()=>{
  const rules=[...css.matchAll(/(?:\.draw-path-controls|\.draw-finish-group) #drawApply:not\(:disabled\)\{([^}]+)\}/g)]
    .map(match=>match[1]);
  assert.equal(rules.length,2,'desktop and compact Finish button must agree');
  for(const rule of rules){
    const background=rule.match(/background:(#[0-9a-f]{3,6})/i)?.[1];
    const colour=rule.match(/(?:^|;)\s*color:(#[0-9a-f]{3,6})/i)?.[1];
    assert.ok(background&&colour,'explicit flat foreground and background required');
    assert.ok(contrast(background,colour)>=4.5,
      'white Use path text must achieve WCAG AA contrast in every compact layout');
  }
});
test('contrast and touch-size improvements preserve path source actions',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal([...html.matchAll(/id="drawApply"/g)].length,1);
  assert.match(html,/draw-path\.css\?v=20261019-touch1/);
  assert.doesNotMatch(css,/linear-gradient|radial-gradient|conic-gradient/i);
});
