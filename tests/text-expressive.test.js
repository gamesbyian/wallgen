import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeTextOverlays} from '../src/text-overlays.js';
import {drawTextOverlays} from '../src/text-overlay-renderer.js';
import {measuredTextBounds} from '../src/text-direct-geometry.js';

function fake(){
  const calls=[],states=[];
  const ctx={calls,font:'',letterSpacing:'0px',shadowColor:'rgba(0,0,0,0)',
    shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0,globalAlpha:1,fillStyle:'',
    strokeStyle:'',
    save(){
      states.push({font:this.font,letterSpacing:this.letterSpacing,
        shadowColor:this.shadowColor,shadowBlur:this.shadowBlur,
        shadowOffsetX:this.shadowOffsetX,shadowOffsetY:this.shadowOffsetY});
    },
    restore(){Object.assign(this,states.pop());},
    scale(...args){calls.push(['scale',...args]);},
    translate(...args){calls.push(['translate',...args]);},
    rotate(...args){calls.push(['rotate',...args]);},
    measureText(t){return {width:[...t].length*12};},
    fillText(text,x,y){calls.push(['fill',text,x,y,this.letterSpacing,this.shadowColor,
      this.shadowBlur,this.shadowOffsetX,this.fillStyle]);},
    strokeText(text,x,y){calls.push(['stroke',text,x,y,this.shadowColor]);},
    createLinearGradient(){
      const stops=[];calls.push(['gradient',stops]);
      return {addColorStop(offset,colour){stops.push([offset,colour])}};
    },
  };
  return ctx;
}
test('style is opt-in, bounded and round-trips without disturbing legacy recipes',()=>{
  const legacy=normalizeTextOverlays([{text:'HELLO'}])[0];
  for(const key of ['letterSpacing','lineSpacing','rainbowOffset','rainbowReverse',
    'shadow','shadowBlur','shadowDistance'])
    assert.ok(!Object.hasOwn(legacy,key),key+' is dormant by default');
  const recipe=normalizeRecipe({textOverlays:[{text:'A🌈e\u0301',letterSpacing:900,
    lineSpacing:-900,rainbowOffset:99,rainbowReverse:true,
    shadow:'black',shadowBlur:99,shadowDistance:-9}]});
  const item=recipe.textOverlays[0];
  assert.equal(item.letterSpacing,18);
  assert.equal(item.lineSpacing,-20);
  assert.equal(item.rainbowOffset,6);
  assert.equal(item.rainbowReverse,true);
  assert.equal(item.shadow,'black');
  assert.equal(item.shadowBlur,16);
  assert.equal(item.shadowDistance,0);
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe);
  const noShadow=normalizeTextOverlays([{...item,shadow:'none'}])[0];
  assert.ok(!Object.hasOwn(noShadow,'shadow'));
  assert.ok(!Object.hasOwn(noShadow,'shadowBlur'));
});
test('native tracking and shadow keep native whole Arabic and combining-line paint',()=>{
  const recipe=normalizeRecipe({textOverlays:[{
    text:'السَّلَامُ 🌈 e\u0301',font:'modern',colour:'white',outline:'black',
    letterSpacing:2,lineSpacing:20,shadow:'black',
    shadowDistance:7,shadowBlur:6
  }]});
  const ctx=fake();drawTextOverlays(ctx,600,1300,resolveScene(recipe));
  const fills=ctx.calls.filter(c=>c[0]==='fill');
  const strokes=ctx.calls.filter(c=>c[0]==='stroke');
  assert.equal(fills.length,1,'one whole native-shaped line');
  assert.equal(strokes.length,1);
  assert.equal(fills[0][4],'2px');
  assert.equal(fills[0][5],'rgba(0,0,0,.86)');
  assert.equal(fills[0][6],6);
  assert.equal(fills[0][7],7);
  assert.equal(strokes[0][4],'rgba(0,0,0,0)',
    'outline cannot cast a second doubled shadow');
});
test('rainbow offset and reversal use live palette, without restyling global stripes',()=>{
  const recipe=normalizeRecipe({reverseStripes:true,textOverlays:[{
    text:'RED GREEN',colour:'rainbow-word',rainbowOffset:2,rainbowReverse:true,
    shadow:'none',outline:'none'}]});
  const scene=resolveScene(recipe),original=scene.stripes.map(s=>s.color);
  const ctx=fake();drawTextOverlays(ctx,600,1300,scene);
  const gradients=ctx.calls.filter(c=>c[0]==='gradient');
  assert.equal(gradients.length,1);
  assert.equal(gradients[0][1][0][1],original.at(-3));
  assert.deepEqual(scene.stripes.map(s=>s.color),original);
});
test('line leading changes vertical station, including derived hit guides',()=>{
  const regular={text:'FIRST\nSECOND',size:50,x:50,y:50};
  const tall={...regular,lineSpacing:75,letterSpacing:5};
  const a=measuredTextBounds(regular,t=>t.length*12);
  const b=measuredTextBounds(tall,t=>t.length*12);
  assert.ok(b.height>a.height*1.7);
  assert.ok(b.width>a.width);
  const ctx=fake();
  const scene=resolveScene(normalizeRecipe({textOverlays:[{...tall,colour:'black'}]}));
  drawTextOverlays(ctx,600,1300,scene);
  const translations=ctx.calls.filter(c=>c[0]==='translate');
  assert.ok(translations.some(c=>c[2]>0));
  assert.ok(translations.some(c=>c[2]<0));
});
test('curved native tracking remains bounded and painter follows resolution-scale shadow',()=>{
  const recipe=normalizeRecipe({textOverlays:[{
    text:'CURVE 🌈',path:'wave',pathHeight:80,
    letterSpacing:3,rainbowOffset:4,colour:'rainbow-letter',
    shadow:'white',shadowBlur:5,shadowDistance:8,outline:'black'}]});
  const small=fake(),large=fake();
  drawTextOverlays(small,600,1300,resolveScene(recipe));
  drawTextOverlays(large,3024,6552,resolveScene(recipe));
  const fills=small.calls.filter(c=>c[0]==='fill');
  assert.ok(fills.length>4);
  assert.ok(fills.every(c=>c[4]==='3px'&&c[5]==='rgba(255,255,255,.86)'));
  const largeFill=large.calls.find(c=>c[0]==='fill');
  assert.ok(largeFill[6]>fills[0][6]*4.5);
  assert.ok(largeFill[7]>fills[0][7]*4.5);
});
