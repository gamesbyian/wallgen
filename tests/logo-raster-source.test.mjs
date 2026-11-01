import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { parseLogoSvg, rasterizeLogoSvg } from '../scripts/build-logo-raster.mjs';

const dark = readFileSync(new URL('../assets/roygbiv-logo-dark.svg', import.meta.url), 'utf8');
const cream = readFileSync(new URL('../assets/roygbiv-logo-cream.svg', import.meta.url), 'utf8');

function pixelAt(png, x, y) {
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 512);
  const chunkLength = png.readUInt32BE(33);
  assert.equal(png.subarray(37,41).toString(), 'IDAT');
  const raw = inflateSync(png.subarray(41, 41 + chunkLength));
  const index = y * (1 + 512 * 4) + 1 + x * 4;
  assert.equal(raw[y * (1 + 512 * 4)], 0, 'PNG rows use unfiltered RGBA');
  return [...raw.subarray(index,index+4)];
}

test('dark and cream SVGs are the single geometric authority for the icon', () => {
  const black = parseLogoSvg(dark);
  const light = parseLogoSvg(cream);
  assert.deepEqual(black.bands, light.bands);
  assert.deepEqual(black.details.map(v => v.segment), light.details.map(v => v.segment));
  assert.deepEqual(black.bands[0].segment, [12.4567, 37.6, 97.1433, 14.72]);
  assert.deepEqual(black.bands[6].segment, [67.0219, 94.72, 100.7781, 85.6]);
  assert.equal(black.frame.x, 35);
  assert.equal(black.frame.stroke, 2.5);
  assert.deepEqual(black.background, [5,6,8]);
  assert.deepEqual(light.background, [255,249,238]);
});

test('actual raster output reflects source geometry and source paint edits', () => {
  const original = rasterizeLogoSvg(dark);
  const shortened = rasterizeLogoSvg(dark.replace('L96.1433 17.12', 'L86.1433 17.12'));
  assert.notDeepEqual(original, shortened, 'A changed SVG endpoint must change the PNG');
  const recolored = rasterizeLogoSvg(dark.replace('#ff474e', '#123456'));
  assert.notDeepEqual(original, recolored, 'A changed SVG palette must change the PNG');
  assert.deepEqual(pixelAt(original, 256, 12), [5, 6, 8, 255]);
  assert.deepEqual(pixelAt(rasterizeLogoSvg(cream), 256, 12), [255, 249, 238, 255]);
});

test('unimplemented SVG primitives or path forms fail instead of publishing an invented PNG', () => {
  assert.throws(() => parseLogoSvg(dark.replace('</svg>', '<circle cx="15" cy="15" r="2"/></svg>')), /Unsupported logo SVG/);
  assert.throws(() => parseLogoSvg(dark.replace('M11.4567 40 L96.1433 17.12', 'M11.4567 40 Q20 20 96.1433 17.12')), /Unsupported logo SVG/);
});


test('SVG-only visual effects cannot be silently ignored in generated PNGs', () => {
  for (const [name, mutated] of [
    ['whole-icon opacity', dark.replace('<svg xmlns=', '<svg opacity="0.5" xmlns=')],
    ['stripe opacity', dark.replace('stroke="#ff474e"', 'stroke="#ff474e" opacity="0.25"')],
    ['background filter', dark.replace('rx="15" fill="#050608"', 'rx="15" filter="url(#blur)" fill="#050608"')],
    ['group blend', dark.replace('transform="translate(1 0)"', 'transform="translate(1 0)" style="mix-blend-mode:multiply"')],
    ['clip path', dark.replace('</svg>', '<clipPath id="x"><rect width="10" height="10"/></clipPath></svg>')],
    ['mask', dark.replace('</svg>', '<mask id="m"></mask></svg>')],
    ['nested transform', dark.replace('stroke-width="9"', 'transform="rotate(15)" stroke-width="9"')],
    ['extra path attribute', dark.replace('d="M8 52.9109', 'vector-effect="non-scaling-stroke" d="M8 52.9109')],
    ['background new fill', dark.replace('fill="#050608"', 'fill="url(#gradient)"')],
    ['unexpected text content', dark.replace('</svg>', 'hidden content</svg>')],
    ['unknown SVG drawing order', dark.replace('<g transform="translate(1 0)">', '<g transform="translate(1 0)"><g>')],
  ]) {
    assert.notEqual(mutated, dark, 'mutation fixture must change source: ' + name);
    assert.throws(() => parseLogoSvg(mutated), /Unsupported logo SVG/, name);
  }
});

test('metadata comments and editable vector coordinates remain supported', () => {
  const annotated = dark.replace('<!-- Seven parallel', '<!-- Annotated source -->\n  <!-- Seven parallel');
  assert.deepEqual(parseLogoSvg(annotated), parseLogoSvg(dark));
  const moved = dark.replace('L96.1433 17.12', 'L90.1433 17.12');
  assert.deepEqual(parseLogoSvg(moved).bands[0].segment,
    [12.4567, 37.6, 91.1433, 14.72]);
});
