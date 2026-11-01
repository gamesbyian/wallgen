import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {sandEchoStyles,sandCachedInsetContours,paintSandRegionEchoes,paintSandRibbonEchoes} from '../src/sand-contour-echo.js';

const square=(x0,y0,x1,y1)=>[
  {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}
];
const styles=(extra={})=>sandEchoStyles(resolveScene(normalizeRecipe({
  seed:'source-echo-evidence',material:'sand-filigree',
  textureCoverage:'stripes',textureStrength:85,textureScale:42,...extra
})));
const ctx=()=>({
  events:[],
  save(){this.events.push('save')},restore(){this.events.push('restore')},
  beginPath(){this.events.push('begin')},
  moveTo(x,y){this.events.push(['move',x,y])},
  lineTo(x,y){this.events.push(['line',x,y])},
  closePath(){this.events.push('close')},
  arc(x,y,r){this.events.push(['arc',x,y,r])},
  stroke(){this.events.push(['stroke',this.strokeStyle,this.lineWidth])}
});

test('echo is separately opt-in, inheriting canonical material controls across 3 layers',()=>{
  const r=normalizeRecipe({material:'sand-filigree',textureCoverage:'stripes',
    textureLayer2Enabled:true,material2:'sand-filigree',
    textureLayer3Enabled:true,material3:'sand-filigree'});
  assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
  assert.deepEqual(resolveScene(r).textureLayers.map(x=>x.material),
    ['sand-filigree','sand-filigree','sand-filigree']);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/<option value="sand-filigree">/g)||[]).length,3);
  assert.equal(styles().length,1);
  assert.equal(styles({material:'sand-mandala'}).length,0);
  assert.equal(styles({material:'sand-beaded'}).length,0);
  assert.equal(styles({textureCoverage:'background'}).length,0);
  assert.equal(styles({textureStrength:0}).length,0);
  assert.ok(styles({textureScale:80})[0].insets[1]>styles({textureScale:20})[0].insets[1]);
  assert.ok(styles({textureStrength:95})[0].light>styles({textureStrength:20})[0].light);
});

test('metric region echoes derive from original compound rings and naturally collapse',()=>{
  const outer=square(0,0,170,110),hole=square(55,36,99,75),
    island=square(200,28,240,65);
  const object={rings:[outer,hole,island]},s=styles();
  const c=ctx();
  const count=paintSandRegionEchoes(c,object,s,{left:-20,top:-20,right:260,bottom:145});
  assert.ok(count>=4,'outer, hole and island should produce multiple true offsets');
  assert.ok(c.events.some(x=>Array.isArray(x)&&x[0]==='line'));
  assert.equal(c.events[0],'save');assert.equal(c.events.at(-1),'restore');
  const skinny=ctx();
  assert.equal(paintSandRegionEchoes(skinny,{rings:[square(0,0,50,8)]},s),0,
    'a thin band cannot physically hold inset levels');
  assert.equal(paintSandRegionEchoes(ctx(),{rings:[
    Array.from({length:769},(_,i)=>({x:60+40*Math.cos(i/769*2*Math.PI),y:60+40*Math.sin(i/769*2*Math.PI)}))
  ]},s),0,'expensive untrusted high-vertex sources keep base sand without echoes');
});

test('circle echoes never inflate or redraw their source boundary',()=>{
  const s=styles(),c=ctx(),circle={circle:{cx:60,cy:70,r:44}};
  assert.equal(paintSandRegionEchoes(c,circle,s),2);
  const arcs=c.events.filter(x=>Array.isArray(x)&&x[0]==='arc');
  assert.equal(arcs.length,2);
  assert.ok(arcs.every(x=>x[3]<44&&x[3]>0));
  assert.equal(paintSandRegionEchoes(ctx(),{circle:{cx:60,cy:70,r:4}},s),0);
});

test('ribbon echoes retain original station positions on crossing-window replay',()=>{
  const stripe={coreExtent:160,segmentStart:-160,segmentEnd:160},
    pointAt=(station,side)=>({x:station,y:side*20+Math.sin(station/100)*2}),
    centerAt=station=>({x:station,y:Math.sin(station/100)*2}),
    widthAt=()=>40;
  const draw=range=>{
    const c=ctx();paintSandRibbonEchoes(c,stripe,160,styles(),
      pointAt,centerAt,widthAt,range);return c.events.filter(x=>
      Array.isArray(x)&&['move','line'].includes(x[0])).map(x=>x.slice(1));
  };
  const all=draw(),part=draw({start:-51,end:73});
  assert.ok(part.length>30);
  for(const event of part)assert.ok(all.some(x=>
    JSON.stringify(x)===JSON.stringify(event)));
  assert.equal(paintSandRibbonEchoes(ctx(),stripe,160,[],pointAt,centerAt,widthAt),0);
  assert.equal(paintSandRibbonEchoes(ctx(),stripe,160,styles(),
    pointAt,centerAt,()=>2),0,'pinched ribbon cannot hold thick nested echoes');
});

test('renderer clips echo deposits to actual source fill and replays source stations',()=>{
  const code=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
  assert.match(code,/paintSandRegionEchoes\(ctx,object,sandEchoes,scene\.renderBounds\)/);
  assert.match(code,/ctx\.clip\(object\.rings\?'evenodd':'nonzero'\)/);
  assert.match(code,/paintSandRibbonEchoes\(g,stripe,scene\.extent,sandEchoes,/);
  assert.match(code,/station=>widthAt\(stripe,station,scene\.extent\),\{start,end\}\)/);
});


test('nonprogressing extreme integer stations refuse optional echoes without any strokes',()=>{
  const stripe={coreExtent:1e20,segmentStart:1e20,segmentEnd:1e20+1e9};
  let sampled=0;
  const c=ctx();
  assert.equal(paintSandRibbonEchoes(c,stripe,1e21,styles(),
    ()=>{sampled++;return {x:0,y:0};},
    ()=>{sampled++;return {x:0,y:0};},
    ()=>{sampled++;return 50;}),0);
  assert.equal(sampled,0);
  assert.equal(c.events.length,0,'source-unsafe decorative paths draw no surrogate geometry');
});


test('same-gauge region filigree layers solve each real inset only once per paint',()=>{
  const rings=[square(0,0,170,110),square(55,36,99,75),
    square(200,28,240,65)];
  const bounds={left:-20,top:-20,right:260,bottom:145};
  let calls=0;
  const solve=(source,distance,options)=>{
    calls++;
    assert.equal(source,rings);
    assert.equal(options.bounds,bounds);
    assert.equal(options.resolution,1.5);
    assert.equal(options.padding,Math.max(18,distance*2));
    return [{closed:true,points:[...rings[0]]}];
  };
  const cache=new Map();
  const a=sandCachedInsetContours(cache,rings,5.5,bounds,solve);
  const b=sandCachedInsetContours(cache,rings,5.5,bounds,solve);
  const c=sandCachedInsetContours(cache,rings,8,bounds,solve);
  assert.equal(a,b,'identical inset and current source share the same exact contours');
  assert.notEqual(a,c,'a distinct metric inset must not reuse the wrong contour');
  assert.equal(calls,2);
  assert.equal(cache.size,2);

  const base=styles()[0],second={...base,
    dark:base.dark*.7,light:base.light*.8,seed:base.seed+11};
  const object={rings},pair=ctx(),first=ctx(),next=ctx();
  const paired=paintSandRegionEchoes(pair,object,[base,second],bounds);
  const aCount=paintSandRegionEchoes(first,object,[base],bounds);
  const bCount=paintSandRegionEchoes(next,object,[second],bounds);
  assert.equal(paired,aCount+bCount);
  const visible=ops=>ops.filter(x=>Array.isArray(x)&&
    ['move','line','stroke','arc'].includes(x[0]));
  assert.deepEqual(visible(pair.events),
    [...visible(first.events),...visible(next.events)],
    'reuse must preserve every original source path and the layer paint order');
});

test('different material gauges keep their independent metric inset geometry',()=>{
  const first=styles({textureScale:12})[0],
    second=styles({textureScale:92})[0];
  assert.notDeepEqual(first.insets,second.insets);
  const object={rings:[square(0,0,250,240)]},bounds={
    left:-10,top:-10,right:260,bottom:250
  };
  const a=ctx(),b=ctx();
  const count=paintSandRegionEchoes(a,object,[first,second],bounds);
  const separate=paintSandRegionEchoes(b,object,[first],bounds)+
    paintSandRegionEchoes(b,object,[second],bounds);
  assert.equal(count,separate);
});


test('multi-layer ribbon echoes reuse original source station geometry without changing stroke order',()=>{
  const base=styles({textureScale:42})[0];
  const finishes=[base,{...base,seed:base.seed+5,light:base.light*.7},
    {...styles({textureScale:68})[0],dark:.13}];
  const stripe={coreExtent:160,segmentStart:-160,segmentEnd:160};
  const range={start:-72,end:93},extent=160;
  const calls={width:0,centre:0,left:0,right:0};
  const pointAt=(station,side)=>{
    calls[side===-1?'left':'right']++;
    return {x:station,y:side*(24+2*Math.sin(station/30))};
  };
  const centreAt=station=>{calls.centre++;return {x:station,y:0};};
  const widthAtStation=station=>{
    calls.width++;return 48+4*Math.sin(station/30);
  };
  const full=ctx();
  const multiCount=paintSandRibbonEchoes(full,stripe,extent,finishes,
    pointAt,centreAt,widthAtStation,range);
  const fullCalls={...calls};
  const stationSpan=Math.floor((range.end+extent)/3.6)-
    Math.ceil((range.start+extent)/3.6)+1;
  assert.ok(stationSpan>25);
  assert.ok(fullCalls.width<=stationSpan,
    'source widths must be evaluated once per original station');
  assert.ok(fullCalls.centre<=stationSpan,
    'centres are shared across both sides and all material layers');
  assert.ok(fullCalls.left<=stationSpan&&fullCalls.right<=stationSpan,
    'each side-edge is evaluated at most once per original station');
  const separately=finishes.map(style=>{
    const canvas=ctx();
    const count=paintSandRibbonEchoes(canvas,stripe,extent,[style],
      (station,side)=>({x:station,y:side*(24+2*Math.sin(station/30))}),
      station=>({x:station,y:0}),
      station=>48+4*Math.sin(station/30),range);
    return {canvas,count};
  });
  assert.equal(multiCount,separately.reduce((n,p)=>n+p.count,0));
  const marks=events=>events.filter(op=>Array.isArray(op)&&
    ['move','line','stroke'].includes(op[0]));
  assert.deepEqual(marks(full.events),separately.flatMap(p=>marks(p.canvas.events)),
    'source point/path order and each style pigment must match independent painters');
});

test('cropped and pinched ribbon reuses only geometrically valid source stations',()=>{
  const stripe={coreExtent:150,segmentStart:-150,segmentEnd:150};
  const a=styles()[0];
  const make=range=>{
    const c=ctx();
    const count=paintSandRibbonEchoes(c,stripe,150,[a,a],(station,side)=>
      ({x:station,y:side*20}),station=>({x:station,y:0}),station=>
      station<-20||station>30?5:40,range);
    return {count,marks:c.events.filter(op=>Array.isArray(op)&&
      ['move','line','stroke'].includes(op[0]))};
  };
  const full=make(),subset=make({start:-19,end:29});
  assert.ok(subset.count>0);
  const stations=marks=>marks.filter(x=>x[0]==='move'||x[0]==='line')
    .map(x=>JSON.stringify(x.slice(1)));
  const all=new Set(stations(full.marks));
  assert.ok(stations(subset.marks).every(x=>all.has(x)),
    'all cropped rail stations must be selected from the full source lattice');
  assert.deepEqual(make({start:65,end:95}).marks,[]);
});
