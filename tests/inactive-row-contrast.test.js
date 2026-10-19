import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const rgb=hex=>[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255);
const lum=hex=>rgb(hex).map(value=>
  value<=.04045?value/12.92:((value+.055)/1.055)**2.4)
  .reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};

test('inactive labelled rows are not dimmed wholesale',()=>{
  const css=read('editor-setting-rows.css');
  assert.match(css,/\.editor-tool-card \.editor-setting-row\.setting-inactive\{\s*opacity:1;\s*filter:none;/);
  assert.match(css,/\.editor-setting-row\.setting-inactive \.slider-number:disabled\{\s*opacity:1/);
  assert.match(read('index.html'),/editor-setting-rows\.css\?v=20261019-inactive1/);
});
test('flat cream and dark inactive label and zero text meet AA small-text contrast',()=>{
  for(const [theme,background,label,numberBackground,numberText] of [
    ['cream','#f7f2e9','#595365','#ffffff','#595365'],
    ['dark','#242333','#d2ccde','#242333','#e5e0ec']
  ]){
    assert.ok(contrast(background,label)>=4.5,theme+' label');
    assert.ok(contrast(numberBackground,numberText)>=4.5,theme+' zero readout');
  }
});
test('changing inactive presentation cannot zero out remembered recipe values',()=>{
  const source=read('src/app.js');
  assert.match(source,/field\.value=isInactive\?'0':String\(current\[key\]\)/);
  assert.match(source,/data\[key\]=field\.dataset\.inactive==='true'\?current\[key\]/);
});
