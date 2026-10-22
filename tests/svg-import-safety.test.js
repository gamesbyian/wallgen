import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyLocalSilhouetteSvg,MAX_SAFE_SVG_BYTES} from '../src/svg-import-safety.js';

test('Simple local SVG geometry and transforms are usable as image silhouettes',()=>{
  for(const svg of [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M 0 0 L 24 0 24 24 Z" fill="#fff"/></svg>',
    '<svg viewBox="0 0 100 100"><g transform="rotate(20)"><ellipse cx="50" cy="50" rx="20" ry="30" fill="red"/></g></svg>'
  ])assert.equal(verifyLocalSilhouetteSvg(svg),true);
});

test('SVG image input cannot request scripts, external resources, CSS or XML entities',()=>{
  for(const bad of [
    '<svg><script>alert(1)</script></svg>',
    '<svg onload="alert(1)"><circle r="10"/></svg>',
    '<svg><foreignObject><div onclick="run()"/></foreignObject></svg>',
    '<svg><image href="https://remote.test/p.png"/></svg>',
    '<svg><use xlink:href="#external"/></svg>',
    '<svg><path style="fill:url(https://remote.test/texture.svg)"/></svg>',
    '<svg><style>@import url(https://remote.test/font.css)</style></svg>',
    '<!DOCTYPE svg [<!ENTITY ext SYSTEM "file:///secret">]><svg>&ext;</svg>',
    '<svg><text font-family="Remote">Font</text></svg>',
    '<svg><animate attributeName="href" to="https://remote.test"/></svg>',
    '<svg><path fill="url(#gradient)"/></svg>',
    'not an svg',
    '<svg>'+''.padEnd(MAX_SAFE_SVG_BYTES+1,'x')+'</svg>'
  ])assert.throws(()=>verifyLocalSilhouetteSvg(bad),/SVG|unsupported|large/);
});
