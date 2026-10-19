import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const lum=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
 .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4)
 .reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('source material rotation labels stay readable even when their 0-value control is inactive',()=>{
  const css=read('editor-setting-rows.css');
  for(const [theme,active,inactive,background] of [
    ['cream','#323042','#595365','#f7f2e9'],
    ['dark','#e5e4ee','#d2ccde','#242333']
  ]){
    for(const [state,colour] of [['active',active],['inactive',inactive]]){
      const selector='html[data-theme="'+theme+'"] .editor-tool-card .texture-rotation-field'+
        (state==='inactive'?'.setting-inactive':'')+'>span';
      assert.ok(css.includes(selector+'{\n  color:'+colour+';'),theme+' '+state);
      assert.ok(ratio(colour,background)>=4.5,theme+' '+state);
    }
  }
});
test('material rotation changes are presentation-only and preserve 3 original numeric controls',()=>{
  const html=read('index.html');
  for(const key of ['textureRotation','textureRotation2','textureRotation3'])
    assert.equal([...html.matchAll(new RegExp('name="'+key+'"','g'))].length,1,key);
  assert.match(html,/editor-setting-rows\.css\?v=20261019-rotationlabel1/);
  const base=read('styles.css');
  assert.match(base,/\.texture-rotation-field>span\{font-size:11px;font-weight:650;color:#e5e4ee\}/);
});
