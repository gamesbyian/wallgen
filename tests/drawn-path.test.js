import {interpretStroke} from '../src/stroke-intent.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {finishDrawnPath, fairPath, normalizeDrawnPath, prepareDrawnPath, safeDrawnBandSpan, pointOnDrawnPath,
  MAX_DRAWN_POINTS,resamplePath} from '../src/drawn-path.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,respectSettingLocks,
  DESIGN_WIDTH,DESIGN_HEIGHT} from '../src/model.js';
import {pathPosition,samplePath,ribbonEdge} from '../src/path-geometry.js';
import {embedPngMetadata,extractPngRecipe} from '../src/png-metadata.js';

const noisy=Array.from({length:250},(_,i)=>[
  .2+.6*i/249,
  .1+.8*i/249+.009*Math.sin(i*2.77)
]);
const gesture=[[.18,.1],[.18,.3],[.22,.55],[.43,.68],[.62,.57],[.63,.32],[.63,.12]];
test('smoothed strokes reduce hand jitter and preserve endpoints',()=>{
  const smooth=finishDrawnPath(noisy);
  assert.ok(smooth.length>10&&smooth.length<=MAX_DRAWN_POINTS);
  assert.ok(Math.abs(smooth[0][0]-noisy[0][0])<.0001);
  assert.ok(Math.abs(smooth.at(-1)[1]-noisy.at(-1)[1])<.025);
  assert.deepEqual(finishDrawnPath(noisy),smooth);
});
test('geometric snapping regularizes near-straight strokes and returns',()=>{
  const raw=Array.from({length:90},(_,i)=>[.12+.78*i/89,.53+.002*Math.sin(i)]);
  const snapped=finishDrawnPath(raw,'geometric');
  assert.ok(snapped.length>=2);
  assert.ok(snapped.every(p=>Math.abs(p[1]-.53)<.008));
  const hairpin=finishDrawnPath(gesture,'geometric');
  const xs=hairpin.map(p=>p[0]);
  assert.ok(hairpin.length>5);
  assert.ok(Math.max(...xs)>Math.min(...xs)+.3);
});
test('invalid, huge and tiny paths are safely rejected or bounded',()=>{
  assert.deepEqual(normalizeDrawnPath([[NaN,0],[Infinity,1]]),[]);
  assert.deepEqual(finishDrawnPath([[.1,.1],[.11,.102]]),[]);
  const huge=Array.from({length:1500},(_,i)=>[i/1499,.5+.3*Math.sin(i/50)]);
  const safe=normalizeDrawnPath(huge);
  assert.ok(safe.length>2&&safe.length<=MAX_DRAWN_POINTS);
  assert.ok(safe.every(([x,y])=>x>=0&&x<=1&&y>=0&&y<=1));
  assert.deepEqual(normalizeDrawnPath(safe),safe);
});
test('prepared path is interpolated by travelled arc length, not X coordinate',()=>{
  const path=prepareDrawnPath([[.25,.2],[.25,.7],[.75,.7]]);
  assert.ok(path.total>600);
  const first=pointOnDrawnPath(path,0),middle=pointOnDrawnPath(path,.5),end=pointOnDrawnPath(path,1);
  assert.equal(first.x,.25*DESIGN_WIDTH-DESIGN_WIDTH/2);
  assert.equal(end.y,.7*DESIGN_HEIGHT-DESIGN_HEIGHT/2);
  assert.ok(middle.y>first.y);
  assert.ok(middle.x<=end.x);
});
test('a hand-drawn path becomes seven normal-offset stripes with unchanged stroke order',()=>{
  const finished=finishDrawnPath(gesture,'smooth');
  const recipe=normalizeRecipe({seed:'doodle-test',customPath:finished,geometry:'drawn',
    orientation:'horizontal',spread:20,individuality:0,chaos:0});
  const scene=resolveScene(recipe);
  assert.equal(scene.geometry,'drawn');
  assert.equal(scene.angle,0);
  assert.equal(scene.stripes.length,7);
  assert.equal(scene.centerX,DESIGN_WIDTH/2);
  assert.equal(scene.centerY,DESIGN_HEIGHT/2);
  const at=scene.stripes.map(s=>samplePath(s,0,scene.extent));
  const normal=at[0];
  const projections=at.map(p=>p.x*normal.nx+p.y*normal.ny);
  assert.ok(projections.every((v,i)=>!i||v>projections[i-1]));
  assert.ok(scene.stripes.every(s=>s.drawnPath.total>300));
  for(const stripe of scene.stripes){
    const edge=ribbonEdge(stripe,scene.extent*.1,scene.extent,1);
    assert.ok(Number.isFinite(edge.x)&&Number.isFinite(edge.y));
  }
});
test('optional tangent extension preserves finite recipes and closed contours',()=>{
  const input=[[.2,.25],[.42,.26],[.68,.29],[.84,.30]];
  const p=prepareDrawnPath(input),o={extrapolate:true,coreExtent:1932};
  assert.ok(pointOnDrawnPath(p,-.8,o).x<pointOnDrawnPath(p,0).x-500);
  assert.ok(pointOnDrawnPath(p,1.8,o).x>pointOnDrawnPath(p,1).x+500);
  assert.deepEqual(pointOnDrawnPath(p,-.8),pointOnDrawnPath(p,0));
  const c=prepareDrawnPath([[.2,.2],[.8,.2],[.8,.8],[.2,.8],[.2,.2]]);
  assert.equal(c.closed,true);
  assert.deepEqual(pointOnDrawnPath(c,-.8,o),pointOnDrawnPath(c,0));
  const r=normalizeRecipe({geometry:'drawn',customPath:input,extendDrawnPath:true,
    viewZoom:.5,positionX:30,positionY:-30});
  assert.equal(decodeRecipe(encodeRecipe(r)).extendDrawnPath,true);
  assert.deepEqual(r.customPath,normalizeDrawnPath(input));
  assert.equal(respectSettingLocks({...r,lockedSettings:['geometry']},
    {...r,extendDrawnPath:false}).extendDrawnPath,true);
});
test('tight freehand turns shrink rainbow spread instead of inverting ribbon offsets',()=>{
  const curve=prepareDrawnPath([[.25,.12],[.23,.35],[.36,.71],[.56,.84],[.76,.65],[.77,.17]]);
  const limit=safeDrawnBandSpan(curve);
  assert.ok(limit>=16&&limit<260, 'a tight U-turn needs a curvature-safe group width');
  const crowded=resolveScene({seed:'narrow-hairpin',geometry:'drawn',spread:100,
    customPath:[[.25,.12],[.23,.35],[.36,.71],[.56,.84],[.76,.65],[.77,.17]]});
  const span=crowded.stripes.at(-1).center-crowded.stripes[0].center;
  assert.ok(span<=limit+1,'scene spread must honor the curve-safe bound');
});
test('drawn path persists through locks, URLs and seeded scene resolution',()=>{
  const saved=normalizeRecipe({geometry:'drawn',customPath:finishDrawnPath(gesture),
    lockedSettings:['geometry'],construction:'tonal'});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
  assert.deepEqual(resolveScene(saved),resolveScene(saved));
  const changed=respectSettingLocks(saved,{geometry:'wave',customPath:[],seed:'changed'});
  assert.equal(changed.geometry,'drawn');
  assert.deepEqual(changed.customPath,saved.customPath);
  assert.equal(resolveScene({geometry:'drawn',customPath:[]}).geometry,'straight');
});

test('spline fairing strongly attenuates wobble while retaining the swept shape',()=>{
  const raw=Array.from({length:220},(_,i)=>{
    const t=i/219;
    return [.09+.82*t,.15+.66*t+.013*Math.sin(i*2.4)];
  });
  const result=finishDrawnPath(raw,'smooth');
  const rawDeviation=raw.reduce((sum,p)=>sum+Math.abs(p[1]-(.15+.66*(p[0]-.09)/.82)),0)/raw.length;
  const smoothDeviation=result.reduce((sum,p)=>sum+Math.abs(p[1]-(.15+.66*(p[0]-.09)/.82)),0)/result.length;
  assert.ok(smoothDeviation<rawDeviation*.65,'finished path should markedly reduce local jitter');
  assert.ok(Math.abs(result[0][0]-raw[0][0])<.0001&&
    Math.abs(result.at(-1)[0]-raw.at(-1)[0])<.0001,'endpoints stay anchored');
});
test('out-of-frame sketch endpoints survive smoothing and recipe normalization',()=>{
  const raw=[[-.42,.14],[-.25,.20],[-.07,.36],[.18,.53],[.53,.75],[1.14,.90]];
  const finished=finishDrawnPath(raw,'smooth');
  assert.ok(finished.length>3&&finished[0][0]<0&&finished.at(-1)[0]>1);
  const recipe=normalizeRecipe({geometry:'drawn',customPath:finished,seed:'off-frame'});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  const prepared=prepareDrawnPath(recipe.customPath);
  assert.ok(pointOnDrawnPath(prepared,0).x < -DESIGN_WIDTH/2);
  assert.ok(pointOnDrawnPath(prepared,1).x > DESIGN_WIDTH/2);
  assert.deepEqual(finished,normalizeDrawnPath(finished));
});

test('smoothing strength keeps the old minimum and progressively removes small bends',()=>{
  const raw=Array.from({length:280},(_,i)=>{
    const t=i/279;
    return [.13+.74*t,.22+.56*t+.022*Math.sin(t*Math.PI*8)];
  });
  const old=finishDrawnPath(raw,'smooth');
  const one=finishDrawnPath(raw,'smooth',1);
  const middle=finishDrawnPath(raw,'smooth',3);
  const strong=finishDrawnPath(raw,'smooth',5);
  assert.deepEqual(one,old,'1× must reproduce existing smoothing exactly');
  const drift=points=>points.reduce((total,[x,y])=>
    total+Math.abs(y-(.22+.56*(x-.13)/.74)),0)/points.length;
  assert.ok(drift(middle)<drift(one)*.85,
    '3× should eliminate noticeable mid-frequency waviness');
  assert.ok(drift(strong)<drift(one)*.45,
    '5× should make an approximately straight gesture substantially straighter');
  for(const path of [middle,strong]){
    assert.deepEqual(path[0],one[0]);
    assert.deepEqual(path.at(-1),one.at(-1));
    assert.ok(path.length>=2&&path.length<=MAX_DRAWN_POINTS);
  }
  assert.deepEqual(finishDrawnPath(raw,'smooth',0),one);
  assert.deepEqual(finishDrawnPath(raw,'smooth',5),strong);
  assert.deepEqual(finishDrawnPath(raw,'smooth',30),finishDrawnPath(raw,'smooth',10));
  assert.deepEqual(finishDrawnPath(raw,'smooth',NaN),one);
});
test('strong geometric smoothing preserves main loops and off-frame endpoints',()=>{
  const raw=[[-.4,.14],[-.1,.26],[.2,.63],[.48,.82],[.72,.7],[.77,.25],[1.22,.1]];
  for(const power of [1,2,3,4,5]){
    const result=finishDrawnPath(raw,'geometric',power);
    assert.ok(result.length>=2);
    assert.ok(result[0][0]<0&&result.at(-1)[0]>1);
    assert.ok(result.some(p=>p[1]>.68),'deliberate large curve is retained');
    assert.deepEqual(result,finishDrawnPath(raw,'geometric',power));
  }
});

test('at 10× a finger-drawn horizontal line becomes mathematically horizontal',()=>{
  const raw=Array.from({length:120},(_,i)=>{
    const t=i/119;return [.08+.83*t,.46+.007*Math.sin(i*.7)+.005*t];
  });
  const result=finishDrawnPath(raw,'smooth',10);
  assert.ok(result.length>=30);
  const maxY=Math.max(...result.map(p=>p[1])),
    minY=Math.min(...result.map(p=>p[1]));
  assert.ok(maxY-minY<.00002,'Y must be constant, not merely less wobbly');
  assert.ok(result[0][0]<.09&&result.at(-1)[0]>.90);
});
test('10× recovers an exactly vertical line from a wobbly stylus stroke',()=>{
  const raw=Array.from({length:160},(_,i)=>{
    const t=i/159;return [.54+.014*Math.sin(i*.45)+.006*t,-.08+1.12*t];
  });
  const result=finishDrawnPath(raw,'smooth',10);
  assert.ok(result.length>=30);
  assert.ok(Math.max(...result.map(p=>p[0]))-
    Math.min(...result.map(p=>p[0]))<.00002);
  assert.ok(result[0][1]<0&&result.at(-1)[1]>1,
    'off-frame endpoints are not clipped by axis snapping');
});
test('high-strength diagonal line stays diagonal, not forcibly horizontal',()=>{
  const raw=Array.from({length:105},(_,i)=>{
    const t=i/104;
    return [.12+.74*t,.15+.58*t+.006*Math.sin(i*.71)];
  });
  const result=finishDrawnPath(raw,'smooth',10);
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const begin=result[0],end=result.at(-1);
  assert.ok(result.reduce((sum,p)=>sum+Math.abs(cross(begin,end,p)),0)/result.length<.00003);
  assert.ok(end[1]-begin[1]>.5);
});
test('10× recovers a circular loop with uniform radius and closed ends',()=>{
  const centre=[.48,.48],rx=.275,ry=rx*600/1300;
  const raw=Array.from({length:215},(_,i)=>{
    const t=i/214,angle=2*Math.PI*t-.73;
    const r=1+.045*Math.sin(i*.79)+.025*Math.cos(i*.17);
    return [centre[0]+rx*r*Math.cos(angle),centre[1]+ry*r*Math.sin(angle)];
  });
  const result=finishDrawnPath(raw,'smooth',10);
  assert.ok(result.length>=50);
  const px=result.map(([x,y])=>[x*600,y*1300]);
  const cx=px.reduce((s,p)=>s+p[0]/px.length,0);
  const cy=px.reduce((s,p)=>s+p[1]/px.length,0);
  const radii=px.map(p=>Math.hypot(p[0]-cx,p[1]-cy));
  const mean=radii.reduce((s,r)=>s+r,0)/radii.length;
  const deviation=Math.sqrt(radii.reduce((s,r)=>s+(r-mean)**2,0)/radii.length)/mean;
  assert.ok(deviation<.018,'fitted loop should be circular rather than an oval or flattened blob');
  assert.ok(Math.hypot(...[px[0][0]-px.at(-1)[0],px[0][1]-px.at(-1)[1]])<3,
    'circular loop should close precisely');
});
test('confident partial circular arcs retain a smooth round curve',()=>{
  const raw=Array.from({length:150},(_,i)=>{
    const a=(-.18+i/149*1.28)*Math.PI;
    const r=1+.015*Math.sin(i*.89);
    return [.5+.24*r*Math.cos(a),.52+.24*600/1300*r*Math.sin(a)];
  });
  const result=finishDrawnPath(raw,'smooth',10);
  assert.ok(result.length>20);
  const xs=result.map(p=>p[0]),ys=result.map(p=>p[1]);
  assert.ok(Math.max(...xs)-Math.min(...xs)>.24);
  assert.ok(Math.max(...ys)-Math.min(...ys)>.14);
});
test('strong geometric mode accepts 10× while preserving intentional bends',()=>{
  const raw=[[-.18,.17],[-.17,.36],[-.12,.62],[.18,.73],[.48,.61],[.52,.39],[.55,.11]];
  const result=finishDrawnPath(raw,'geometric',10);
  assert.ok(result.length>=10);
  assert.ok(result[0][0]<0&&result.at(-1)[1]<.2);
  assert.ok(Math.max(...result.map(p=>p[1]))>.5);
  assert.deepEqual(result,finishDrawnPath(raw,'geometric',10));
});

test('recognition can polish two circular loops connected by straight paths',()=>{
  const line=(a,b,n)=>Array.from({length:n},(_,i)=>[
    a[0]+(b[0]-a[0])*i/(n-1),a[1]+(b[1]-a[1])*i/(n-1)
  ]);
  const loop=(cx,n)=>Array.from({length:n},(_,i)=>{
    const theta=Math.PI+Math.PI*2*i/(n-1);
    const radius=45*(1+.067*Math.sin(i*.79));
    return [cx+radius*Math.cos(theta),615+radius*Math.sin(theta)];
  });
  const p=[
    ...line([50,615],[135,615],25),
    ...loop(180,86),
    ...line([135,615],[305,615],42),
    ...loop(350,86),
    ...line([305,615],[540,615],50)
  ];
  const raw=p.map(([x,y])=>[x/600,y/1300]);
  const recognized=interpretStroke(raw);
  assert.equal(recognized?.kind,'embedded-loops','correct circular subpaths without recategorizing the entire gesture');
  const polished=recognized.points.map(([x,y])=>[x*600,y*1300]);
  // The recognizer must retain the lead-in and lead-out rather than replacing
  // the composite gesture with a single global circle.
  assert.ok(polished[0][0]<60&&polished.at(-1)[0]>530);
  assert.ok(polished.some((point,i)=>Math.hypot(point[0]-p[i][0],point[1]-p[i][1])>1.5),
    'the round strokes should actually be corrected');
  const finished=finishDrawnPath(raw,'smooth',10);
  assert.ok(finished.length>20&&finished[0][0]<.1&&finished.at(-1)[0]>.85);
});

test('a deliberate square remains a cornered path instead of being mistaken for a circle',()=>{
  const corners=[[.22,.28],[.68,.28],[.68,.49],[.22,.49],[.22,.28]];
  const raw=[];
  for(let edge=0;edge<4;edge++)for(let i=0;i<40;i++){
    const t=i/39,a=corners[edge],b=corners[edge+1];
    raw.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
  }
  const kind=interpretStroke(raw)?.kind;
  assert.notEqual(kind,'circle','a square has four intentional corners');
  const result=finishDrawnPath(raw,'geometric',10);
  assert.ok(result.length>=12);
  const xs=result.map(p=>p[0]),ys=result.map(p=>p[1]);
  assert.ok(Math.max(...xs)-Math.min(...xs)>.35);
  assert.ok(Math.max(...ys)-Math.min(...ys)>.15);
});
test('a changing-direction figure-eight is not falsely identified as one circle',()=>{
  const raw=Array.from({length:185},(_,i)=>{
    const t=i/184*Math.PI*2;
    return [.5+.27*Math.sin(t),.5+.13*Math.sin(2*t)];
  });
  const kind=interpretStroke(raw)?.kind;
  assert.notEqual(kind,'circle');
  assert.notEqual(kind,'arc');
  const result=finishDrawnPath(raw,'smooth',10);
  assert.ok(result.length>10);
});

test('embedded loop corrections fade smoothly around a self-crossing',()=>{
  // Lollipop-style gesture: the line enters an imperfect circle, travels
  // around once, then continues. The loop is visited twice at its junction;
  // the recognizer must not inject two opposing hooks there.
  const center=[315,500],radius=150,startAngle=2.27;
  const at=angle=>[center[0]+radius*Math.cos(angle),center[1]+radius*Math.sin(angle)];
  const start=at(startAngle),tangent=[Math.sin(startAngle),-Math.cos(startAngle)];
  const point=(x,y)=>[x/600,y/1300];
  const line=(a,b,count)=>Array.from({length:count},(_,i)=>{
    const t=i/(count-1);
    return point(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);
  });
  const leadIn=[start[0]-tangent[0]*235,start[1]-tangent[1]*235];
  const leadOut=[start[0]+tangent[0]*380,start[1]+tangent[1]*380];
  const circle=Array.from({length:251},(_,i)=>{
    const angle=startAngle-2*Math.PI*i/250;
    const r=radius*(1+.045*Math.sin(i*.86)+.015*Math.cos(i*.21));
    return point(center[0]+r*Math.cos(angle),center[1]+r*Math.sin(angle));
  });
  const raw=[
    ...line(leadIn,start,67).slice(0,-1),
    ...circle,
    ...line(start,leadOut,80).slice(1)
  ];
  // The production recognizer receives evenly arc-length-sampled input,
  // irrespective of how many raw pointer events a device delivers.
  const length=raw.slice(1).reduce((n,p,i)=>n+
    Math.hypot((p[0]-raw[i][0])*600,(p[1]-raw[i][1])*1300),0);
  const even=resamplePath(raw,Math.min(500,Math.max(8,Math.ceil(length/7))));
  const interpretation=interpretStroke(even);
  assert.equal(interpretation?.kind,'embedded-loops');
  assert.ok(interpretation.weights.some(v=>v>.8),'inner circle is actively fitted');
  assert.ok(interpretation.weights.slice(0,15).every(v=>v===0),
    'the independent lead-in stays outside the circle fit');
  assert.ok(interpretation.weights.slice(-35).every(v=>v===0),
    'the independent lead-out stays outside the circle fit');
  const finished=finishDrawnPath(raw,'smooth',10);
  assert.ok(finished.length>40);
  const ink=finished.map(([x,y])=>[600*x,1300*y]);
  const turns=[];
  for(let i=1;i<ink.length-1;i++){
    const a=ink[i-1],b=ink[i],c=ink[i+1];
    const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
    turns.push(Math.abs(Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy)));
  }
  const maxTurn=Math.max(...turns),maxIndex=turns.indexOf(maxTurn)+1;
  assert.ok(maxTurn<.65,'no artificial sharp hook at the loop seam: '+
    JSON.stringify({maxTurn,maxIndex,around:ink.slice(Math.max(0,maxIndex-3),maxIndex+4)}));
  assert.ok(ink[0][0]<start[0]-100&&ink.at(-1)[0]>start[0]+130,
    'both tail sections remain connected to the loop');
});
