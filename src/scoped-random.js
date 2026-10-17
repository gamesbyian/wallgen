import {normalizeRecipe,randomizeAllRecipe,newSeed} from './model.js';
import {EDITOR_CATEGORIES,TOOL_LIST,SETTING_TOOL} from './editor-schema.js';
const PERCENT_PRIMES=Array.from({length:99},(_,i)=>i+2)
 .filter(n=>{for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;});
const ANGLE_PRIMES=Array.from({length:358},(_,i)=>i+2)
 .filter(n=>{for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function scopedKeys(scope,name){
  if(scope==='setting')return SETTING_TOOL[name]?[name]:[];
  if(scope==='tool')return TOOL_LIST.find(t=>t.id===name)?.settings??[];
  if(scope==='category')return EDITOR_CATEGORIES.find(c=>c.id===name)
    ?.tools.flatMap(t=>t.settings)??[];
  return [];
}
const stepSize={gentle:.06,moderate:.22,wild:.5};
function nearestPrime(value,source){
  return source.reduce((best,n)=>Math.abs(n-value)<Math.abs(best-value)?n:best,source[0]);
}
function chooseAlternative(items,current,r){
  const others=items.filter(x=>x!==current);
  return others.length?others[Math.floor(r()*others.length)]:current;
}
// The result never changes seed, camera, position, unrelated settings or
// locked values. The scope gets a private deterministic stream, so no other
// part of the wallpaper consumes the stream or gets rerandomized.
export function randomizeScope(currentInput,{scope,name,mode='reroll',strength='moderate',seed,control}){
  const current=normalizeRecipe(currentInput);
  const candidate=randomizeAllRecipe({seed:seed||newSeed(),primesOnly:current.primesOnly});
  const next={...current};
  const selected=scopedKeys(scope,name);
  const weight=stepSize[strength]??stepSize.moderate;
  let state=0;
  const salt=String(seed||candidate.seed)+':'+scope+':'+name;
  for(let i=0;i<salt.length;i++)state=(Math.imul(state,31)+salt.charCodeAt(i))>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const modified=[];
  for(const key of selected){
    if(current.lockedSettings.includes(key))continue;
    if(key==='textureLayer2Enabled'||key==='textureLayer3Enabled')continue;
    // Disallow introducing a new randomly generated custom path: it is
    // exclusively drawn by the user and preserved when geometry is drawn.
    if(key==='geometry'&&current.geometry==='drawn')continue;
    const el=control?.(key);
    if(el?.dataset.inactive==='true')continue;
    const choices=el?.tagName==='SELECT'?[...el.options].filter(o=>!o.disabled)
      .map(o=>o.value):null;
    const v=current[key];
    let target=candidate[key];
    if(mode==='vary'){
      if(typeof v==='number'){
        const min=el&&Number.isFinite(Number(el.min))&&el.min!==''?Number(el.min):0;
        const max=el&&Number.isFinite(Number(el.max))&&el.max!==''?Number(el.max):100;
        target=clamp(v+(random()*2-1)*weight*(max-min),min,max);
        const step=el&&el.step&&el.step!=='any'?Number(el.step):1;
        if(step>0)target=clamp(min+Math.round((target-min)/step)*step,min,max);
        if(current.primesOnly&&min>=0&&max===100)
          target=nearestPrime(target,PERCENT_PRIMES);
        else if(current.primesOnly&&key.startsWith('textureRotation'))
          target=nearestPrime(target,ANGLE_PRIMES);
      }else if(typeof v==='boolean'){
        // Gentle variations preserve toggles. Wild ones can flip them.
        target=strength==='wild'&&random()>.6?!v:v;
      }else if(choices?.length)target=random()<weight*.55?
        chooseAlternative(choices,v,random):v;
      else target=v;
    }else if(choices?.length){
      target=choices.includes(target)?target:
        chooseAlternative(choices,v,random);
    }
    if(mode==='reroll'&&target===v){
      if(typeof v==='boolean')target=!v;
      else if(choices?.length)target=chooseAlternative(choices,v,random);
      else if(typeof v==='number'){
        const min=el?.min!==undefined&&el.min!==''?Number(el.min):0;
        const max=el?.max!==undefined&&el.max!==''?Number(el.max):100;
        const increment=Math.max(1,Math.round((max-min)/3));
        target=v+increment>max?min:v+increment;
        if(current.primesOnly&&min===0&&max===100)
          target=nearestPrime(target,PERCENT_PRIMES);
      }
    }
    if(target!==v){next[key]=target;modified.push(key);}
  }
  return {recipe:normalizeRecipe(next),modified,scope,name,mode};
}
