/**
 * Presentation-only ROYGBIV slider colours. Every editor panel gets an
 * independently shuffled, stable palette; no visible range control in that
 * panel shares a colour. Artwork/recipe values are completely unaffected.
 */
const BASE=[
  {name:'red',h:2},{name:'orange',h:27},{name:'yellow',h:49},
  {name:'green',h:141},{name:'blue',h:217},
  {name:'indigo',h:245},{name:'violet',h:285},
];
const sessionSeed=Math.floor(Math.random()*0xffffffff);
function hash(text){
  let h=(2166136261^sessionSeed)>>>0;
  for(const char of text){h=Math.imul(h^char.charCodeAt(0),16777619)>>>0;}
  return h;
}
function permutation(id){
  const result=BASE.slice();let seed=hash(id);
  for(let i=result.length-1;i>0;i--){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const j=seed%(i+1);
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
const assignments=new WeakMap();
function assignPanel(panel){
  let state=assignments.get(panel);
  if(!state){state={palette:permutation(panel.dataset.editorTool||panel.id||'panel'),
    slots:new Map()};assignments.set(panel,state);}
  const ranges=[...panel.querySelectorAll('input[type="range"]')];
  const live=new Set();
  for(const [i,slider] of ranges.entries()){
    // Stable semantic identity survives dynamic interior-panel DOM rebuilds.
    const key=slider.dataset.rainbowKey||slider.name||slider.id||'slot-'+i;
    live.add(key);
    if(!state.slots.has(key)){
      const slot=state.slots.size;
      const base=state.palette[slot%state.palette.length];
      // Rare oversized panels: generate an additional distinct tone in the
      // same colour family rather than repeat one of the seven tracks.
      const generation=Math.floor(slot/state.palette.length);
      const lightness=generation===0?46:Math.max(26,46+((generation%2)?13:-13)*Math.ceil(generation/2));
      state.slots.set(key,`hsl(${base.h} 77% ${lightness}%)`);
    }
    slider.style.setProperty('--roygbiv-slider-color',state.slots.get(key));
  }
  // Intentionally retain past semantic assignments so rerendering a field
  // cannot reshuffle the same panel while a person is editing it.
}
export function installRainbowSliders(){
  const root=document.getElementById('controls');
  if(!root)return;
  const update=()=>{
    for(const panel of root.querySelectorAll('.editor-tool-card'))assignPanel(panel);
    const draw=document.getElementById('drawPathPanel');
    if(draw)assignPanel(draw);
  };
  update();
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;update();});
  });
  observer.observe(root,{childList:true,subtree:true});
}
