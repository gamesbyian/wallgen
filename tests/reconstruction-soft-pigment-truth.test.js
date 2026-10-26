import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe} from '../src/model.js';
import {extractImageColourRegions} from '../src/image-path.js';
import {plainlyUnsupportedSoftPigments,plainlyAchromaticForeground,
  reconstructionCandidates,RECONSTRUCTION_RENDER_LIMIT}
  from '../src/image-reconstruction.js';

function pastelHue(hue,sat=.23,light=.70){
  const chroma=(1-Math.abs(2*light-1))*sat;
  const x=chroma*(1-Math.abs((hue/60)%2-1));
  const m=light-chroma/2;
  const channels=[[chroma,x,0],[x,chroma,0],[0,chroma,x],
    [0,x,chroma],[x,0,chroma],[chroma,0,x]][Math.floor(hue/60)%6];
  return channels.map(v=>Math.round((v+m)*255));
}
function artwork({tones=HUES.map(h=>pastelHue(h)),
  fill='islands',bg=[5,5,8],alpha=255}={}){
  const width=160,height=360,data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let ink=null;
    if(fill==='islands'){
      for(let n=0;n<tones.length;n++){
        const left=14+(n%2)*78,top=19+Math.floor(n/2)*80;
        if(x>=left&&x<left+31&&y>=top&&y<top+32){
          ink=tones[n];break;
        }
      }
    }else if(fill==='stripes'&&x>=12&&x<140){
      ink=tones[Math.min(tones.length-1,Math.floor(y*tones.length/height))];
    }
    data.set([...(ink??bg),alpha],4*(y*width+x));
  }
  return {width,height,data};
}
test('independent pastel seven-colour islands are visible but cannot be faithfully repainted with canonical saturation',()=>{
  const source=artwork(),bytes=source.data.slice();
  const analysed=extractImageColourRegions(source,HUES);
  assert.equal(analysed.regions.length,0,
    'normal strong canonical hue mask threshold is intentionally unchanged');
  assert.equal(plainlyAchromaticForeground(source,analysed.regions),false,
    'soft colourful source is not a neutral-grey refusal');
  assert.equal(plainlyUnsupportedSoftPigments(source,analysed.regions),true);
  assert.deepEqual(reconstructionCandidates(source,normalizeRecipe({seed:'source-not-known'})),[],
    'refuse false red approximation rather than fabricate 7 strong source masks');
  assert.deepEqual(source.data,bytes,'do not mutate source RGBA bytes');
});
test('actual coloured and grey controls retain their previous classification',()=>{
  const bright=artwork({tones:HUES.map(h=>pastelHue(h,.9,.55))});
  const strong=extractImageColourRegions(bright,HUES);
  assert.equal(strong.regions.length,7);
  assert.equal(plainlyUnsupportedSoftPigments(bright,strong.regions),false);
  const recipes=reconstructionCandidates(bright,{seed:'genuine-bright'});
  assert.ok(recipes.length>0&&recipes.length<=RECONSTRUCTION_RENDER_LIMIT);
  const neutral=artwork({tones:HUES.map(()=>[179,179,179])});
  assert.equal(plainlyUnsupportedSoftPigments(neutral,[]),false);
  assert.equal(plainlyAchromaticForeground(neutral,[]),true);
  assert.deepEqual(reconstructionCandidates(neutral,{}),[]);
});
test('partial soft hues, single-tone pastels, diffuse tones, dark paints and transparent sources are not overrefused',()=>{
  const firstThree=artwork({tones:HUES.slice(0,3).map(h=>pastelHue(h))});
  const mono=artwork({tones:HUES.map(()=>pastelHue(HUES[0]))});
  const diffuse=artwork({fill:'stripes'});
  const dark=artwork({tones:HUES.map(h=>pastelHue(h,.88,.13))});
  const transparent=artwork({alpha:90});
  for(const [label,input] of [['first three',firstThree],['mono',mono],
    ['diffuse',diffuse],['dark',dark],['transparent',transparent]]){
    assert.equal(plainlyUnsupportedSoftPigments(input,[]),false,label);
  }
  const badCorner=artwork();badCorner.data.set([255,255,255,255],0);
  assert.equal(plainlyUnsupportedSoftPigments(badCorner,[]),false);
  const flat=artwork({tones:HUES.map(()=>[5,5,8])});
  assert.equal(plainlyUnsupportedSoftPigments(flat,[]),false);
});
