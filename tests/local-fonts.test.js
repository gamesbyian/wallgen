import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {inspectLocalFont,hashFontBytes,isLocalFontId,
  fontFamilyForId,recipeLocalFontIds,localFontsReady,
  LOCAL_FONT_LIMIT_BYTES,LOCAL_FONT_ID_PATTERN} from '../src/local-fonts.js';

const fontHeader=(tag='ttf')=>{
  const buffer=new ArrayBuffer(64);
  const view=new DataView(buffer);
  view.setUint32(0,tag==='otf'?0x4f54544f:0x00010000,false);
  return buffer;
};

test('bounded TTF/OTF parsing rejects bad headers, extensions and oversize',()=>{
  assert.deepEqual(inspectLocalFont(fontHeader(),'my.ttf'),{format:'ttf',size:64});
  assert.deepEqual(inspectLocalFont(fontHeader('otf'),'my.otf'),{format:'otf',size:64});
  for(const bad of [new ArrayBuffer(5),new ArrayBuffer(64)]){
    assert.throws(()=>inspectLocalFont(bad,'x.ttf'),/Font must|Only actual/);
  }
  assert.throws(()=>inspectLocalFont(fontHeader(),'attack.woff2'),/ttf or .otf/);
  assert.throws(()=>inspectLocalFont(fontHeader(),'.'.repeat(255)+'.ttf'),/valid filename/);
  assert.throws(()=>inspectLocalFont(new ArrayBuffer(LOCAL_FONT_LIMIT_BYTES+1),'a.ttf'),/5 MB/);
});

test('font SHA-256 is stable and private identifiers carry no binary data',async()=>{
  const a=await hashFontBytes(fontHeader()),b=await hashFontBytes(fontHeader());
  assert.equal(a,b);
  assert.ok(LOCAL_FONT_ID_PATTERN.test(a));
  assert.ok(isLocalFontId(a));
  assert.equal(isLocalFontId('user-'+'0'.repeat(60)),false);
  assert.equal(isLocalFontId('javascript:evil'),false);
  assert.match(fontFamilyForId(a),/^ROYGBIV-Private-/);
  assert.throws(()=>fontFamilyForId('url(https://invalid)'),/Invalid local/);
});

test('real local font IDs survive JSON, URL and scene normalization without embedding bytes',async()=>{
  const id=await hashFontBytes(fontHeader());
  const recipe=normalizeRecipe({textOverlays:[{id:'one',text:'I am a local font',font:id}]});
  assert.equal(recipe.textOverlays[0].font,id);
  assert.equal(localFontsReady(recipe),false);
  assert.deepEqual(recipeLocalFontIds(recipe),[id]);
  const encoded=encodeRecipe(recipe);
  assert.equal(decodeRecipe(encoded).textOverlays[0].font,id);
  assert.ok(!JSON.stringify(recipe).includes('ArrayBuffer'));
  assert.equal(recipeLocalFontIds(normalizeRecipe({textOverlays:[{
    id:'hidden',text:'HIDDEN',font:id,enabled:false
  }]})).length,0);
  assert.deepEqual(recipeLocalFontIds(normalizeRecipe({textOverlays:[{
    id:'one',text:'A',font:id},{id:'two',text:'B',font:id}
  ]})),[id]);
});

test('unknown CSS family identifiers never enter canonical recipe',()=>{
  const input=normalizeRecipe({textOverlays:[{
    id:'bad',text:'Y',font:'url(https://example.com/evil.woff2)'
  }]});
  assert.equal(input.textOverlays[0].font,'bold');
});
