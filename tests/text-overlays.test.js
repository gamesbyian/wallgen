import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeTextOverlays,newTextOverlay,MAX_TEXT_OVERLAYS} from '../src/text-overlays.js';
import {drawTextOverlays} from '../src/text-overlay-renderer.js';
import {randomizeScope} from '../src/scoped-random.js';
import {randomizeAllRecipe} from '../src/model.js';

function fakeContext(){
  const calls=[];
  const ctx={calls,fillStyle:'',strokeStyle:'',globalAlpha:1,
    save(){calls.push(['save']);},restore(){calls.push(['restore']);},
    scale(...v){calls.push(['scale',...v]);},translate(...v){calls.push(['translate',...v]);},
    rotate(v){calls.push(['rotate',v]);},
    measureText(s){return {width:Array.from(s).length*10};},
    strokeText(text,x,y){calls.push(['stroke',text,x,y,this.strokeStyle]);},
    fillText(text,x,y){calls.push(['fill',text,x,y,this.fillStyle]);},
    createLinearGradient(...p){
      const stops=[];calls.push(['gradient',p,stops]);
      return {addColorStop(t,c){stops.push([t,c]);}};
    },
  };
  return ctx;
}
test('text objects normalize to a small stable transferable canonical recipe',()=>{
  const dirty=Array.from({length:MAX_TEXT_OVERLAYS+3},(_,i)=>({
    id:'duplicate',text:'🌈 Line\nSecond',x:-100,y:200,size:999,
    rotation:999,font:'url(javascript:bad)',outline:'hotpink',colour:'bad',opacity:5
  }));
  const normalized=normalizeTextOverlays(dirty);
  assert.equal(normalized.length,MAX_TEXT_OVERLAYS);
  assert.equal(new Set(normalized.map(x=>x.id)).size,MAX_TEXT_OVERLAYS);
  assert.equal(normalized[0].x,0);
  assert.equal(normalized[0].y,100);
  assert.equal(normalized[0].size,180);
  assert.equal(normalized[0].rotation,180);
  assert.equal(normalized[0].font,'bold');
  assert.equal(normalized[0].outline,'black');
  assert.equal(normalized[0].opacity,1);
  assert.deepEqual(normalizeTextOverlays(normalized),normalized);
  assert.equal(newTextOverlay('my-text').id,'my-text');
  assert.equal(normalizeTextOverlays([{text:''}]).length,0);
});
test('text objects are owned by canonical recipes and the scene, not sidecar DOM data',()=>{
  const recipe=normalizeRecipe({seed:'text-test',textOverlays:[{
    id:'message',text:'Hello 🌈',colour:'rainbow-word',font:'editorial',
    size:80,x:33,y:72,rotation:-18,outline:'white',outlineWidth:8
  }]});
  assert.deepEqual(resolveScene(recipe).textOverlays,recipe.textOverlays);
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe);
  assert.ok(!('textOverlays' in normalizeRecipe()),'blank designs do not grow an inactive text key');
});
test('per-letter cycles the live rainbow palette at preview and export sizes',()=>{
  const scene=resolveScene(normalizeRecipe({textOverlays:[{
    id:'a',text:'RAINBOW',colour:'rainbow-letter',outline:'white'
  }]}));
  const small=fakeContext(),large=fakeContext();
  drawTextOverlays(small,600,1300,scene);
  drawTextOverlays(large,3024,6552,scene);
  const fills=c=>c.calls.filter(x=>x[0]==='fill');
  assert.equal(fills(small).length,1,'native glyph shaping must paint a line only once');
  assert.equal(fills(small)[0][1],'RAINBOW');
  assert.deepEqual(fills(small).map(x=>x.slice(0,4)),fills(large).map(x=>x.slice(0,4)));
  const gradients=small.calls.filter(x=>x[0]==='gradient');
  assert.equal(gradients.length,1);
  assert.deepEqual(gradients[0][2].filter((_,i)=>i%2===0).slice(0,7)
    .map(s=>s[1]),scene.stripes.map(x=>x.color));
  assert.equal(small.calls.filter(x=>x[0]==='stroke').length,1);
  assert.deepEqual(small.calls.filter(x=>x[0]==='scale')[0],['scale',1,1]);
  assert.deepEqual(large.calls.filter(x=>x[0]==='scale')[0],['scale',3024/600,6552/1300]);
});
test('per-word counts actual words, gradients draw seven stops, black has no strokes',()=>{
  const scene=resolveScene(normalizeRecipe({textOverlays:[
    {id:'one',text:'ONE TWO',colour:'rainbow-word',outline:'none'},
    {id:'two',text:'RNBW',colour:'rainbow-gradient',outline:'none'},
    {id:'three',text:'Hi',colour:'black',outline:'none'},
  ]}));
  const ctx=fakeContext();
  drawTextOverlays(ctx,600,1300,scene);
  const tokens=ctx.calls.filter(x=>x[0]==='fill'&&x[1].trim());
  assert.deepEqual(tokens.map(x=>x[1]),['ONE TWO','RNBW','Hi']);
  const gradients=ctx.calls.filter(x=>x[0]==='gradient');
  assert.equal(gradients.length,2);
  assert.equal(gradients[0][2][0][1],scene.stripes[0].color);
  assert.equal(gradients[0][2].at(-1)[1],scene.stripes[1].color);
  assert.equal(gradients[1][2].length,7);
  assert.equal(tokens.at(-1)[4],'#000000');
  assert.equal(ctx.calls.filter(x=>x[0]==='stroke').length,0);
});
test('zero text does not touch 2D context',()=>{
  const ctx=fakeContext();
  drawTextOverlays(ctx,600,1300,resolveScene(normalizeRecipe()));
  assert.deepEqual(ctx.calls,[]);
});

test('Text tool rerolls style, protects locked object and every letter',()=>{
  const input=normalizeRecipe({seed:'hello',textOverlays:[
    {id:'free',text:'Do not rewrite me',font:'bold',colour:'black'},
    {id:'locked',text:'Nor me',font:'editorial',colour:'white',locked:true},
  ]});
  const {recipe,modified}=randomizeScope(input,{scope:'tool',name:'typography',seed:'text-roll'});
  assert.ok(modified.includes('textOverlays'));
  assert.equal(recipe.textOverlays[0].text,input.textOverlays[0].text);
  assert.notEqual(recipe.textOverlays[0].font,input.textOverlays[0].font);
  assert.deepEqual(recipe.textOverlays[1],input.textOverlays[1]);
  assert.deepEqual(input.textOverlays.map(x=>x.text),
    normalizeRecipe({...randomizeAllRecipe({}),textOverlays:input.textOverlays}).textOverlays.map(x=>x.text));
});
