import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../editor-redesign.css',import.meta.url),'utf8');
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const luminosity=hex=>[1,3,5].map(offset=>linear(parseInt(hex.slice(offset,offset+2),16)/255))
  .reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{
  const [lo,hi]=[luminosity(a),luminosity(b)].sort((a,b)=>a-b);
  return (hi+.05)/(lo+.05);
};
test('inapplicable category keeps its label legible in cream and dark',()=>{
  assert.match(css,/\.settings-tabs \.settings-tab:disabled\{[^}]*opacity:1!important;color:#b5adbf!important/);
  assert.match(css,/html\[data-theme="cream"\] body\.mobile-studio \.sidebar \.settings-tabs \.settings-tab:disabled\{[^}]*color:#716879!important/);
  // Contrast against the lightest likely cream and darkest current sidebar
  // surface; this is static colour math, NOT full browser visual approval.
  assert.ok(contrast('#716879','#f8f3e9')>=4.5,'cream label contrast');
  assert.ok(contrast('#b5adbf','#1d1e27')>=4.5,'dark label contrast');
  assert.doesNotMatch(css,/\.settings-tabs \.settings-tab:disabled\{\s*opacity:\.28/);
});
test('inapplicable category remains genuinely disabled in application state',()=>{
  const logic=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  assert.match(logic,/shapesTab\.disabled=structure!=='paths'/);
  assert.match(logic,/shapesTab\.setAttribute\('aria-disabled',String\(structure!=='paths'\)\)/);
});
