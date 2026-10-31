import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe} from '../src/model.js';
import {textInkSelectionReach,DUAL_TEXT_OUTLINE_STROKE_MULTIPLIER} from '../src/text-overlays.js';
import {availableTextWidth,designPointFromPointer,measuredTextBounds,
  hitTextOverlay,dragTextOverlay,dragTextTransform,transformTextOverlay,
  measureCanvasText,textGestureOwnsCurrentRecipe} from '../src/text-direct-geometry.js';
import {layoutTextOnPath,hitTextAtLayout} from '../src/text-path-geometry.js';

const sample=normalizeRecipe({textOverlays:[
 {id:'back',text:'ABCD',x:50,y:50,size:60,rotation:0,outline:'black'},
 {id:'front',text:'XY',x:50,y:50,size:65,rotation:45,outline:'white'},
 {id:'locked',text:'LOCK',x:25,y:30,size:44,locked:true}
]});
const measure=(item,value)=>value.length*item.size*.55;
test('pointer coordinates respect actual CSS-scaled portrait canvas without changing recipe geometry',()=>{
 const canvas={getBoundingClientRect:()=>({left:20,top:30,width:300,height:650})};
 assert.deepEqual(designPointFromPointer({clientX:170,clientY:355},canvas),{x:300,y:650});
 assert.deepEqual(designPointFromPointer({clientX:20,clientY:30},canvas),{x:0,y:0});
});
test('bounds use renderer\'s canonical 94%-width shrink and authored multiline rhythm',()=>{
 const item={text:'X'.repeat(100)+'\nY',size:60};
 const bounds=measuredTextBounds(item,s=>s.length*10);
 assert.equal(bounds.width,564);
 assert.ok(Math.abs(bounds.height-140.4)<1e-9);
});
test('text handle guides match supported and unsupported native Canvas tracking',()=>{
  const item={text:'ABCD',size:50,x:50,letterSpacing:14};
  const ctx={font:'initial',save(){},restore(){},
    measureText(text){return {width:text.length*12}}};
  const measure=value=>measureCanvasText(ctx,'bold 50px test',item,value);
  assert.equal(measure('ABCD'),48,'fake canvas lacks native Canvas tracking');
  assert.equal(measuredTextBounds(item,measure).width,104,
    'default behavior retains existing tracked bounds');
  assert.equal(measuredTextBounds(item,measure,{nativeTracking:false}).width,48,
    'unsupported tracking cannot shift on-canvas grips away from ink');
  assert.equal(measuredTextBounds(item,measure,{nativeTracking:true}).width,104);
  assert.equal(measuredTextBounds({...item,path:'wave',pathHeight:80},measure,
    {nativeTracking:false}).width,48,'curve guide uses the same native capability');
  assert.equal(measuredTextBounds({...item,letterSpacing:0},measure,
    {nativeTracking:false}).width,48);
});
test('live text editor supplies actual Canvas tracking support to guide geometry',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
  assert.match(source,/nativeTracking:'letterSpacing' in fontContext/,
    'runtime transform guides must respect painter tracking capability');
});
test('topmost text wins overlap hit-test, rotated bbox and off-glyph misses are honored',()=>{
 const list=sample.textOverlays;
 const picked=hitTextOverlay(list,{x:300,y:650},measure);
 assert.equal(picked.id,'front');
 assert.equal(hitTextOverlay(list,{x:0,y:0},measure),null);
 // A 45° banner extends diagonally farther than an unrotated tight box.
 const sole=[list[1]];
 assert.equal(hitTextOverlay(sole,{x:322,y:672},measure)?.id,'front');
 assert.equal(hitTextOverlay(sole,{x:390,y:650},measure),null);
});
test('release changes only selected X/Y once, maintaining all other text objects',()=>{
 const after=dragTextOverlay(sample,'front',{x:60,y:-130});
 assert.notEqual(after,sample);
 assert.equal(after.textOverlays[1].x,60);
 assert.equal(after.textOverlays[1].y,40);
 assert.deepEqual(after.textOverlays[0],sample.textOverlays[0]);
 assert.deepEqual(after.textOverlays[2],sample.textOverlays[2]);
 assert.equal(after.textOverlays[1].text,sample.textOverlays[1].text);
 assert.equal(after.textOverlays[1].rotation,45);
 assert.equal(after.textOverlays[1].font,sample.textOverlays[1].font);
 assert.equal(dragTextOverlay(sample,'front',{x:0,y:0}),sample);
});
test('locked or invalid gestures do not mutate the canonical recipe',()=>{
 assert.equal(dragTextOverlay(sample,'locked',{x:100,y:100}),sample);
 assert.equal(dragTextOverlay(sample,'missing',{x:100,y:100}),sample);
 assert.equal(dragTextOverlay(sample,'front',{x:NaN,y:100}),sample);
 const clamped=dragTextOverlay(sample,'front',{x:9999,y:-9999});
 assert.equal(clamped.textOverlays[1].x,100);
 assert.equal(clamped.textOverlays[1].y,0);
});

test('off-centre long phrases narrow to the available wallpaper frame',()=>{
  assert.equal(availableTextWidth({x:50}),564);
  assert.equal(availableTextWidth({x:63}),432);
  assert.equal(availableTextWidth({x:97}),24);
  const item={x:63,text:'X'.repeat(90),size:60};
  const bounds=measuredTextBounds(item,s=>s.length*10);
  assert.equal(bounds.width,432);
  const rightmost=600*.63+bounds.width/2;
  assert.ok(rightmost<=600-5,'text should stay within the right edge after movement');
});

test('scaling is relative to canonical anchor, clamps 12–180 and changes only size',()=>{
  const item=sample.textOverlays[1];
  const origin={x:600*item.x/100,y:1300*item.y/100};
  const start={x:origin.x+70,y:origin.y};
  const current={x:origin.x+140,y:origin.y};
  const result=dragTextTransform(sample,'front','scale',start,current);
  assert.equal(result.textOverlays[1].size,130);
  assert.equal(result.textOverlays[1].rotation,45);
  assert.equal(result.textOverlays[1].text,item.text);
  assert.deepEqual(result.textOverlays[0],sample.textOverlays[0]);
  assert.equal(dragTextTransform(sample,'front','scale',start,
    {x:origin.x+1000,y:origin.y}).textOverlays[1].size,180);
  assert.equal(dragTextTransform(sample,'front','scale',start,
    {x:origin.x+1,y:origin.y}).textOverlays[1].size,12);
});
test('rotating one handle keeps text anchor stable, wraps across ±180 and respects locks',()=>{
  const item=sample.textOverlays[1];
  const origin={x:600*item.x/100,y:1300*item.y/100};
  const result=dragTextTransform(sample,'front','rotate',
    {x:origin.x+100,y:origin.y},{x:origin.x,y:origin.y+100});
  assert.equal(result.textOverlays[1].rotation,135);
  assert.equal(result.textOverlays[1].size,item.size);
  assert.equal(result.textOverlays[1].x,item.x);
  assert.equal(result.textOverlays[1].y,item.y);
  assert.equal(transformTextOverlay(sample,'front',{rotation:185}).textOverlays[1].rotation,-175);
  assert.equal(transformTextOverlay(sample,'front',{size:65,rotation:45}),sample);
  assert.equal(transformTextOverlay(sample,'locked',{size:155,rotation:100}),sample);
  assert.equal(dragTextTransform(sample,'locked','rotate',{x:100,y:100},{x:200,y:200}),sample);
});
test('invalid transform gestures are no-op; zero-distance handle cannot jump',()=>{
  assert.equal(dragTextTransform(sample,'front','rotate',null,{x:1,y:2}),sample);
  assert.equal(dragTextTransform(sample,'front','skew',{x:1,y:2},{x:2,y:3}),sample);
  assert.equal(dragTextTransform(sample,'front','scale',{x:300,y:650},{x:400,y:650}),sample);
  assert.equal(transformTextOverlay(sample,'front',{size:Infinity,rotation:NaN}),sample);
});

test('native Canvas tracking aligns curved glyph picks with painted stations',()=>{
  // Before the fix, the direct pointer adapter used untracked measureText for
  // layout while the painter used a tracked Canvas2D context. A long line
  // can miss by ~100 design px, far outside even a touch tolerance.
  const states=[];
  const ctx={
    font:'initial',letterSpacing:'0px',
    save(){states.push([this.font,this.letterSpacing]);},
    restore(){[this.font,this.letterSpacing]=states.pop();},
    measureText(text){
      return {width:[...text].length*(10+(parseFloat(this.letterSpacing)||0))};
    },
  };
  const item={id:'tracked',text:'WWWWWWWWWWWW',enabled:true,
    x:50,y:50,size:40,rotation:0,outline:'none',
    path:'wave',pathHeight:20,letterSpacing:18};
  const font='bold 40px test';
  const natural=(text,value)=>measureCanvasText(ctx,font,text,value);
  const tracked=(text,value)=>measureCanvasText(ctx,font,text,value,{tracking:true});
  const rendered=layoutTextOnPath(item,item.text,unit=>tracked(item,unit));
  assert.equal(rendered.supported,true);
  assert.equal(rendered.total,336);
  const last=rendered.glyphs.at(-1);
  const ink={x:300+last.x,y:650+last.y};
  assert.equal(hitTextAtLayout([item],ink,natural),null,
    'old untracked hit stations miss a painted outer letter');
  assert.equal(hitTextAtLayout([item],ink,tracked)?.id,'tracked',
    'native tracked selection must hit what the compositor paints');
  assert.equal(measuredTextBounds(item,value=>natural(item,value)).width,336,
    'visual guide uses natural run + tracking once, not twice');
  assert.equal(ctx.font,'initial');
  assert.equal(ctx.letterSpacing,'0px');
});
test('selection metric stays native when letterSpacing is unsupported or absent',()=>{
  const states=[];
  const ctx={font:'baseline',save(){states.push(this.font);},
    restore(){this.font=states.pop();},
    measureText(text){return {width:text.length*11};}};
  const item={letterSpacing:18};
  assert.equal(measureCanvasText(ctx,'bold 30px test',item,'AB',{tracking:true}),22);
  assert.equal(ctx.font,'baseline');
  assert.equal(measureCanvasText(ctx,'bold 30px test',{},'AB',{tracking:true}),22);
});

test('two-ring painted outer edge remains selectable, including generic rotated-guide geometry',()=>{
  const item={id:'outline',enabled:true,text:'WIDE',x:50,y:50,
    size:180,rotation:0,outline:'black-white',outlineWidth:20};
  const inner=item.size*item.outlineWidth/100;
  const outerWidth=inner*DUAL_TEXT_OUTLINE_STROKE_MULTIPLIER;
  assert.equal(inner,36);
  assert.equal(outerWidth,90);
  assert.equal(textInkSelectionReach(item),45,'outer stroke extends half its lineWidth');
  assert.equal(textInkSelectionReach({...item,outline:'black'}),36,
    'ordinary single outline keeps the original generous pick margin');
  assert.equal(textInkSelectionReach({...item,outline:'none'}),0);
  for(const outline of ['black-white','white-black']){
    const both={...item,outline};
    const width=both.text.length*60;
    const visibleOuterInk={x:300+width/2+40,y:650};
    assert.ok(40>inner,'point was beyond the prior 36-unit margin');
    assert.ok(40<outerWidth/2,'point is within the painted 45-unit ring reach');
    assert.equal(hitTextOverlay([both],visibleOuterInk,(_item,t)=>t.length*60)?.id,
      both.id,'generic hit should reach what the double ring paints');
    assert.equal(hitTextAtLayout([both],visibleOuterInk,(_item,t)=>t.length*60)?.id,
      both.id,'on-canvas hit should reach visible double-ring ink');
  }
  const missed={x:300+item.text.length*60/2+46,y:650};
  assert.equal(hitTextOverlay([item],missed,(_item,t)=>t.length*60),null,
    'tap beyond the outer ring still misses');
  assert.equal(hitTextAtLayout([item],missed,(_item,t)=>t.length*60),null);
});

test('direct hit-testing ignores transparent and format-only top objects',()=>{
  const under={id:'under',enabled:true,text:'INK',x:50,y:50,size:60,
    rotation:0,outline:'none',opacity:1};
  const hidden={...under,id:'hidden',text:'GHOST',opacity:0};
  const mark={...under,id:'mark',text:'\u200b\u2060',opacity:1};
  const center={x:300,y:650};
  assert.equal(hitTextOverlay([under,hidden],center,measure)?.id,'under');
  assert.equal(hitTextOverlay([hidden],center,measure),null);
  assert.equal(hitTextOverlay([under,mark],center,measure)?.id,'under');
  assert.equal(hitTextOverlay([mark],center,measure),null);
  assert.equal(hitTextOverlay([{...hidden,opacity:.01}],center,measure)?.id,
    'hidden','a nonzero opacity is still selectable ink');
});

test('canvas mover maintains one actual-ink eligibility predicate across redraw and guides',async()=>{
  const {readFileSync}=await import('node:fs');
  const src=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
  assert.match(src,/if\(!active\|\|!textOverlayPaintsInk\(item\)\)/,
    'hidden selection must not leave a visible transform frame');
  assert.match(src,/const movable=\(recipe\.textOverlays\|\|\[\]\)\.some\(x=>textOverlayPaintsInk\(x\)&&!x\.locked\)/);
  assert.match(src,/if\(!movable\)\{\s*setActive\(false\);\s*button\.disabled=true;/);
  assert.doesNotMatch(src,/some\(x=>x\.enabled&&x\.text\)/,
    'weak truthy text test used to override the new hidden-text control');
});

test('stale text pointer gestures cannot replay an older recipe across Undo or locks',()=>{
  const original=normalizeRecipe({seed:'text-gesture-base',
    textOverlays:[{id:'title',text:'KEEP',locked:false,x:40,y:40}]});
  assert.equal(textGestureOwnsCurrentRecipe(original,original,'title'),true);
  const draft=dragTextOverlay(original,'title',{x:90,y:0});
  assert.notEqual(draft,original,'actual move may stage a draft');
  const intervening=normalizeRecipe({...original,
    lockedSettings:['structure'],textOverlays:[{
      ...original.textOverlays[0],locked:true
    }]});
  assert.equal(textGestureOwnsCurrentRecipe(original,intervening,'title'),false,
    'an intervening lock update wins over the old moving draft');
  const undoToSame=normalizeRecipe(original);
  assert.deepEqual(undoToSame,original);
  assert.notEqual(undoToSame,original);
  assert.equal(textGestureOwnsCurrentRecipe(original,undoToSame,'title'),false,
    'new canonical transaction owns the state even if data is identical');
  assert.equal(textGestureOwnsCurrentRecipe(original,original,'missing'),false);
  assert.equal(textGestureOwnsCurrentRecipe({...original,textOverlays:[
    {...original.textOverlays[0],locked:true}
  ]},original,'title'),false);
  assert.equal(textGestureOwnsCurrentRecipe(null,original,'title'),false);
});
test('canvas pointerup and transform pointerup recheck canonical ownership before commit',async()=>{
  const {readFileSync}=await import('node:fs');
  const src=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
  assert.match(src,/if\(drag&&!textGestureOwnsCurrentRecipe\(drag\.original,recipe,drag\.id\)\)/);
  assert.match(src,/if\(transformDrag&&!textGestureOwnsCurrentRecipe\(/);
  assert.match(src,/finished\.moved&&textGestureOwnsCurrentRecipe\(/);
  assert.match(src,/state\.next!==state\.original&&textGestureOwnsCurrentRecipe\(/);
  assert.equal((src.match(/textGestureOwnsCurrentRecipe\(/g)||[]).length,4);
});

test('touch scaling follows displayed CSS geometry when canvas and artwork aspect ratios differ',()=>{
  const item=sample.textOverlays[1];
  const centre={x:300,y:650};
  const start={x:400,y:650},end={x:300,y:750};
  const stretched=dragTextTransform(sample,'front','scale',start,end,
    {width:300,height:780});
  assert.equal(stretched.textOverlays[1].size,78,
    '100 design units vertically represent 60 screen px; horizontally 50');
  assert.equal(stretched.textOverlays[1].x,item.x);
  assert.equal(stretched.textOverlays[1].y,item.y);
  assert.equal(stretched.textOverlays[1].rotation,item.rotation);
  assert.equal(dragTextTransform(sample,'front','scale',start,start,
    {width:300,height:780}),sample,'no-op gesture preserves object identity');
  assert.equal(dragTextTransform(sample,'front','scale',start,end,
    {width:0,height:780}),sample,'invisible canvases cannot commit transforms');
  assert.equal(dragTextTransform(sample,'front','scale',start,end,
    {width:NaN,height:780}),sample,'invalid viewport dimensions fail closed');
  assert.equal(dragTextTransform(sample,'locked','scale',start,end,
    {width:300,height:780}),sample,'locks survive screen-space adaptation');
});
test('text touch transform adapter supplies actual canvas bounds',async()=>{
  const {readFileSync}=await import('node:fs');
  const src=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
  assert.match(src,/state\.next=dragTextTransform\(state\.original,state\.id,mode,state\.start,point,\s*\{width:rect\.width,height:rect\.height\}\)/);
});

test('text axis toggle is a named, transient canvas control with frozen gesture state',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
  assert.match(source,/axisButton\.setAttribute\('aria-pressed'/);
  assert.match(source,/axisLocked\|\|event\.shiftKey/);
  assert.match(source,/axisDrag:beginAxisDrag\(/);
  assert.match(source,/drag\.axisDrag=next\.state/);
});

test('keyboard nudge is source-percent-based with fine, standard and coarse steps',async()=>{
 const {nudgeTextOverlay}=await import('../src/text-direct-geometry.js');
 const before=sample;
 const standard=nudgeTextOverlay(before,'front','ArrowRight');
 assert.equal(standard.textOverlays[1].x,51);
 assert.equal(standard.textOverlays[1].y,50);
 const coarse=nudgeTextOverlay(before,'front','ArrowUp',{coarse:true});
 assert.equal(coarse.textOverlays[1].y,45);
 const fine=nudgeTextOverlay(before,'front','ArrowLeft',{fine:true});
 assert.equal(fine.textOverlays[1].x,49.9);
 assert.equal(nudgeTextOverlay(before,'locked','ArrowRight'),before);
 assert.equal(nudgeTextOverlay(before,'front','Escape'),before);
 assert.deepEqual(before,sample);
 const bounds=nudgeTextOverlay(normalizeRecipe({textOverlays:[
   {id:'edge',text:'x',x:100,y:0,size:20}]}),'edge','ArrowRight');
 assert.equal(bounds.textOverlays[0].x,100);
});
test('keyboard text guide is focusable without stealing handle shortcuts',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../text-overlays.css',import.meta.url),'utf8');
 assert.match(source,/outline\.tabIndex=0/);
 assert.match(source,/event\.target!==outline/);
 assert.match(source,/nudgeTextOverlay\(current,id,event\.key/);
 assert.match(source,/cause:'text_move_keyboard'/);
 assert.match(css,/\.text-direct-outline:focus-visible/);
});
