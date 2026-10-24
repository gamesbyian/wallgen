import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeTextOverlays,newTextOverlay,MAX_TEXT_OVERLAYS} from '../src/text-overlays.js';
import {drawTextOverlays} from '../src/text-overlay-renderer.js';

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
  assert.equal(fills(small).length,7);
  assert.deepEqual(fills(small),fills(large));
  assert.deepEqual(fills(small).map(x=>x[4]),scene.stripes.map(x=>x.color));
  assert.equal(small.calls.filter(x=>x[0]==='stroke').length,7);
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
  assert.equal(tokens[0][1],'ONE');
  assert.equal(tokens[1][1],'TWO');
  assert.equal(tokens[0][4],scene.stripes[0].color);
  assert.equal(tokens[1][4],scene.stripes[1].color);
  assert.equal(ctx.calls.filter(x=>x[0]==='gradient')[0][2].length,7);
  assert.equal(tokens.at(-1)[4],'#000000');
  assert.equal(ctx.calls.filter(x=>x[0]==='stroke').length,0);
});
test('zero text does not touch 2D context',()=>{
  const ctx=fakeContext();
  drawTextOverlays(ctx,600,1300,resolveScene(normalizeRecipe()));
  assert.deepEqual(ctx.calls,[]);
});
