import test from 'node:test';
import assert from 'node:assert/strict';
import {extractImagePathCandidates,imagePlacement,pathToWallpaper} from '../src/image-path.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';

function image(width,height,pixel){
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const colour=pixel(x,y),i=4*(y*width+x);
    data.set([...colour,255],i);
  }
  return {data,width,height};
}
const WHITE=[250,250,250],BLACK=[12,17,25];

test('blank images return no false candidate and reject unbounded input',()=>{
  const empty=image(120,200,()=>WHITE);
  assert.deepEqual(extractImagePathCandidates(empty),[]);
  assert.throws(()=>extractImagePathCandidates({width:700,height:1000,data:new Uint8ClampedArray(2800000)}),
    /Unsupported analysis image/);
});
test('contrasting silhouette becomes a closed outline, independently of its colour',()=>{
  const raster=image(160,240,(x,y)=>x>=30&&x<=126&&y>=40&&y<=182?BLACK:WHITE);
  const candidates=extractImagePathCandidates(raster);
  const outline=candidates.find(p=>p.kind==='contour');
  assert.ok(outline,'filled silhouette should yield a contour');
  assert.ok(outline.points.length>=5);
  assert.ok(Math.hypot(outline.points[0][0]-outline.points.at(-1)[0],
    outline.points[0][1]-outline.points.at(-1)[1])<.0001,'contour should close');
  const imported=pathToWallpaper(outline,160,240);
  assert.ok(imported.points.length>20);
  assert.ok(imported.points.every(p=>p.every(v=>Number.isFinite(v)&&v>=-2&&v<=3)));
  assert.ok(imported.corners.length>=2,'contour corners remain editable');
});
test('rainbow against a blue field produces a chromatic centreline rather than sky',()=>{
  const rainbow=image(220,180,(x,y)=>{
    const radius=Math.hypot(x-110,(y-130)*1.3);
    if(y<140&&radius>72&&radius<105)
      return [[240,20,30],[255,120,4],[255,213,8],
        [20,182,50],[30,70,232],[144,50,210]]
        [Math.min(5,Math.floor((radius-72)/5.5))];
    return [100,170,240];
  });
  const results=extractImagePathCandidates(rainbow);
  const arc=results.find(candidate=>candidate.kind==='arc');
  assert.ok(arc,'rainbow should be recognized as a colour-band region');
  assert.ok(arc.points.length>20);
  assert.ok(arc.points.every(p=>p[1]<.8),'background does not determine the centreline');
  assert.deepEqual(extractImagePathCandidates(rainbow),results,'extraction is deterministic');
});
test('upright winding colour band follows Y stations instead of collapsing X folds',()=>{
  const raster=image(120,240,(x,y)=>{
    if(y<20||y>220)return BLACK;
    const centre=60+30*Math.sin((y-20)/200*Math.PI*2);
    return Math.abs(x-centre)<6?[236,55,28]:BLACK;
  });
  const candidates=extractImagePathCandidates(raster);
  const arc=candidates.find(x=>x.kind==='arc');
  assert.ok(arc,'visible tall coloured path is a reconstructable arc');
  assert.ok(arc.points.length>30);
  assert.ok(arc.points.every((p,i)=>i===0||p[1]>=arc.points[i-1][1]),
    'upright centreline progresses with Y without artificial reversals');
  const at=y=>arc.points.reduce((best,p)=>
    Math.abs(p[1]-y)<Math.abs(best[1]-y)?p:best);
  assert.ok(at(.29)[0]>.68,'upper bulge remains on the right');
  assert.ok(at(.71)[0]<.32,'lower bulge remains on the left');
  const mapped=pathToWallpaper(arc,120,240,0);
  assert.ok(mapped.points.length>20);
  assert.deepEqual(extractImagePathCandidates(raster),candidates);
});

test('diagonal edge produces a selectable angle and stable two-point line',()=>{
  const raster=image(200,200,(x,y)=>Math.abs(y-(.7*x+20))<3?BLACK:WHITE);
  const line=extractImagePathCandidates(raster).find(c=>c.kind==='line');
  assert.ok(line);
  assert.ok(Math.abs(line.angle-35)<8,`expected 35 degrees; received ${line.angle}`);
  const mapped=pathToWallpaper(line,200,200);
  assert.ok(mapped.points.length>=20);
  const a=mapped.points[0],b=mapped.points.at(-1);
  assert.ok(Math.hypot((a[0]-b[0])*600,(a[1]-b[1])*1300)>100);
});
test('letterboxed image placement preserves aspect and goes through existing recipes',()=>{
  const box=imagePlacement(1200,300);
  assert.ok(Math.abs(box.width/box.height-4)<1e-6);
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=600&&box.y+box.height<=1300);
  const candidate={kind:'line',points:[[0,0],[1,1]]};
  const imported=pathToWallpaper(candidate,1200,300);
  const recipe=normalizeRecipe({geometry:'drawn',customPath:imported.points,
    drawnAnchors:imported.anchors,drawnCorners:imported.corners,
    orientation:'horizontal',seed:'import-fixture'});
  assert.equal(resolveScene(recipe).geometry,'drawn');
  assert.equal(resolveScene(recipe).stripes.length,7);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});
