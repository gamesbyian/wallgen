import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeTextOverlays,newTextOverlay,MAX_TEXT_OVERLAYS,
  boundTextContent} from '../src/text-overlays.js';
import {textOverlayPaintsInk} from '../src/text-rainbow-shaping.js';
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

test('native whole-line Arabic rainbow maps logical first hue to the right edge',()=>{
  const scene=resolveScene(normalizeRecipe({seed:'arabic-rtl-colours',
    textOverlays:[{text:'سلام',font:'modern',colour:'rainbow-letter',
      outline:'none',size:75}]}));
  const ctx=fakeContext();
  drawTextOverlays(ctx,600,1300,scene);
  const gradients=ctx.calls.filter(c=>c[0]==='gradient');
  const fills=ctx.calls.filter(c=>c[0]==='fill');
  assert.equal(fills.length,1,'joining must keep the entire Arabic run shaped');
  assert.equal(fills[0][1],'سلام');
  assert.equal(gradients.length,1);
  const stops=gradients[0][2];
  assert.equal(stops[0][1],scene.stripes[3].color);
  assert.equal(stops.at(-1)[1],scene.stripes[0].color);
  assert.ok(stops.every((s,i)=>i===0||s[0]>=stops[i-1][0]));
});

test('canonical limit never leaves orphan combining marks or incomplete joined emoji',()=>{
  const plain='A'.repeat(159);
  const joined='👩‍🔬';
  assert.equal(boundTextContent(plain+joined+' HELLO'),plain,
    'joined emoji is omitted atomically if it would exceed 160 codepoints');
  assert.equal(boundTextContent(plain+'e\u0301'),plain,
    'base+combining grapheme must never be split');
  assert.equal(boundTextContent('A'.repeat(158)+'e\u0301'),'A'.repeat(158)+'e\u0301');
  assert.equal(boundTextContent('🌈'.repeat(160)),'🌈'.repeat(160));
  const recipe=normalizeRecipe({textOverlays:[{
    text:'B'.repeat(159)+'👨‍👩‍👧‍👦🌈',font:'modern'
  }]});
  assert.equal(recipe.textOverlays[0].text,'B'.repeat(159));
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe);
});
test('UTF-16 and multi-line boundaries remain bounded without fracturing graphemes',()=>{
  const long='🌈'.repeat(165);
  assert.equal([...boundTextContent(long)].length,160);
  assert.equal(boundTextContent('one\ntwo\nthree\nfour\nfive'),
    'one\ntwo\nthree\nfour');
  assert.equal(boundTextContent('one\r\ntwo\tthree'),'one\ntwo three');
  assert.equal(boundTextContent(null),'');
  assert.equal(boundTextContent(''), '');
  assert.equal(boundTextContent('A'.repeat(100000)).length,160);
});

test('Text textarea leaves UTF-16 room for complete joined emoji before canonical clipping',async()=>{
  const {readFileSync}=await import('node:fs');
  const markup=readFileSync(new URL('../src/text-overlays-ui.js',import.meta.url),'utf8');
  assert.match(markup,/maxlength="4096"/);
  assert.match(markup,/aria-describedby="textOverlayUnicodeLimit"/);
  const raw='A'.repeat(158)+'👩‍🔬';
  assert.equal(boundTextContent(raw),'A'.repeat(158),
    'complete joined emoji cannot squeeze into the remaining two codepoints');
  assert.equal(normalizeTextOverlays([{text:raw}])[0].text,'A'.repeat(158));
});

test('without Intl.Segmenter, 160-codepoint bound never saves half an accent, flag or joined emoji',()=>{
  const original=Object.getOwnPropertyDescriptor(Intl,'Segmenter');
  try{
    Object.defineProperty(Intl,'Segmenter',{value:undefined,
      configurable:true,writable:true});
    const base='A'.repeat(159);
    assert.equal(boundTextContent(base+'e\u0301'),base,
      'reject both base and combining mark when only one scalar remains');
    assert.equal(boundTextContent('A'.repeat(158)+'🇨🇦'),'A'.repeat(158)+'🇨🇦');
    assert.equal(boundTextContent(base+'🇨🇦'),base);
    assert.equal(boundTextContent('A'.repeat(157)+'👩‍🚀'),
      'A'.repeat(157)+'👩‍🚀','full joined cluster exactly fits 160 codepoints');
    assert.equal(boundTextContent('A'.repeat(158)+'👩‍🚀'),'A'.repeat(158),
      'never save a half-joined emoji just to reach 160');
    assert.equal(boundTextContent('A'.repeat(157)+'🧑🏽‍💻'),'A'.repeat(157));
    const scene=normalizeRecipe({textOverlays:[{
      id:'safe',text:'A'.repeat(158)+'👩‍🚀'
    }]});
    assert.equal(scene.textOverlays[0].text,'A'.repeat(158));
    assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(scene))),scene);
    assert.equal(boundTextContent('B'.repeat(160)),'B'.repeat(160));
  }finally{
    if(original)Object.defineProperty(Intl,'Segmenter',original);
    else delete Intl.Segmenter;
  }
});


test('pasted Unicode paragraph and line separators become real bounded canonical lines',()=>{
  const pasted='A\u2028B\u2029C\u0085D';
  const canonical='A\nB\nC\nD';
  assert.equal(boundTextContent(pasted),canonical,
    'U+2028, U+2029, and U+0085 must count as the actual four lines');
  assert.equal(boundTextContent(pasted+'\rE'),canonical,
    'the fifth logical line is refused rather than silently painted inline');
  assert.equal(boundTextContent('A\r\nB\rC\nD'),'A\nB\nC\nD',
    'Windows CRLF and legacy Mac CR normalize to one LF each');
  const recipe=normalizeRecipe({textOverlays:[{id:'pasted',
    font:'modern',text:pasted+'\u2028E',colour:'white',outline:'none'}]});
  assert.equal(recipe.textOverlays[0].text,canonical);
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe,
    'canonical recipe and JSON round-trip keep normalized line boundaries');
  const ctx=fakeContext();
  drawTextOverlays(ctx,600,1300,resolveScene(recipe));
  assert.deepEqual(ctx.calls.filter(call=>call[0]==='fill').map(call=>call[1]),
    ['A','B','C','D'],'real painter must render exactly four separate native lines');
});


test('4,096-unit raw guard never saves an orphan surrogate or severed combining cluster',()=>{
  const removable='\u007f'.repeat(3936),head='A'.repeat(159);
  const cases=[
    removable+head+'e\u0301',
    removable+head+'🌈',
    removable+head+'👩‍🚀',
    removable+head+'🧑🏽‍💻'
  ];
  const run=()=>{
    for(const input of cases){
      assert.ok(input.length>4096);
      const text=boundTextContent(input);
      assert.equal(text,head,
        'raw guard must drop incomplete final grapheme after removable controls');
      const recipe=normalizeRecipe({textOverlays:[{text:input}]});
      assert.equal(recipe.textOverlays[0].text,head);
      assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe);
    }
    assert.equal(boundTextContent(removable+'A'.repeat(160)+'B'),'A'.repeat(160),
      'complete grapheme ending at unit 4096 remains accepted');
  };
  run();
  const descriptor=Object.getOwnPropertyDescriptor(Intl,'Segmenter');
  try{
    Object.defineProperty(Intl,'Segmenter',{value:undefined,
      configurable:true,writable:true});
    run();
  }finally{
    if(descriptor)Object.defineProperty(Intl,'Segmenter',descriptor);
    else delete Intl.Segmenter;
  }
});

test('fully transparent or non-ink text has no renderer work or font dependency',()=>{
  const invisible=resolveScene(normalizeRecipe({textOverlays:[
    {text:'NO INK',font:'pack-bangers',opacity:0},
    {text:'\u200b\u2060',font:'pack-pacifico',opacity:1},
    {text:'DISABLED',font:'pack-bangers',enabled:false}
  ]}));
  const ctx=fakeContext();
  drawTextOverlays(ctx,600,1300,invisible);
  assert.deepEqual(ctx.calls,[],
    'zero-pixel artwork cannot demand unavailable fonts or paint offscreen');
  assert.equal(invisible.textOverlays.every(item=>!textOverlayPaintsInk(item)),true);
  const exposed=resolveScene(normalizeRecipe({textOverlays:[
    {text:'VISIBLE',font:'modern',opacity:.01},
    {text:'INVISIBLE',font:'modern',opacity:0}
  ]}));
  const canvas=fakeContext();drawTextOverlays(canvas,600,1300,exposed);
  assert.deepEqual(canvas.calls.filter(c=>c[0]==='fill').map(c=>c[1]),['VISIBLE']);
});

test('malformed imported UTF-16 is repaired without corrupting genuine emoji graphemes',()=>{
  const raw='A\ud800B\udc00C🌈👩‍🚀🇨🇦D';
  const fixed=boundTextContent(raw);
  assert.equal(fixed,'A\ufffdB\ufffdC🌈👩‍🚀🇨🇦D');
  assert.equal(/[\ud800-\udfff]/gu.test(fixed),false,
    'no lone surrogate may persist into PNG metadata or JSON');
  const recipe=normalizeRecipe({textOverlays:[{text:raw,font:'modern'}]});
  assert.equal(recipe.textOverlays[0].text,fixed);
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(recipe))),recipe);
  assert.equal(boundTextContent('🌈👩‍🚀🇨🇦'),'🌈👩‍🚀🇨🇦',
    'valid supplementary characters and joined emoji remain byte-identical');
  const source='Z'.repeat(159)+'\ud800🌈';
  assert.equal(boundTextContent(source),'Z'.repeat(159)+'\ufffd',
    'the 160-codepoint limit still retains only complete trailing graphemes');
});
