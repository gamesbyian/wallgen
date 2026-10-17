// Dependency-free raster companions for the repository's two SVG logo variants.
// Keep the geometry and palette here matched to assets/roygbiv-logo-*.svg.
import {readFileSync,writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const SIZE=512;
const COLORS=['#ff474e','#ff9b39','#ffe25b','#4fdd87','#53aaff','#6359e5','#bb64ed'];
const EDGES=[[12,40,107,14],[8,52,67,35],[23,61,111,36],
  [12,74,110,48],[10,87,78,68],[17,97,111,72],[40,100,100,84]];
const rgb=(hex)=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
const colors=COLORS.map(rgb);
const dist=(x,y,ax,ay,bx,by)=>{
  const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/den));
  return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
};
function roundedDistance(x,y,cx,cy,hw,hh,r){
  const qx=Math.abs(x-cx)-(hw-r),qy=Math.abs(y-cy)-(hh-r);
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;
}
function sample(x,y,light){
  const bg=light?[255,249,238]:[5,6,8],ink=light?[17,19,26]:[255,255,255];
  if(roundedDistance(x,y,60,60,60,60,15)>0)return [0,0,0,0];
  let result=bg;
  // RGB bands are part of the same 2.4-unit upward offset as the SVG.
  for(let i=0;i<EDGES.length;i++){
    const [ax,ay,bx,by]=EDGES[i];
    if(dist(x,y,ax,ay-2.4,bx,by-2.4)<=4.5)result=colors[i];
  }
  if(Math.abs(roundedDistance(x,y,60.5,60,26.5,47,10))<=1.25 ||
    dist(x,y,50,21,71,21)<=.85 ||
    dist(x,y,55,99,66,99)<=.85)result=ink;
  return [...result,255];
}
function crc32(bytes){
  let crc=0xffffffff;
  for(const b of bytes){
    crc^=b;
    for(let i=0;i<8;i++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data){
  const name=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(out.subarray(4,out.length-4)),out.length-4);
  return out;
}
function render(light){
  const raw=Buffer.alloc((1+SIZE*4)*SIZE);
  const steps=3,n=steps*steps;
  for(let y=0;y<SIZE;y++){
    const row=y*(1+SIZE*4);
    for(let x=0;x<SIZE;x++){
      const rgba=[0,0,0,0];
      for(let sy=0;sy<steps;sy++)for(let sx=0;sx<steps;sx++){
        const pixel=sample((x+(sx+.5)/steps)*120/SIZE,(y+(sy+.5)/steps)*120/SIZE,light);
        for(let c=0;c<4;c++)rgba[c]+=pixel[c];
      }
      for(let c=0;c<4;c++)raw[row+1+x*4+c]=Math.round(rgba[c]/n);
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);ihdr[8]=8;ihdr[9]=6;
  const png=Buffer.concat([
    Buffer.from('89504e470d0a1a0a','hex'),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),
    chunk('IEND',Buffer.alloc(0)),
  ]);
  return png;
}
for(const light of [false,true]){
  const theme=light?'cream':'dark';
  const svg=readFileSync(resolve(root,'assets',`roygbiv-logo-${theme}.svg`),'utf8');
  for(const color of COLORS)if(!svg.includes(color))throw Error(`SVG palette mismatch in ${theme}`);
  const file=resolve(root,'assets',`roygbiv-logo-${theme}.png`);
  writeFileSync(file,render(light));
  console.log(`${file}: 512×512 RGBA raster`);
}
