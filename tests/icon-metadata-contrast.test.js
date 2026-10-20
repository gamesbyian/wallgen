import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {iconMarkup} from '../src/ui-icons.js';

// The metadata candidate is a cream-filled document. A dark-surface button
// inherits a light currentColor stroke, so the paper's inner text would vanish
// unless those lines and the page edge carry their own high-contrast ink.
const glyph=readFileSync('assets/icons/roygbiv/metadata.svg','utf8');
const inline=iconMarkup('metadata');

function rgb(hex){return hex.match(/[0-9a-f]{2}/gi).map(part=>parseInt(part,16)/255);}
function linear(channel){return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;}
function luminance(hex){const [r,g,b]=rgb(hex).map(linear);return .2126*r+.7152*g+.0722*b;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

test('cream metadata page retains readable ink in both source SVG and inline markup',()=>{
  const page='fill="#FFF8EF"',ink='stroke="#18151F"';
  for(const source of [glyph,inline]){
    assert.ok(source.includes(page),'paper colour must be consistent');
    assert.ok(source.includes(ink),'page needs ink independent of theme');
    assert.match(source,/M6 4h16l4 5v19H6z[^>]*fill="#FFF8EF"[^>]*stroke="#18151F"/);
    assert.match(source,/M22 4v6h4M10 14h12M10 19h12M10 24h8" stroke="#18151F"/);
  }
  assert.ok(contrast('#FFF8EF','#18151F')>=12,'paper text/outline must remain readable');
  assert.equal(glyph.includes('role="img"'),true);
});

test('metadata icon has identical source-backed path geometry in both renderers',()=>{
  const sourcePaths=[...glyph.matchAll(/<path[^>]*\/>/g)].map(match=>match[0]);
  assert.ok(sourcePaths.length>=2);
  for(const path of sourcePaths)assert.ok(inline.includes(path),path);
  assert.ok(!inline.includes('data:image/'),'inline glyph should preserve theme inheritance');
});
