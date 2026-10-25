import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES} from '../src/model.js';
import {extractImageColourRegions} from '../src/image-path.js';
import {
  skeletonizePigment,describeRainbowInkGeometry,compareRainbowInkGeometry,
  proposeMedialWidthDeltas,measureUpperHueGaps,
  proposeUpperGapTrials
} from '../src/reconstruction-ink-geometry.js';

const raster=(w,h,painter)=>{
  const data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const rgba=painter(x,y),p=4*(y*w+x);
    data.set(rgba,p);
  }
  return {width:w,height:h,data};
};
const black=[0,0,0,255],red=[255,0,0,255],
  orange=[255,123,0,255];

test('canonical importer exposes identical segmentation masks only when explicitly asked',()=>{
  const src=raster(32,32,(x,y)=>
    x>=4&&x<=11&&y>=4&&y<=24?red:
      x>=16&&x<=24&&y>=4&&y<=24?orange:black);
  const usual=extractImageColourRegions(src,HUES);
  const shared=extractImageColourRegions(src,HUES,{includeMasks:true});
  assert.equal(Object.hasOwn(usual,'masks'),false,
    'default importer remains unchanged');
  assert.equal(shared.masks.length,7);
  assert.ok(shared.masks.every(a=>a instanceof Uint8Array));
  assert.deepEqual(usual.regions,shared.regions);
  assert.deepEqual(usual.componentRegions,shared.componentRegions);
  assert.equal(shared.masks[0].reduce((n,v)=>n+v,0),8*21);
  // Caller-local read-only contract: one caller cannot change future imports.
  shared.masks[0].fill(0);
  assert.equal(extractImageColourRegions(src,HUES,{includeMasks:true})
    .masks[0].reduce((n,v)=>n+v,0),8*21);
});

test('Zhang-Suen medial line preserves long bands and keeps a real centreline',()=>{
  const w=31,h=33;
  const ink=new Uint8Array(w*h);
  for(let y=3;y<30;y++)for(let x=10;x<=16;x++)ink[y*w+x]=1;
  const result=skeletonizePigment(ink,w,h);
  assert.equal(result.complete,true);
  assert.ok(result.count>=20&&result.count<40);
  assert.ok(result.pixels[17*w+13]);
  assert.equal(result.pixels[17*w+10],0);
  assert.ok(result.iterations<20);
});

test('source-only geometry yields observed ink widths and per-hue topology',()=>{
  const a=raster(48,64,(x,y)=>
    y>5&&y<57&&x>5&&x<11?red:
      y>5&&y<57&&x>20&&x<29?orange:black);
  const result=describeRainbowInkGeometry(a);
  assert.equal(result.width,48);
  assert.equal(result.hueCount,2);
  assert.equal(result.byHue[0].components,1);
  assert.equal(result.byHue[0].holes,0);
  assert.equal(result.byHue[2].inkWidthMedian,null);
  assert.ok(result.byHue[0].inkWidthMedian>0);
  assert.ok(result.byHue[1].inkWidthMedian>
    result.byHue[0].inkWidthMedian,
    'thicker orange strip should report wider medial ink');
  assert.ok(result.byHue[0].skeletonComplete);
});

test('source-versus-fitted diagnostics distinguish missing pigment, thickness and edge misalignment',()=>{
  const source=raster(48,64,(x,y)=>
    x>9&&x<17&&y>6&&y<55?red:
      x>30&&x<40&&y>6&&y<55?orange:black);
  const shifted=raster(48,64,(x,y)=>
    x>10&&x<15&&y>6&&y<55?red:black);
  const same=compareRainbowInkGeometry(source,source);
  assert.equal(same.meanIoU,1);
  assert.equal(same.meanEdgeChamfer,0);
  assert.equal(same.topologyMismatch,0);
  const diff=compareRainbowInkGeometry(source,shifted);
  assert.deepEqual(diff.missingHues,[1]);
  assert.ok(diff.meanEdgeChamfer>0);
  assert.ok(diff.byHue[0].widthRatio>1);
  assert.ok(diff.meanIoU<1);
  assert.equal(diff.byHue[1].edgeChamfer,1);
  assert.equal(diff.byHue[2].iou,1,'both absent means exact agreement');
});

test('diagnostics reject mismatched/unbounded inputs before allocation',()=>{
  const src=raster(16,24,()=>black);
  assert.throws(()=>compareRainbowInkGeometry(src,
    raster(32,24,()=>black)),RangeError);
  assert.throws(()=>skeletonizePigment(new Uint8Array(4),3,3),RangeError);
  assert.throws(()=>skeletonizePigment(new Uint8Array(9),3,3,
    {maxIterations:999}),RangeError);
});

test('medial-width probe refuses incoherent colours and estimates coherent narrow ink',()=>{
  const hue=(r)=>({source:{ink:200,skeletonComplete:true},
    rendered:{ink:220,skeletonComplete:true},widthRatio:r});
  const noisy={byHue:[.75,1.4,1.2,.66,1,.71,1.5].map(hue)};
  assert.equal(proposeMedialWidthDeltas(noisy,65),null,
    'do not shrink real Hairpin #05 from inconsistent per-hue widths');
  const coherent={byHue:[.78,.79,.82,.80,.77,.81,.79].map(hue)};
  const hint=proposeMedialWidthDeltas(coherent,52);
  assert.ok(hint);
  assert.ok(hint.deltas.every(d=>d<0&&d>=-22));
  assert.ok(hint.deltas.length<=3);
  assert.equal(proposeMedialWidthDeltas({byHue:[1,1,1,1,1,1,1].map(hue)},52),null);
  assert.equal(proposeMedialWidthDeltas({byHue:[.8,.8,.8].map(hue)},52),null);
});

test('upper-frame source black channels are measured locally and crossing rows refused',()=>{
  const w=90,h=80;
  const create=(gap)=>raster(w,h,(x,y)=>{
    if(y<5||y>70)return black;
    for(let hue=0;hue<7;hue++){
      const start=3+hue*(8+gap);
      if(x>=start&&x<=start+7){
        const hues=[
          [255,0,0,255],[255,124,0,255],[255,230,0,255],
          [0,220,70,255],[0,120,255,255],[80,20,255,255],
          [190,0,250,255]
        ];
        return hues[hue];
      }
    }
    return black;
  });
  const a=extractImageColourRegions(create(2),HUES,{includeMasks:true});
  const b=extractImageColourRegions(create(0),HUES,{includeMasks:true});
  const gaps=measureUpperHueGaps(a.masks,w,h);
  assert.equal(gaps.medianGap,2);
  assert.equal(gaps.gapPositiveFraction,1);
  assert.ok(gaps.usableRows>=8);
  const touching=measureUpperHueGaps(b.masks,w,h);
  assert.equal(touching.medianGap,0);
  assert.equal(touching.gapPositiveFraction,0);
  assert.throws(()=>measureUpperHueGaps([],w,h),RangeError);
});

test('coupled-gap experiment demands real source-visible missing channels',()=>{
  const good={upperSourceGaps:{
    usableRows:20,observedPairs:120,meanGap:1,gapPositiveFraction:1
  },upperRenderedGaps:{
    usableRows:20,observedPairs:120,meanGap:.33,gapPositiveFraction:.33
  }};
  const hairpin=proposeUpperGapTrials(good,'hairpin');
  assert.equal(hairpin.trials.length,3);
  assert.ok(hairpin.trials.every(x=>x.widthDelta<0&&x.spreadDelta>0));
  assert.equal(proposeUpperGapTrials(good,'straight'),null);
  assert.equal(proposeUpperGapTrials({
    ...good,upperRenderedGaps:good.upperSourceGaps},'loop'),null);
  assert.equal(proposeUpperGapTrials({
    ...good,upperSourceGaps:{...good.upperSourceGaps,usableRows:2}},'loop'),null);
});
