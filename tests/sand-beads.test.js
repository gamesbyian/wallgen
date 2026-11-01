import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {contourBoundaryFrame} from '../src/contour-decoration.js';
import {sandBeadStyles,forEachRingBead,forEachRailBead,
  paintSandRegionBeads,paintSandNestedBeads} from '../src/sand-beads.js';
import {readFileSync} from 'node:fs';

const fixture=(more={})=>resolveScene(normalizeRecipe({
  seed:'beaded-sand-test',material:'sand-beaded',textureCoverage:'stripes',
  textureStrength:75,textureScale:30,...more}));
const sq=(x0,y0,x1,y1)=>[
  {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
test('beaded sand is opt-in and round trips through all three material slots',()=>{
  const r=normalizeRecipe({material:'sand-beaded',textureCoverage:'stripes',
    textureLayer2Enabled:true,material2:'sand-beaded',
    textureLayer3Enabled:true,material3:'sand-beaded'});
  assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
  assert.deepEqual(resolveScene(r).textureLayers.map(x=>x.material),
    ['sand-beaded','sand-beaded','sand-beaded']);
  assert.equal(sandBeadStyles(fixture()).length,1);
  assert.notEqual(sandBeadStyles(fixture({seed:'independent-beads'}))[0].phase,
    sandBeadStyles(fixture())[0].phase);
  assert.equal(sandBeadStyles(fixture({material:'sand-mandala'})).length,0);
  assert.equal(sandBeadStyles(fixture({textureCoverage:'background'})).length,0);
  assert.equal(sandBeadStyles(fixture({textureStrength:0})).length,0);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/<option value="sand-beaded">/g)||[]).length,3);
});
test('perimeter stations use stable canonical original rings, holes and islands',()=>{
  const outer=sq(0,0,80,80),hole=sq(25,25,50,50),island=sq(100,15,130,45);
  const first=contourBoundaryFrame([outer,hole,island]);
  const reversed=contourBoundaryFrame([island.slice().reverse(),hole.slice().reverse(),outer.slice().reverse()]);
  const positions=frames=>{
    const pts=[];forEachRingBead(frames,7,(x,y,ring,i)=>
      pts.push([+x.toFixed(6),+y.toFixed(6),ring,i]));
    return pts;
  };
  assert.deepEqual(positions(first),positions(reversed));
  assert.ok(positions(first).length>70);
  assert.notDeepEqual(positions(first).filter(v=>v[2]===0),
    positions(first).filter(v=>v[2]===1));
});
test('rail lattice preserves bead identity during clipped crossing branch replay',()=>{
  const stripe={coreExtent:200,segmentStart:-200,segmentEnd:200};
  const style={interval:13};
  const pointAt=(x,side)=>({x,y:side*8+x*.05});
  const sample=range=>{
    const p=[];forEachRailBead(stripe,200,style,pointAt,
      (x,y,side,index)=>p.push([x,y,side,index]),range);
    return p;
  };
  const full=sample(),part=sample({start:-41,end:78});
  assert.ok(part.length>5);
  for(const bead of part)assert.ok(full.some(x=>JSON.stringify(x)===JSON.stringify(bead)));
});
test('physical bead marks use only clipped Canvas2D and keep nested width',()=>{
  const events=[],ctx={save(){events.push('save')},restore(){events.push('restore')},
    beginPath(){},arc(x,y,r){events.push(['arc',x,y,r])},
    fill(){events.push('fill')}};
  const region={rings:[sq(0,0,80,80),sq(25,25,50,50)]};
  const style=sandBeadStyles(fixture());
  assert.ok(paintSandRegionBeads(ctx,region,style)>20);
  assert.equal(events[0],'save');
  assert.equal(events.at(-1),'restore');
  events.length=0;
  assert.ok(paintSandNestedBeads(ctx,{closed:true,points:sq(0,0,80,80)},2,style)>0);
  assert.ok(events.filter(x=>Array.isArray(x)).every(x=>x[3]<=.76));
  assert.equal(paintSandNestedBeads(ctx,{closed:false,points:sq(0,0,80,80)},2,style),0);
});


test('extreme finite rail coordinates never create a nonprogressing station loop',()=>{
  let visited=0;
  const stripe={coreExtent:1e20,segmentStart:1e20,segmentEnd:1e20+1e9};
  forEachRailBead(stripe,1e21,{interval:13},
    ()=>{visited++;return {x:0,y:0};},()=>{visited++;});
  assert.equal(visited,0,'unsafe source station indices must be refused');
  let normal=0;
  forEachRailBead({coreExtent:200,segmentStart:-200,segmentEnd:200},
    200,{interval:13},(x,side)=>({x,y:side}),()=>normal++);
  assert.ok(normal>10,'safe source-anchored beads remain unchanged');
});


test('three beaded material layers reuse one perimeter with exactly unchanged mark order',()=>{
  const s=sandBeadStyles(resolveScene(normalizeRecipe({
    seed:'perimeter-reuse-compound',material:'sand-beaded',
    textureCoverage:'stripes',textureScale:36,textureStrength:85,
    textureLayer2Enabled:true,material2:'sand-beaded',
    textureCoverage2:'stripes',textureScale2:36,textureStrength2:70,
    textureLayer3Enabled:true,material3:'sand-beaded',
    textureCoverage3:'stripes',textureScale3:60,textureStrength3:55,
  })));
  assert.equal(s.length,3);
  const object={rings:[sq(0,0,90,90),sq(30,30,60,60),sq(105,5,130,35)]};
  const canvas=()=>({
    events:[],
    save(){this.events.push(['save'])},
    restore(){this.events.push(['restore'])},
    beginPath(){this.events.push(['begin'])},
    arc(x,y,r){this.events.push(['arc',x,y,r,this.fillStyle])},
    fill(){this.events.push(['fill'])}
  });
  const whole=canvas();
  const combined=paintSandRegionBeads(whole,object,s);
  const partials=s.map(style=>{
    const c=canvas();
    const count=paintSandRegionBeads(c,object,[style]);
    return {events:c.events,count};
  });
  assert.ok(combined>50);
  assert.equal(combined,partials.reduce((n,p)=>n+p.count,0));
  const visible=events=>events.filter(e=>['arc','fill'].includes(e[0]));
  assert.deepEqual(visible(whole.events),
    partials.flatMap(p=>visible(p.events)),
    'one source perimeter must preserve each seeded layer phase and paint order');
  assert.ok(somePhaseDifference(s),'distinct material layers must keep independent bead phases');
  const source=readFileSync(new URL('../src/sand-beads.js',import.meta.url),'utf8');
  assert.equal((source.match(/contourBoundaryFrame\(rings\)/g)||[]).length,1,
    'region source ring framing belongs outside the material-layer loop');
});

function somePhaseDifference(styles){
  return styles.some(style=>style.phase!==styles[0].phase);
}

test('circular region beads remain analytic and match independent layer painters',()=>{
  const s=sandBeadStyles(fixture()),circle={circle:{cx:20,cy:40,r:18}};
  const canvas=()=>({events:[],
    save(){},restore(){},beginPath(){},
    arc(x,y,r){this.events.push([x,y,r,this.fillStyle])},
    fill(){}
  });
  const a=canvas(),b=canvas();
  assert.equal(paintSandRegionBeads(a,circle,[s[0],s[0]]),
    2*paintSandRegionBeads(b,circle,[s[0]]));
  assert.deepEqual(a.events,[...b.events,...b.events]);
});
