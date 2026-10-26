import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe} from '../src/model.js';
import {extractImageColourRegions} from '../src/image-path.js';
import {describeReconstructionImage,reconstructionCandidates,
  plainlyUnsupportedDarkPigments,RECONSTRUCTION_RENDER_LIMIT}
  from '../src/image-reconstruction.js';

function hsl(h,s=.88,l=.13){
  const chroma=(1-Math.abs(2*l-1))*s;
  const x=chroma*(1-Math.abs((h/60)%2-1));
  const m=l-chroma/2;
  const a=[[chroma,x,0],[x,chroma,0],[0,chroma,x],
    [0,x,chroma],[x,0,chroma],[chroma,0,x]][Math.floor(h/60)%6];
  return a.map(value=>Math.round((value+m)*255));
}
function sevenArt({palette=HUES.map(h=>hsl(h)),layout='islands',bg=[5,5,8]}={}){
  const width=160,height=360,data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let index=-1;
    if(layout==='islands'){
      for(let slot=0;slot<7;slot++){
        const left=14+(slot%2)*78,top=18+Math.floor(slot/2)*82;
        if(x>=left&&x<left+31&&y>=top&&y<top+34){
          index=slot;break;
        }
      }
    }else if(layout==='ribbons'&&x>=12&&x<148)
      index=Math.min(6,Math.floor(y*7/height));
    data.set([...(index<0?bg:palette[index]),255],4*(y*width+x));
  }
  return {width,height,data};
}
test('seven compact visibly very dark pigments are not misrepresented by a tiny bright outline',()=>{
  const source=sevenArt(),original=source.data.slice();
  const desc=describeReconstructionImage(source);
  assert.equal(desc.background,'black');
  assert.equal(desc.sevenColourRegions,true);
  assert.deepEqual(desc.colourRegions.map(region=>region.index),[0,1,2,3,4,5,6]);
  assert.ok(desc.colourRegions.every(r=>Math.max(...r.meanRGB)<86));
  assert.equal(plainlyUnsupportedDarkPigments(desc),true);
  assert.deepEqual(reconstructionCandidates(source,normalizeRecipe({seed:'unknown-dark-source'})),[],
    'the source RGB cannot be reproduced by any bright canonical palette');
  assert.deepEqual(source.data,original,'do not modify the anonymous source');
});
test('genuinely representable coloured palettes and mixed-bright art keep normal bounded candidates',()=>{
  const jewel=sevenArt({palette:HUES.map(h=>hsl(h,.84,.39))});
  const ordinary=describeReconstructionImage(jewel);
  assert.equal(plainlyUnsupportedDarkPigments(ordinary),false);
  assert.ok(ordinary.sevenColourRegions);
  const normal=reconstructionCandidates(jewel,{seed:'art-not-provenance'});
  assert.ok(normal.length>0&&normal.length<=RECONSTRUCTION_RENDER_LIMIT);
  const mixed=sevenArt({palette:HUES.map((h,i)=>hsl(h,.88,i===0?.34:.13))});
  assert.equal(describeReconstructionImage(mixed).colourRegions.length,7);
  assert.equal(plainlyUnsupportedDarkPigments(describeReconstructionImage(mixed)),false);
});
test('dark ribbons, very faint ink, broken slots and pale-background hues do not trigger compact seven-dark refusal',()=>{
  const ribbons=sevenArt({layout:'ribbons'});
  const bands=describeReconstructionImage(ribbons);
  assert.equal(bands.sevenColourRegions,false);
  assert.equal(plainlyUnsupportedDarkPigments(bands),false);
  const faint=sevenArt({palette:HUES.map(h=>hsl(h,.88,.09))});
  assert.ok(extractImageColourRegions(faint,HUES).regions.length<7);
  assert.equal(plainlyUnsupportedDarkPigments(describeReconstructionImage(faint)),false);
  const sparse=sevenArt({palette:HUES.map((h,i)=>i===4?[5,5,8]:hsl(h))});
  assert.ok(describeReconstructionImage(sparse).colourRegions.length<7);
  assert.equal(plainlyUnsupportedDarkPigments(describeReconstructionImage(sparse)),false);
  const white=sevenArt({bg:[250,250,250]});
  assert.equal(describeReconstructionImage(white).background,'white');
  assert.equal(plainlyUnsupportedDarkPigments(describeReconstructionImage(white)),false);
});
