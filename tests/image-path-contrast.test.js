import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../image-path.css',import.meta.url),'utf8');
const normalize=hex=>{
  const value=hex.slice(1);
  const full=value.length===3?[...value].map(c=>c+c).join(''):value;
  return [0,2,4].map(i=>parseInt(full.slice(i,i+2),16)/255)
    .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
};
const light=hex=>normalize(hex).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=light(a),y=light(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('image path import has WCAG AA small-text Apply contrast in both themes',()=>{
  const dark=css.match(/\.image-path-actions #imagePathApply\{([^}]+)\}/)?.[1];
  const cream=css.match(/html\[data-theme="cream"\] \.image-path-dialog #imagePathApply\{([^}]+)\}/)?.[1];
  const baseButtons=css.match(/\.image-path-top button,\.image-path-actions button\{([^}]+)\}/)?.[1];
  assert.ok(dark&&cream&&baseButtons);
  const paint=body=>body.match(/background:(#[0-9a-f]{3,6})/i)?.[1];
  const ink=body=>body.match(/color:(#[0-9a-f]{3,6})/i)?.[1];
  assert.ok(ratio(paint(dark),ink(baseButtons))>=4.5,'dark importer button');
  assert.ok(ratio(paint(cream),ink(cream))>=4.5,'cream importer button');
});
test('contrast change retains original source import actions',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['imagePathApply','imagePathAngle','imagePathCancel',
    'imagePathCandidate','imagePathAnother'])
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
  assert.match(html,/image-path\.css\?v=20261019-importcontrast1/);
  assert.doesNotMatch(css,/linear-gradient|radial-gradient|conic-gradient/i);
});
