import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
const icon=manifest.icons.find(x=>x.purpose.split(/\s+/).includes('maskable'));
const svg=readFileSync(new URL('../assets/roygbiv-logo-maskable.svg',import.meta.url),'utf8');

test('Android installed app has a dedicated full-bleed adaptive icon',()=>{
 assert.ok(icon,'No maskable icon advertised');
 assert.equal(icon.src,'assets/roygbiv-logo-maskable.svg');
 assert.equal(icon.type,'image/svg+xml');
 assert.equal(icon.sizes,'any');
 assert.match(svg,/viewBox="0 0 512 512"/);
 assert.match(svg,/<rect width="512" height="512" fill="#050608"\s*\/>/,
  'Adaptive mask must see dark background at its full rim');
 assert.equal((svg.match(/<path stroke="#/g)||[]).length,7,
  'All seven original branded colour strokes should remain');
 assert.match(svg,/stroke="#fff"/,'White phone contour missing');
 assert.ok(manifest.icons.some(x=>x.purpose==='any'&&x.type==='image/png'),
  'Unmasked raster fallback must remain available');
});

test('actual brand strokes and phone stay within Android 80%-diameter safe circle',()=>{
 // Original drawn logo coordinates are intentionally reused exactly. Check
 // the key extrema in the 512px adaptive asset, not the full-bleed background.
 const samples=[
  [11.4567,40],[96.1433,17.12],[8,52.9109],[67,36.9707],
  [23,60.8353],[97.8,40.6264],[47.25,66.2606],[110,49.3073],
  [23.6,84.6272],[78,69.9298],[17,98.3874],[101.6,75.5308],
  [66.0219,97.12],[99.7781,88],
  [34,13],[87,13],[34,107],[87,107]
 ];
 const strokeRadius=9/2*3.45;
 for(const [x,y] of samples){
  const X=49+3.45*(x+1),Y=49+3.45*(y-2.4);
  assert.ok(Math.hypot(X-256,Y-256)+strokeRadius<=512*.4,
    'Brand point or its stroke would be clipped by a mask: '+JSON.stringify({x,y,X,Y}));
 }
});

test('regular app logo and title remain unchanged',()=>{
 assert.equal(manifest.short_name,'ROYGBIV');
 assert.ok(manifest.icons.some(x=>x.src==='assets/roygbiv-logo.svg'&&x.purpose==='any'));
});
