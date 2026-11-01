// Render the current SVG logo geometry, not a separately hard-coded approximation.
// Unsupported edits fail visibly rather than silently shipping stale PNG images.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SIZE = 512;
const number = '(-?\\d+(?:\\.\\d+)?)';
const hex = '(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)';
const rgb = (color) => {
  const h = color.slice(1);
  const value = h.length === 3 ? [...h].map(c => c + c) : [h.slice(0,2),h.slice(2,4),h.slice(4,6)];
  return value.map(c => parseInt(c, 16));
};
const requireMatch = (source, regex, detail) => {
  const match = source.match(regex);
  if (!match) throw new Error('Unsupported logo SVG: ' + detail);
  return match;
};

// This purpose-built rasterizer intentionally supports the exact simple icon
// grammar, not arbitrary SVG. Reject every unrecognized tag, attribute, paint
// effect or ordering change; silently omitting one would publish wrong artwork.
function verifySupportedLogoSvg(source) {
  if (typeof source !== 'string' ||
      (source.match(/<title\b/g) || []).length !== 1 ||
      !/<title id="title">[^<]*<\/title>/.test(source)) {
    throw new Error('Unsupported logo SVG: expected one plain title');
  }
  const clean = source.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<title id="title">[^<]*<\/title>/, '');
  const tags = clean.match(/<[^>]+>/g) || [];
  const N = '-?\\d+(?:\\.\\d+)?';
  const HEX = '#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?';
  const stroke = new RegExp('^<path stroke="' + HEX +
    '" d="M' + N + ' ' + N + ' L' + N + ' ' + N + '"\\s*/>
  if (!/<svg\s[^>]*viewBox="0 0 120 120"[^>]*>/.test(source) ||
      (source.match(/<rect\b/g) || []).length !== 2 ||
      (source.match(/<path\b/g) || []).length !== 8 ||
      (source.match(/<g\b/g) || []).length !== 2 ||
      /<(?:circle|ellipse|polygon|polyline|line|image|text|use|foreignObject)\b/i.test(source)) {
    throw new Error('Unsupported logo SVG: unexpected drawing elements or dimensions');
  }
  const outer = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)"\\s*>'), 'outer translation');
  const inner = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)" fill="none" stroke-width="' + number + '" stroke-linecap="round"\\s*>'), 'band transform or round stroke');
  const background = requireMatch(source, new RegExp('<rect width="120" height="120" rx="' + number + '" fill="' + hex + '"\\s*/>'), 'rounded background');
  const frame = requireMatch(source, new RegExp('<rect x="' + number + '" y="' + number + '" width="' + number + '" height="' + number + '" rx="' + number + '" fill="none"\\s+stroke="' + hex + '" stroke-width="' + number + '"\\s*/>'), 'phone frame');
  const detail = requireMatch(source, new RegExp('<path d="([^"]+)" fill="none" stroke="' + hex + '"\\s+stroke-width="' + number + '" stroke-linecap="round"\\s*/>'), 'phone detail');
  const strokes = [...source.matchAll(new RegExp('<path stroke="' + hex + '" d="M' + number + ' ' + number + ' L' + number + ' ' + number + '"\\s*/>', 'g'))];
  if (strokes.length !== 7) throw new Error('Unsupported logo SVG: expected exactly seven simple rainbow paths');
  const detailSegments = [...detail[1].matchAll(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'))];
  if (detailSegments.length !== 2 || detail[1].replace(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'), '').trim() !== '') {
    throw new Error('Unsupported logo SVG: expected two horizontal phone details');
  }
  const [ox, oy] = [Number(outer[1]), Number(outer[2])];
  const [ix, iy, width] = [Number(inner[1]), Number(inner[2]), Number(inner[3])];
  const [fx, fy, fw, fh, fr, fc, fs] = frame.slice(1);
  const [bgRadius, bg] = background.slice(1);
  const [, detailPath, detailColor, detailWidth] = detail;
  const model = {
    background: rgb(bg), bgRadius: Number(bgRadius),
    bands: strokes.map(m => ({ color: rgb(m[1]), segment: [Number(m[2]) + ox + ix, Number(m[3]) + oy + iy, Number(m[4]) + ox + ix, Number(m[5]) + oy + iy], width })),
    frame: { x: Number(fx) + ox, y: Number(fy) + oy, width: Number(fw), height: Number(fh), radius: Number(fr), color: rgb(fc), stroke: Number(fs) },
    details: detailSegments.map(m => ({ segment: [Number(m[1]) + ox, Number(m[2]) + oy, Number(m[3]) + ox, Number(m[2]) + oy], width: Number(detailWidth), color: rgb(detailColor) })),
  };
  if (![bgRadius, ox, oy, ix, iy, width, fx, fy, fw, fh, fr, fs, detailWidth].every(v => Number.isFinite(Number(v))) ||
      [width, fw, fh, fr, fs, detailWidth, bgRadius].some(v => Number(v) <= 0)) throw new Error('Unsupported logo SVG: invalid geometry');
  return model;
}

const distance = (x,y,ax,ay,bx,by) => {
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den>0 ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)) : 0;
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r) {
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,icon) {
  if (roundedDistance(x,y,60,60,60,60,icon.bgRadius)>0) return [0,0,0,0];
  let result=icon.background;
  for (const band of icon.bands) {
    if (distance(x,y,...band.segment) <= band.width / 2) result=band.color;
  }
  const f=icon.frame;
  if (Math.abs(roundedDistance(x,y,f.x+f.width/2,f.y+f.height/2,f.width/2,f.height/2,f.radius)) <= f.stroke/2) result=f.color;
  for (const detail of icon.details) {
    if (distance(x,y,...detail.segment) <= detail.width/2) result=detail.color;
  }
  return [...result,255];
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const b of bytes) {
    crc^=b;
    for (let i=0;i<8;i++) crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function rasterizeLogoSvg(source) {
  const icon = parseLogoSvg(source);
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for (let y=0;y<SIZE;y++) {
    const row=y*(1+SIZE*4);
    for (let x=0;x<SIZE;x++) {
      const rgba=[0,0,0,0];
      for (let sy=0;sy<steps;sy++) for (let sx=0;sx<steps;sx++) {
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,icon);
        for (let c=0;c<4;c++) rgba[c]+=pixel[c];
      }
      for (let c=0;c<4;c++) raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const theme of ['dark','cream']) {
    const source = readFileSync(resolve(root,'assets','roygbiv-logo-'+theme+'.svg'),'utf8');
    const file = resolve(root,'assets','roygbiv-logo-'+theme+'.png');
    writeFileSync(file,rasterizeLogoSvg(source));
    console.log(file + ': 512×512 RGBA raster from SVG geometry');
  }
}
);
  const supported = [
    /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 120 120" role="img" aria-labelledby="title"\s*>$/,
    new RegExp('^<rect width="120" height="120" rx="' + N + '" fill="' + HEX + '"\\s*/>
  if (!/<svg\s[^>]*viewBox="0 0 120 120"[^>]*>/.test(source) ||
      (source.match(/<rect\b/g) || []).length !== 2 ||
      (source.match(/<path\b/g) || []).length !== 8 ||
      (source.match(/<g\b/g) || []).length !== 2 ||
      /<(?:circle|ellipse|polygon|polyline|line|image|text|use|foreignObject)\b/i.test(source)) {
    throw new Error('Unsupported logo SVG: unexpected drawing elements or dimensions');
  }
  const outer = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)"\\s*>'), 'outer translation');
  const inner = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)" fill="none" stroke-width="' + number + '" stroke-linecap="round"\\s*>'), 'band transform or round stroke');
  const background = requireMatch(source, new RegExp('<rect width="120" height="120" rx="' + number + '" fill="' + hex + '"\\s*/>'), 'rounded background');
  const frame = requireMatch(source, new RegExp('<rect x="' + number + '" y="' + number + '" width="' + number + '" height="' + number + '" rx="' + number + '" fill="none"\\s+stroke="' + hex + '" stroke-width="' + number + '"\\s*/>'), 'phone frame');
  const detail = requireMatch(source, new RegExp('<path d="([^"]+)" fill="none" stroke="' + hex + '"\\s+stroke-width="' + number + '" stroke-linecap="round"\\s*/>'), 'phone detail');
  const strokes = [...source.matchAll(new RegExp('<path stroke="' + hex + '" d="M' + number + ' ' + number + ' L' + number + ' ' + number + '"\\s*/>', 'g'))];
  if (strokes.length !== 7) throw new Error('Unsupported logo SVG: expected exactly seven simple rainbow paths');
  const detailSegments = [...detail[1].matchAll(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'))];
  if (detailSegments.length !== 2 || detail[1].replace(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'), '').trim() !== '') {
    throw new Error('Unsupported logo SVG: expected two horizontal phone details');
  }
  const [ox, oy] = [Number(outer[1]), Number(outer[2])];
  const [ix, iy, width] = [Number(inner[1]), Number(inner[2]), Number(inner[3])];
  const [fx, fy, fw, fh, fr, fc, fs] = frame.slice(1);
  const [bgRadius, bg] = background.slice(1);
  const [, detailPath, detailColor, detailWidth] = detail;
  const model = {
    background: rgb(bg), bgRadius: Number(bgRadius),
    bands: strokes.map(m => ({ color: rgb(m[1]), segment: [Number(m[2]) + ox + ix, Number(m[3]) + oy + iy, Number(m[4]) + ox + ix, Number(m[5]) + oy + iy], width })),
    frame: { x: Number(fx) + ox, y: Number(fy) + oy, width: Number(fw), height: Number(fh), radius: Number(fr), color: rgb(fc), stroke: Number(fs) },
    details: detailSegments.map(m => ({ segment: [Number(m[1]) + ox, Number(m[2]) + oy, Number(m[3]) + ox, Number(m[2]) + oy], width: Number(detailWidth), color: rgb(detailColor) })),
  };
  if (![bgRadius, ox, oy, ix, iy, width, fx, fy, fw, fh, fr, fs, detailWidth].every(v => Number.isFinite(Number(v))) ||
      [width, fw, fh, fr, fs, detailWidth, bgRadius].some(v => Number(v) <= 0)) throw new Error('Unsupported logo SVG: invalid geometry');
  return model;
}

const distance = (x,y,ax,ay,bx,by) => {
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den>0 ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)) : 0;
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r) {
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,icon) {
  if (roundedDistance(x,y,60,60,60,60,icon.bgRadius)>0) return [0,0,0,0];
  let result=icon.background;
  for (const band of icon.bands) {
    if (distance(x,y,...band.segment) <= band.width / 2) result=band.color;
  }
  const f=icon.frame;
  if (Math.abs(roundedDistance(x,y,f.x+f.width/2,f.y+f.height/2,f.width/2,f.height/2,f.radius)) <= f.stroke/2) result=f.color;
  for (const detail of icon.details) {
    if (distance(x,y,...detail.segment) <= detail.width/2) result=detail.color;
  }
  return [...result,255];
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const b of bytes) {
    crc^=b;
    for (let i=0;i<8;i++) crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function rasterizeLogoSvg(source) {
  const icon = parseLogoSvg(source);
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for (let y=0;y<SIZE;y++) {
    const row=y*(1+SIZE*4);
    for (let x=0;x<SIZE;x++) {
      const rgba=[0,0,0,0];
      for (let sy=0;sy<steps;sy++) for (let sx=0;sx<steps;sx++) {
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,icon);
        for (let c=0;c<4;c++) rgba[c]+=pixel[c];
      }
      for (let c=0;c<4;c++) raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const theme of ['dark','cream']) {
    const source = readFileSync(resolve(root,'assets','roygbiv-logo-'+theme+'.svg'),'utf8');
    const file = resolve(root,'assets','roygbiv-logo-'+theme+'.png');
    writeFileSync(file,rasterizeLogoSvg(source));
    console.log(file + ': 512×512 RGBA raster from SVG geometry');
  }
}
),
    new RegExp('^<g transform="translate\\(' + N + ' ' + N + '\\)"\\s*>
  if (!/<svg\s[^>]*viewBox="0 0 120 120"[^>]*>/.test(source) ||
      (source.match(/<rect\b/g) || []).length !== 2 ||
      (source.match(/<path\b/g) || []).length !== 8 ||
      (source.match(/<g\b/g) || []).length !== 2 ||
      /<(?:circle|ellipse|polygon|polyline|line|image|text|use|foreignObject)\b/i.test(source)) {
    throw new Error('Unsupported logo SVG: unexpected drawing elements or dimensions');
  }
  const outer = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)"\\s*>'), 'outer translation');
  const inner = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)" fill="none" stroke-width="' + number + '" stroke-linecap="round"\\s*>'), 'band transform or round stroke');
  const background = requireMatch(source, new RegExp('<rect width="120" height="120" rx="' + number + '" fill="' + hex + '"\\s*/>'), 'rounded background');
  const frame = requireMatch(source, new RegExp('<rect x="' + number + '" y="' + number + '" width="' + number + '" height="' + number + '" rx="' + number + '" fill="none"\\s+stroke="' + hex + '" stroke-width="' + number + '"\\s*/>'), 'phone frame');
  const detail = requireMatch(source, new RegExp('<path d="([^"]+)" fill="none" stroke="' + hex + '"\\s+stroke-width="' + number + '" stroke-linecap="round"\\s*/>'), 'phone detail');
  const strokes = [...source.matchAll(new RegExp('<path stroke="' + hex + '" d="M' + number + ' ' + number + ' L' + number + ' ' + number + '"\\s*/>', 'g'))];
  if (strokes.length !== 7) throw new Error('Unsupported logo SVG: expected exactly seven simple rainbow paths');
  const detailSegments = [...detail[1].matchAll(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'))];
  if (detailSegments.length !== 2 || detail[1].replace(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'), '').trim() !== '') {
    throw new Error('Unsupported logo SVG: expected two horizontal phone details');
  }
  const [ox, oy] = [Number(outer[1]), Number(outer[2])];
  const [ix, iy, width] = [Number(inner[1]), Number(inner[2]), Number(inner[3])];
  const [fx, fy, fw, fh, fr, fc, fs] = frame.slice(1);
  const [bgRadius, bg] = background.slice(1);
  const [, detailPath, detailColor, detailWidth] = detail;
  const model = {
    background: rgb(bg), bgRadius: Number(bgRadius),
    bands: strokes.map(m => ({ color: rgb(m[1]), segment: [Number(m[2]) + ox + ix, Number(m[3]) + oy + iy, Number(m[4]) + ox + ix, Number(m[5]) + oy + iy], width })),
    frame: { x: Number(fx) + ox, y: Number(fy) + oy, width: Number(fw), height: Number(fh), radius: Number(fr), color: rgb(fc), stroke: Number(fs) },
    details: detailSegments.map(m => ({ segment: [Number(m[1]) + ox, Number(m[2]) + oy, Number(m[3]) + ox, Number(m[2]) + oy], width: Number(detailWidth), color: rgb(detailColor) })),
  };
  if (![bgRadius, ox, oy, ix, iy, width, fx, fy, fw, fh, fr, fs, detailWidth].every(v => Number.isFinite(Number(v))) ||
      [width, fw, fh, fr, fs, detailWidth, bgRadius].some(v => Number(v) <= 0)) throw new Error('Unsupported logo SVG: invalid geometry');
  return model;
}

const distance = (x,y,ax,ay,bx,by) => {
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den>0 ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)) : 0;
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r) {
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,icon) {
  if (roundedDistance(x,y,60,60,60,60,icon.bgRadius)>0) return [0,0,0,0];
  let result=icon.background;
  for (const band of icon.bands) {
    if (distance(x,y,...band.segment) <= band.width / 2) result=band.color;
  }
  const f=icon.frame;
  if (Math.abs(roundedDistance(x,y,f.x+f.width/2,f.y+f.height/2,f.width/2,f.height/2,f.radius)) <= f.stroke/2) result=f.color;
  for (const detail of icon.details) {
    if (distance(x,y,...detail.segment) <= detail.width/2) result=detail.color;
  }
  return [...result,255];
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const b of bytes) {
    crc^=b;
    for (let i=0;i<8;i++) crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function rasterizeLogoSvg(source) {
  const icon = parseLogoSvg(source);
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for (let y=0;y<SIZE;y++) {
    const row=y*(1+SIZE*4);
    for (let x=0;x<SIZE;x++) {
      const rgba=[0,0,0,0];
      for (let sy=0;sy<steps;sy++) for (let sx=0;sx<steps;sx++) {
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,icon);
        for (let c=0;c<4;c++) rgba[c]+=pixel[c];
      }
      for (let c=0;c<4;c++) raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const theme of ['dark','cream']) {
    const source = readFileSync(resolve(root,'assets','roygbiv-logo-'+theme+'.svg'),'utf8');
    const file = resolve(root,'assets','roygbiv-logo-'+theme+'.png');
    writeFileSync(file,rasterizeLogoSvg(source));
    console.log(file + ': 512×512 RGBA raster from SVG geometry');
  }
}
),
    new RegExp('^<g transform="translate\\(' + N + ' ' + N +
      '\\)" fill="none" stroke-width="' + N + '" stroke-linecap="round"\\s*>
  if (!/<svg\s[^>]*viewBox="0 0 120 120"[^>]*>/.test(source) ||
      (source.match(/<rect\b/g) || []).length !== 2 ||
      (source.match(/<path\b/g) || []).length !== 8 ||
      (source.match(/<g\b/g) || []).length !== 2 ||
      /<(?:circle|ellipse|polygon|polyline|line|image|text|use|foreignObject)\b/i.test(source)) {
    throw new Error('Unsupported logo SVG: unexpected drawing elements or dimensions');
  }
  const outer = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)"\\s*>'), 'outer translation');
  const inner = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)" fill="none" stroke-width="' + number + '" stroke-linecap="round"\\s*>'), 'band transform or round stroke');
  const background = requireMatch(source, new RegExp('<rect width="120" height="120" rx="' + number + '" fill="' + hex + '"\\s*/>'), 'rounded background');
  const frame = requireMatch(source, new RegExp('<rect x="' + number + '" y="' + number + '" width="' + number + '" height="' + number + '" rx="' + number + '" fill="none"\\s+stroke="' + hex + '" stroke-width="' + number + '"\\s*/>'), 'phone frame');
  const detail = requireMatch(source, new RegExp('<path d="([^"]+)" fill="none" stroke="' + hex + '"\\s+stroke-width="' + number + '" stroke-linecap="round"\\s*/>'), 'phone detail');
  const strokes = [...source.matchAll(new RegExp('<path stroke="' + hex + '" d="M' + number + ' ' + number + ' L' + number + ' ' + number + '"\\s*/>', 'g'))];
  if (strokes.length !== 7) throw new Error('Unsupported logo SVG: expected exactly seven simple rainbow paths');
  const detailSegments = [...detail[1].matchAll(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'))];
  if (detailSegments.length !== 2 || detail[1].replace(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'), '').trim() !== '') {
    throw new Error('Unsupported logo SVG: expected two horizontal phone details');
  }
  const [ox, oy] = [Number(outer[1]), Number(outer[2])];
  const [ix, iy, width] = [Number(inner[1]), Number(inner[2]), Number(inner[3])];
  const [fx, fy, fw, fh, fr, fc, fs] = frame.slice(1);
  const [bgRadius, bg] = background.slice(1);
  const [, detailPath, detailColor, detailWidth] = detail;
  const model = {
    background: rgb(bg), bgRadius: Number(bgRadius),
    bands: strokes.map(m => ({ color: rgb(m[1]), segment: [Number(m[2]) + ox + ix, Number(m[3]) + oy + iy, Number(m[4]) + ox + ix, Number(m[5]) + oy + iy], width })),
    frame: { x: Number(fx) + ox, y: Number(fy) + oy, width: Number(fw), height: Number(fh), radius: Number(fr), color: rgb(fc), stroke: Number(fs) },
    details: detailSegments.map(m => ({ segment: [Number(m[1]) + ox, Number(m[2]) + oy, Number(m[3]) + ox, Number(m[2]) + oy], width: Number(detailWidth), color: rgb(detailColor) })),
  };
  if (![bgRadius, ox, oy, ix, iy, width, fx, fy, fw, fh, fr, fs, detailWidth].every(v => Number.isFinite(Number(v))) ||
      [width, fw, fh, fr, fs, detailWidth, bgRadius].some(v => Number(v) <= 0)) throw new Error('Unsupported logo SVG: invalid geometry');
  return model;
}

const distance = (x,y,ax,ay,bx,by) => {
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den>0 ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)) : 0;
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r) {
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,icon) {
  if (roundedDistance(x,y,60,60,60,60,icon.bgRadius)>0) return [0,0,0,0];
  let result=icon.background;
  for (const band of icon.bands) {
    if (distance(x,y,...band.segment) <= band.width / 2) result=band.color;
  }
  const f=icon.frame;
  if (Math.abs(roundedDistance(x,y,f.x+f.width/2,f.y+f.height/2,f.width/2,f.height/2,f.radius)) <= f.stroke/2) result=f.color;
  for (const detail of icon.details) {
    if (distance(x,y,...detail.segment) <= detail.width/2) result=detail.color;
  }
  return [...result,255];
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const b of bytes) {
    crc^=b;
    for (let i=0;i<8;i++) crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function rasterizeLogoSvg(source) {
  const icon = parseLogoSvg(source);
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for (let y=0;y<SIZE;y++) {
    const row=y*(1+SIZE*4);
    for (let x=0;x<SIZE;x++) {
      const rgba=[0,0,0,0];
      for (let sy=0;sy<steps;sy++) for (let sx=0;sx<steps;sx++) {
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,icon);
        for (let c=0;c<4;c++) rgba[c]+=pixel[c];
      }
      for (let c=0;c<4;c++) raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const theme of ['dark','cream']) {
    const source = readFileSync(resolve(root,'assets','roygbiv-logo-'+theme+'.svg'),'utf8');
    const file = resolve(root,'assets','roygbiv-logo-'+theme+'.png');
    writeFileSync(file,rasterizeLogoSvg(source));
    console.log(file + ': 512×512 RGBA raster from SVG geometry');
  }
}
),
    ...Array(7).fill(stroke),
    /^<\/g>$/,
    new RegExp('^<rect x="' + N + '" y="' + N + '" width="' + N +
      '" height="' + N + '" rx="' + N +
      '" fill="none"\\s+stroke="' + HEX + '" stroke-width="' + N + '"\\s*/>
  if (!/<svg\s[^>]*viewBox="0 0 120 120"[^>]*>/.test(source) ||
      (source.match(/<rect\b/g) || []).length !== 2 ||
      (source.match(/<path\b/g) || []).length !== 8 ||
      (source.match(/<g\b/g) || []).length !== 2 ||
      /<(?:circle|ellipse|polygon|polyline|line|image|text|use|foreignObject)\b/i.test(source)) {
    throw new Error('Unsupported logo SVG: unexpected drawing elements or dimensions');
  }
  const outer = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)"\\s*>'), 'outer translation');
  const inner = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)" fill="none" stroke-width="' + number + '" stroke-linecap="round"\\s*>'), 'band transform or round stroke');
  const background = requireMatch(source, new RegExp('<rect width="120" height="120" rx="' + number + '" fill="' + hex + '"\\s*/>'), 'rounded background');
  const frame = requireMatch(source, new RegExp('<rect x="' + number + '" y="' + number + '" width="' + number + '" height="' + number + '" rx="' + number + '" fill="none"\\s+stroke="' + hex + '" stroke-width="' + number + '"\\s*/>'), 'phone frame');
  const detail = requireMatch(source, new RegExp('<path d="([^"]+)" fill="none" stroke="' + hex + '"\\s+stroke-width="' + number + '" stroke-linecap="round"\\s*/>'), 'phone detail');
  const strokes = [...source.matchAll(new RegExp('<path stroke="' + hex + '" d="M' + number + ' ' + number + ' L' + number + ' ' + number + '"\\s*/>', 'g'))];
  if (strokes.length !== 7) throw new Error('Unsupported logo SVG: expected exactly seven simple rainbow paths');
  const detailSegments = [...detail[1].matchAll(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'))];
  if (detailSegments.length !== 2 || detail[1].replace(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'), '').trim() !== '') {
    throw new Error('Unsupported logo SVG: expected two horizontal phone details');
  }
  const [ox, oy] = [Number(outer[1]), Number(outer[2])];
  const [ix, iy, width] = [Number(inner[1]), Number(inner[2]), Number(inner[3])];
  const [fx, fy, fw, fh, fr, fc, fs] = frame.slice(1);
  const [bgRadius, bg] = background.slice(1);
  const [, detailPath, detailColor, detailWidth] = detail;
  const model = {
    background: rgb(bg), bgRadius: Number(bgRadius),
    bands: strokes.map(m => ({ color: rgb(m[1]), segment: [Number(m[2]) + ox + ix, Number(m[3]) + oy + iy, Number(m[4]) + ox + ix, Number(m[5]) + oy + iy], width })),
    frame: { x: Number(fx) + ox, y: Number(fy) + oy, width: Number(fw), height: Number(fh), radius: Number(fr), color: rgb(fc), stroke: Number(fs) },
    details: detailSegments.map(m => ({ segment: [Number(m[1]) + ox, Number(m[2]) + oy, Number(m[3]) + ox, Number(m[2]) + oy], width: Number(detailWidth), color: rgb(detailColor) })),
  };
  if (![bgRadius, ox, oy, ix, iy, width, fx, fy, fw, fh, fr, fs, detailWidth].every(v => Number.isFinite(Number(v))) ||
      [width, fw, fh, fr, fs, detailWidth, bgRadius].some(v => Number(v) <= 0)) throw new Error('Unsupported logo SVG: invalid geometry');
  return model;
}

const distance = (x,y,ax,ay,bx,by) => {
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den>0 ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)) : 0;
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r) {
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,icon) {
  if (roundedDistance(x,y,60,60,60,60,icon.bgRadius)>0) return [0,0,0,0];
  let result=icon.background;
  for (const band of icon.bands) {
    if (distance(x,y,...band.segment) <= band.width / 2) result=band.color;
  }
  const f=icon.frame;
  if (Math.abs(roundedDistance(x,y,f.x+f.width/2,f.y+f.height/2,f.width/2,f.height/2,f.radius)) <= f.stroke/2) result=f.color;
  for (const detail of icon.details) {
    if (distance(x,y,...detail.segment) <= detail.width/2) result=detail.color;
  }
  return [...result,255];
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const b of bytes) {
    crc^=b;
    for (let i=0;i<8;i++) crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function rasterizeLogoSvg(source) {
  const icon = parseLogoSvg(source);
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for (let y=0;y<SIZE;y++) {
    const row=y*(1+SIZE*4);
    for (let x=0;x<SIZE;x++) {
      const rgba=[0,0,0,0];
      for (let sy=0;sy<steps;sy++) for (let sx=0;sx<steps;sx++) {
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,icon);
        for (let c=0;c<4;c++) rgba[c]+=pixel[c];
      }
      for (let c=0;c<4;c++) raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const theme of ['dark','cream']) {
    const source = readFileSync(resolve(root,'assets','roygbiv-logo-'+theme+'.svg'),'utf8');
    const file = resolve(root,'assets','roygbiv-logo-'+theme+'.png');
    writeFileSync(file,rasterizeLogoSvg(source));
    console.log(file + ': 512×512 RGBA raster from SVG geometry');
  }
}
),
    new RegExp('^<path d="M' + N + ' ' + N + ' H' + N + ' M' + N + ' ' +
      N + ' H' + N + '" fill="none" stroke="' + HEX +
      '"\\s+stroke-width="' + N + '" stroke-linecap="round"\\s*/>
  if (!/<svg\s[^>]*viewBox="0 0 120 120"[^>]*>/.test(source) ||
      (source.match(/<rect\b/g) || []).length !== 2 ||
      (source.match(/<path\b/g) || []).length !== 8 ||
      (source.match(/<g\b/g) || []).length !== 2 ||
      /<(?:circle|ellipse|polygon|polyline|line|image|text|use|foreignObject)\b/i.test(source)) {
    throw new Error('Unsupported logo SVG: unexpected drawing elements or dimensions');
  }
  const outer = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)"\\s*>'), 'outer translation');
  const inner = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)" fill="none" stroke-width="' + number + '" stroke-linecap="round"\\s*>'), 'band transform or round stroke');
  const background = requireMatch(source, new RegExp('<rect width="120" height="120" rx="' + number + '" fill="' + hex + '"\\s*/>'), 'rounded background');
  const frame = requireMatch(source, new RegExp('<rect x="' + number + '" y="' + number + '" width="' + number + '" height="' + number + '" rx="' + number + '" fill="none"\\s+stroke="' + hex + '" stroke-width="' + number + '"\\s*/>'), 'phone frame');
  const detail = requireMatch(source, new RegExp('<path d="([^"]+)" fill="none" stroke="' + hex + '"\\s+stroke-width="' + number + '" stroke-linecap="round"\\s*/>'), 'phone detail');
  const strokes = [...source.matchAll(new RegExp('<path stroke="' + hex + '" d="M' + number + ' ' + number + ' L' + number + ' ' + number + '"\\s*/>', 'g'))];
  if (strokes.length !== 7) throw new Error('Unsupported logo SVG: expected exactly seven simple rainbow paths');
  const detailSegments = [...detail[1].matchAll(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'))];
  if (detailSegments.length !== 2 || detail[1].replace(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'), '').trim() !== '') {
    throw new Error('Unsupported logo SVG: expected two horizontal phone details');
  }
  const [ox, oy] = [Number(outer[1]), Number(outer[2])];
  const [ix, iy, width] = [Number(inner[1]), Number(inner[2]), Number(inner[3])];
  const [fx, fy, fw, fh, fr, fc, fs] = frame.slice(1);
  const [bgRadius, bg] = background.slice(1);
  const [, detailPath, detailColor, detailWidth] = detail;
  const model = {
    background: rgb(bg), bgRadius: Number(bgRadius),
    bands: strokes.map(m => ({ color: rgb(m[1]), segment: [Number(m[2]) + ox + ix, Number(m[3]) + oy + iy, Number(m[4]) + ox + ix, Number(m[5]) + oy + iy], width })),
    frame: { x: Number(fx) + ox, y: Number(fy) + oy, width: Number(fw), height: Number(fh), radius: Number(fr), color: rgb(fc), stroke: Number(fs) },
    details: detailSegments.map(m => ({ segment: [Number(m[1]) + ox, Number(m[2]) + oy, Number(m[3]) + ox, Number(m[2]) + oy], width: Number(detailWidth), color: rgb(detailColor) })),
  };
  if (![bgRadius, ox, oy, ix, iy, width, fx, fy, fw, fh, fr, fs, detailWidth].every(v => Number.isFinite(Number(v))) ||
      [width, fw, fh, fr, fs, detailWidth, bgRadius].some(v => Number(v) <= 0)) throw new Error('Unsupported logo SVG: invalid geometry');
  return model;
}

const distance = (x,y,ax,ay,bx,by) => {
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den>0 ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)) : 0;
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r) {
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,icon) {
  if (roundedDistance(x,y,60,60,60,60,icon.bgRadius)>0) return [0,0,0,0];
  let result=icon.background;
  for (const band of icon.bands) {
    if (distance(x,y,...band.segment) <= band.width / 2) result=band.color;
  }
  const f=icon.frame;
  if (Math.abs(roundedDistance(x,y,f.x+f.width/2,f.y+f.height/2,f.width/2,f.height/2,f.radius)) <= f.stroke/2) result=f.color;
  for (const detail of icon.details) {
    if (distance(x,y,...detail.segment) <= detail.width/2) result=detail.color;
  }
  return [...result,255];
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const b of bytes) {
    crc^=b;
    for (let i=0;i<8;i++) crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function rasterizeLogoSvg(source) {
  const icon = parseLogoSvg(source);
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for (let y=0;y<SIZE;y++) {
    const row=y*(1+SIZE*4);
    for (let x=0;x<SIZE;x++) {
      const rgba=[0,0,0,0];
      for (let sy=0;sy<steps;sy++) for (let sx=0;sx<steps;sx++) {
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,icon);
        for (let c=0;c<4;c++) rgba[c]+=pixel[c];
      }
      for (let c=0;c<4;c++) raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const theme of ['dark','cream']) {
    const source = readFileSync(resolve(root,'assets','roygbiv-logo-'+theme+'.svg'),'utf8');
    const file = resolve(root,'assets','roygbiv-logo-'+theme+'.png');
    writeFileSync(file,rasterizeLogoSvg(source));
    console.log(file + ': 512×512 RGBA raster from SVG geometry');
  }
}
),
    /^<\/g>$/,
    /^<\/svg>$/,
  ];
  if (tags.length !== supported.length ||
      tags.some((tag, i) => !supported[i].test(tag)) ||
      clean.replace(/<[^>]+>/g, '').trim() !== '') {
    throw new Error('Unsupported logo SVG: unknown element, attribute, text, or drawing order');
  }
}

export function parseLogoSvg(source) {
  verifySupportedLogoSvg(source);
  if (!/<svg\s[^>]*viewBox="0 0 120 120"[^>]*>/.test(source) ||
      (source.match(/<rect\b/g) || []).length !== 2 ||
      (source.match(/<path\b/g) || []).length !== 8 ||
      (source.match(/<g\b/g) || []).length !== 2 ||
      /<(?:circle|ellipse|polygon|polyline|line|image|text|use|foreignObject)\b/i.test(source)) {
    throw new Error('Unsupported logo SVG: unexpected drawing elements or dimensions');
  }
  const outer = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)"\\s*>'), 'outer translation');
  const inner = requireMatch(source, new RegExp('<g transform="translate\\(' + number + ' ' + number + '\\)" fill="none" stroke-width="' + number + '" stroke-linecap="round"\\s*>'), 'band transform or round stroke');
  const background = requireMatch(source, new RegExp('<rect width="120" height="120" rx="' + number + '" fill="' + hex + '"\\s*/>'), 'rounded background');
  const frame = requireMatch(source, new RegExp('<rect x="' + number + '" y="' + number + '" width="' + number + '" height="' + number + '" rx="' + number + '" fill="none"\\s+stroke="' + hex + '" stroke-width="' + number + '"\\s*/>'), 'phone frame');
  const detail = requireMatch(source, new RegExp('<path d="([^"]+)" fill="none" stroke="' + hex + '"\\s+stroke-width="' + number + '" stroke-linecap="round"\\s*/>'), 'phone detail');
  const strokes = [...source.matchAll(new RegExp('<path stroke="' + hex + '" d="M' + number + ' ' + number + ' L' + number + ' ' + number + '"\\s*/>', 'g'))];
  if (strokes.length !== 7) throw new Error('Unsupported logo SVG: expected exactly seven simple rainbow paths');
  const detailSegments = [...detail[1].matchAll(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'))];
  if (detailSegments.length !== 2 || detail[1].replace(new RegExp('M' + number + ' ' + number + ' H' + number, 'g'), '').trim() !== '') {
    throw new Error('Unsupported logo SVG: expected two horizontal phone details');
  }
  const [ox, oy] = [Number(outer[1]), Number(outer[2])];
  const [ix, iy, width] = [Number(inner[1]), Number(inner[2]), Number(inner[3])];
  const [fx, fy, fw, fh, fr, fc, fs] = frame.slice(1);
  const [bgRadius, bg] = background.slice(1);
  const [, detailPath, detailColor, detailWidth] = detail;
  const model = {
    background: rgb(bg), bgRadius: Number(bgRadius),
    bands: strokes.map(m => ({ color: rgb(m[1]), segment: [Number(m[2]) + ox + ix, Number(m[3]) + oy + iy, Number(m[4]) + ox + ix, Number(m[5]) + oy + iy], width })),
    frame: { x: Number(fx) + ox, y: Number(fy) + oy, width: Number(fw), height: Number(fh), radius: Number(fr), color: rgb(fc), stroke: Number(fs) },
    details: detailSegments.map(m => ({ segment: [Number(m[1]) + ox, Number(m[2]) + oy, Number(m[3]) + ox, Number(m[2]) + oy], width: Number(detailWidth), color: rgb(detailColor) })),
  };
  if (![bgRadius, ox, oy, ix, iy, width, fx, fy, fw, fh, fr, fs, detailWidth].every(v => Number.isFinite(Number(v))) ||
      [width, fw, fh, fr, fs, detailWidth, bgRadius].some(v => Number(v) <= 0)) throw new Error('Unsupported logo SVG: invalid geometry');
  return model;
}

const distance = (x,y,ax,ay,bx,by) => {
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=den>0 ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den)) : 0;
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r) {
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,icon) {
  if (roundedDistance(x,y,60,60,60,60,icon.bgRadius)>0) return [0,0,0,0];
  let result=icon.background;
  for (const band of icon.bands) {
    if (distance(x,y,...band.segment) <= band.width / 2) result=band.color;
  }
  const f=icon.frame;
  if (Math.abs(roundedDistance(x,y,f.x+f.width/2,f.y+f.height/2,f.width/2,f.height/2,f.radius)) <= f.stroke/2) result=f.color;
  for (const detail of icon.details) {
    if (distance(x,y,...detail.segment) <= detail.width/2) result=detail.color;
  }
  return [...result,255];
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const b of bytes) {
    crc^=b;
    for (let i=0;i<8;i++) crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
export function rasterizeLogoSvg(source) {
  const icon = parseLogoSvg(source);
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for (let y=0;y<SIZE;y++) {
    const row=y*(1+SIZE*4);
    for (let x=0;x<SIZE;x++) {
      const rgba=[0,0,0,0];
      for (let sy=0;sy<steps;sy++) for (let sx=0;sx<steps;sx++) {
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,icon);
        for (let c=0;c<4;c++) rgba[c]+=pixel[c];
      }
      for (let c=0;c<4;c++) raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const theme of ['dark','cream']) {
    const source = readFileSync(resolve(root,'assets','roygbiv-logo-'+theme+'.svg'),'utf8');
    const file = resolve(root,'assets','roygbiv-logo-'+theme+'.png');
    writeFileSync(file,rasterizeLogoSvg(source));
    console.log(file + ': 512×512 RGBA raster from SVG geometry');
  }
}
