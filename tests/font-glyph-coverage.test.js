import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BUNDLED_FONTS} from '../src/bundled-fonts.js';
import {inspectFontCmap,missingFontCodepoints,missingGlyphNotice,
  rememberFontCoverage,cachedFontCoverage,fontCoverageChecked} from '../src/font-glyph-coverage.js';

function fontFixture(format=4){
  const buffer=new ArrayBuffer(160),v=new DataView(buffer);
  const w16=(at,n)=>v.setUint16(at,n,false);
  const w32=(at,n)=>v.setUint32(at,n,false);
  w32(0,0x00010000);w16(4,1);
  w32(12,0x636d6170);w32(20,28);w32(24,format===4?44:52);
  w16(28,0);w16(30,1);w16(32,3);w16(34,format===4?1:10);
  w32(36,12);
  const base=40;
  w16(base,format);
  if(format===4){
    w16(base+2,32);w16(base+6,4);
    w16(base+14,0x5a);w16(base+16,0xffff);
    w16(base+20,0x41);w16(base+22,0xffff);
    w16(base+24,1);w16(base+26,1);
    w16(base+28,0);w16(base+30,0);
  }else{
    w32(base+4,40);w32(base+12,2);
    w32(base+16,0x41);w32(base+20,0x5a);w32(base+24,1);
    w32(base+28,0x1f308);w32(base+32,0x1f308);w32(base+36,90);
  }
  return buffer;
}
test('bounded SFNT cmap format 4 maps BMP glyph IDs, not just ranges',()=>{
  const coverage=inspectFontCmap(fontFixture(4));
  assert.equal(coverage.format,4);
  assert.equal(coverage.has(0x41),true);
  assert.equal(coverage.has(0x5a),true);
  assert.equal(coverage.has(0x40),false);
  assert.equal(coverage.has(0x1f308),false);
  assert.equal(coverage.has(0xffff),false);
  assert.equal(coverage.has(-1),false);
});
test('format 4 indirect glyph array requires actual nonzero glyph IDs',()=>{
  const bytes=fontFixture(4),v=new DataView(bytes),base=40;
  // Extend the original binary to include two glyphIdArray entries after
  // the idRangeOffset words. Only U+0061 maps to glyph 5; U+0062 is .notdef.
  v.setUint32(24,48,false);
  v.setUint16(base+2,36,false);
  v.setUint16(base+14,0x62,false);
  v.setUint16(base+20,0x61,false);
  v.setUint16(base+24,0,false);
  v.setUint16(base+28,4,false);
  v.setUint16(base+32,5,false);
  v.setUint16(base+34,0,false);
  const coverage=inspectFontCmap(bytes);
  assert.ok(coverage);
  assert.equal(coverage.has(0x61),true);
  assert.equal(coverage.has(0x62),false);
  assert.equal(coverage.has(0x41),false);
  // A hostile offset outside the subtable must never read adjacent bytes.
  v.setUint16(base+28,0x7fff,false);
  assert.equal(inspectFontCmap(bytes).has(0x61),false);
});
test('format 12 handles supplementary-plane emoji and distinct warnings',()=>{
  const coverage=inspectFontCmap(fontFixture(12));
  assert.equal(coverage.format,12);
  assert.equal(coverage.has(0x1f308),true);
  assert.equal(coverage.has(0x20000),false);
  assert.deepEqual(missingFontCodepoints(coverage,'AAA🌈💠 e\u0301'),[
    0x20,0x65,0x301,0x1f4a0
  ].filter(cp=>cp!==0x20));
  assert.match(missingGlyphNotice(coverage,'☃ 🌈'),/U\+2603/);
  assert.equal(missingGlyphNotice(coverage,'HELLO 🌈'),'');
  assert.equal(missingGlyphNotice(null,'A'),
    'Exact glyph coverage is unavailable for this font.');
});
test('malformed font, table and cmap boundaries produce unknown, never a guess',()=>{
  for(const bad of [new ArrayBuffer(0),new ArrayBuffer(7),
    new ArrayBuffer(5*1024*1024+1)]){
    assert.equal(inspectFontCmap(bad),null);
  }
  const fixture=fontFixture(4);
  new DataView(fixture).setUint32(20,0xffffffff,false);
  assert.equal(inspectFontCmap(fixture),null);
  const another=fontFixture(12);
  new DataView(another).setUint32(52,0x7fffffff,false);
  assert.equal(inspectFontCmap(another),null);
  assert.equal(missingFontCodepoints(null,'HELLO'),null);
});
test('ephemeral cache uses IDs and does not store font bytes or change recipes',()=>{
  const bytes=fontFixture(12),id='pack-test-coverage';
  const coverage=rememberFontCoverage(id,bytes);
  assert.equal(cachedFontCoverage(id),coverage);
  assert.equal(cachedFontCoverage('pack-not-loaded'),null);
  assert.equal(fontCoverageChecked('pack-not-loaded'),false);
  assert.equal(rememberFontCoverage('pack-unknown',new ArrayBuffer(16)),null);
  assert.equal(fontCoverageChecked('pack-unknown'),true);
  assert.equal(cachedFontCoverage('pack-unknown'),null);
  assert.equal(cachedFontCoverage(id).has('🌈'.codePointAt(0)),true);
});
test('all 27 actual licensed TTFs have parseable Unicode tables',()=>{
  for(const {slug} of Object.values(BUNDLED_FONTS)){
    const file=new URL('../assets/fonts/'+slug+'.ttf',import.meta.url);
    const bytes=readFileSync(file);
    const view=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
    const coverage=inspectFontCmap(view);
    assert.ok(coverage,slug+' must have an inspectable Unicode cmap');
    assert.equal(coverage.has('A'.codePointAt(0)),true,slug+' must cover A');
  }
});
test('UI checks the selected live font rather than exposing private glyph data',()=>{
  const source=readFileSync(new URL('../src/text-overlays-ui.js',import.meta.url),'utf8');
  assert.match(source,/data-text-glyph-status/);
  assert.match(source,/cachedFontCoverage/);
  assert.match(source,/glyphCheckVersion/);
  assert.doesNotMatch(source,/fetch\([^)]*text/);
});
