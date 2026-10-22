// Display-only visual inspection. This module never imports the recipe model,
// changes the authoring canvas, or participates in export/thumbnail workflows.
import {createColourVisionJob} from './colour-vision.js';

const source=document.getElementById('preview');
const surface=source?.closest('.wallpaper-surface');
const stage=document.querySelector('.studio-stage');
const desktopHead=document.querySelector('.workspace-head');
const moreInspect=document.querySelector('#mobileMoreHeading-inspect')?.nextElementSibling;
if(!source||!surface||!desktopHead||!moreInspect)
  throw new Error('Colour Vision Preview requires the canonical Studio shell');

const make=(tag,className,content)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(content!==undefined)el.textContent=content;
  return el;
};
const overlay=make('canvas','vision-preview-layer');
overlay.id='visionPreviewLayer';
overlay.width=source.width;overlay.height=source.height;
overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
surface.insertBefore(overlay,source.nextSibling);
const divider=make('div','vision-compare-divider');
divider.hidden=true;divider.id='visionCompareDivider';
divider.tabIndex=0;divider.setAttribute('role','slider');
divider.setAttribute('aria-label','Original and simulated comparison divider');
divider.setAttribute('aria-valuemin','0');divider.setAttribute('aria-valuemax','100');
divider.setAttribute('aria-orientation','horizontal');
surface.append(divider);

const toggle=make('button','vision-entry','Vision preview');
toggle.type='button';toggle.id='visionPreviewToggle';
toggle.setAttribute('aria-controls','visionPanel');toggle.setAttribute('aria-expanded','false');
const panel=make('section','vision-panel');
panel.id='visionPanel';panel.hidden=true;panel.setAttribute('aria-label','Colour vision preview controls');
const header=make('div','vision-panel-head');
const title=make('strong','','Colour vision preview');
const close=make('button','vision-panel-close','Close');
close.type='button';close.setAttribute('aria-label','Close colour vision controls');
header.append(title,close);
const modeLabel=make('label','vision-control');
modeLabel.append(make('span','','Simulate'));
const mode=make('select');mode.id='visionMode';
for(const [value,text] of [
  ['original','Original colour'],
  ['protan','Protan (red-weak)'],
  ['deutan','Deutan (green-weak)'],
  ['tritan','Tritan (approx.)']
]){
  const option=make('option','',text);option.value=value;mode.append(option);
}
modeLabel.append(mode);
const severityLabel=make('label','vision-control');
const severityTitle=make('span','','Severity ');
const severityOutput=make('output','','100%');severityOutput.id='visionSeverityValue';
severityTitle.append(severityOutput);severityLabel.append(severityTitle);
const severity=make('input');severity.id='visionSeverity';
severity.type='range';severity.min='0';severity.max='100';severity.step='10';severity.value='100';
severity.setAttribute('aria-label','Simulated colour-vision deficiency severity');
severity.disabled=true;severityLabel.append(severity);
const compareLabel=make('label','vision-compare-option');
const compare=make('input');compare.type='checkbox';compare.id='visionCompare';
compare.disabled=true;compareLabel.append(compare,make('span','','Split: original left, simulated right'));
const original=make('button','vision-show-original','Show original');
original.id='visionShowOriginal';original.type='button';original.disabled=true;
original.setAttribute('aria-pressed','false');
const explanatory=make('p','vision-explanation',
  'Approximation of colour discrimination, not exactly what any person sees. Your saved wallpaper is unchanged.');
const caveat=make('p','vision-tritan-caveat',
  'Tritan simulation is especially approximate; severe tritanopia is not faithfully represented.');
caveat.hidden=true;
const status=make('output','vision-status');
status.id='visionStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const actions=make('div','vision-actions');
actions.append(compareLabel,original);
panel.append(header,modeLabel,severityLabel,actions,caveat,explanatory,status);

const desktopSlot=make('div','vision-desktop-slot');
desktopSlot.append(toggle);
desktopHead.append(desktopSlot);
const panelAnchor=make('div','vision-panel-anchor');
stage.before(panelAnchor);
function placeControls(){
  if(matchMedia('(max-width:790px)').matches){
    moreInspect.append(toggle,panel);
  }else{
    desktopSlot.append(toggle);
    panelAnchor.append(panel);
  }
}
const mobile=matchMedia('(max-width:790px)');
mobile.addEventListener('change',placeControls);
placeControls();

let selected='original',strength=1,split=false,splitPosition=50,showOriginal=false;
let worker=null,workerFailed=false,workerBusy=false,workQueued=false;
let frameVersion=0,requestSerial=0,activeRequest=null;
let fallbackTimer=0,paintFrame=0,disposed=false;
let processedVersion=-1;
let hasResult=false;
function isEnabled(){return selected!=='original'&&strength>0;}
function splitPositionSet(value){
  splitPosition=Math.max(0,Math.min(100,Math.round(value)));
  overlay.style.clipPath=split?'inset(0 0 0 '+splitPosition+'%)':'none';
  divider.style.left=splitPosition+'%';
  divider.setAttribute('aria-valuenow',String(splitPosition));
  divider.setAttribute('aria-valuetext',splitPosition+' percent original, '+(100-splitPosition)+' percent simulated');
}
function applyVisibility(){
  overlay.hidden=!isEnabled()||!hasResult||showOriginal||processedVersion!==frameVersion;
  divider.hidden=overlay.hidden||!split;
  overlay.style.clipPath=split?'inset(0 0 0 '+splitPosition+'%)':'none';
}
splitPositionSet(50);
function updateState({announce=true}={}){
  severity.disabled=selected==='original';
  compare.disabled=selected==='original';
  original.disabled=selected==='original';
  caveat.hidden=selected!=='tritan';
  severityOutput.value=Math.round(strength*100)+'%';
  severityOutput.textContent=severityOutput.value;
  original.textContent=showOriginal?'Show simulation':'Show original';
  original.setAttribute('aria-pressed',String(showOriginal));
  frameVersion++;
  hasResult=false;
  applyVisibility();
  if(announce){
    status.textContent=selected==='original'||strength===0?'Showing original wallpaper.':
      'Simulating '+mode.selectedOptions[0].textContent+', '+Math.round(strength*100)+'%. Display only.';
  }
  requestConversion();
}
function sourceChanged(){
  frameVersion++;
  hasResult=false;
  applyVisibility();requestConversion();
}
function requestConversion(){
  if(!isEnabled()||showOriginal||disposed)return;
  workQueued=true;
  if(paintFrame)return;
  paintFrame=requestAnimationFrame(()=>{
    paintFrame=0;
    pump();
  });
}
function ensureWorker(){
  if(worker||workerFailed)return;
  if(typeof Worker!=='function'){workerFailed=true;return;}
  try{
    worker=new Worker(new URL('./colour-vision-worker.js',import.meta.url),{type:'module'});
    worker.onmessage=event=>{
      const data=event.data||{};
      workerBusy=false;
      const mine=activeRequest;activeRequest=null;
      if(data.error){
        failWorker(data.error);
        return;
      }
      if(mine&&data.id===mine.id&&mine.version===frameVersion&&
          isEnabled()&&!showOriginal){
        try{paint(data,mine.version);}
        catch(error){status.textContent='Simulation preview unavailable: '+error.message;}
      }
      pump();
    };
    worker.onerror=()=>failWorker('Worker unavailable');
    worker.onmessageerror=()=>failWorker('Worker message unavailable');
  }catch{workerFailed=true;worker=null;}
}
function failWorker(reason){
  try{worker?.terminate();}catch{}
  worker=null;workerBusy=false;activeRequest=null;workerFailed=true;
  workQueued=true;status.textContent='Using compatibility preview mode.';
  pump();
}
function paint(result,version){
  if(version!==frameVersion)return;
  if(overlay.width!==result.width||overlay.height!==result.height){
    overlay.width=result.width;overlay.height=result.height;
  }
  const ctx=overlay.getContext('2d',{alpha:true});
  if(!ctx)throw new Error('No Canvas2D output');
  ctx.putImageData(new ImageData(result.data,result.width,result.height),0,0);
  processedVersion=version;hasResult=true;
  applyVisibility();
  surface.dispatchEvent(new CustomEvent('roygbiv-vision-presented',
    {detail:{version,mode:selected,severity:strength}}));
}
function pump(){
  if(!workQueued||!isEnabled()||showOriginal||disposed||workerBusy)return;
  workQueued=false;
  const version=frameVersion;
  let pixels;
  try{
    pixels=source.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,source.width,source.height);
  }catch(error){
    status.textContent='Simulation preview unavailable; original artwork is unaffected.';
    return;
  }
  if(version!==frameVersion){workQueued=true;requestConversion();return;}
  ensureWorker();
  if(worker){
    const id=++requestSerial;
    workerBusy=true;activeRequest={id,version};
    try{
      worker.postMessage({id,width:pixels.width,height:pixels.height,data:pixels.data,
        mode:selected,severity:strength},[pixels.data.buffer]);
    }catch(error){failWorker(error);}
  }else{
    // Compatibility path is time-sliced: <=24 rows per task, no long
    // main-thread colour-mapping loop. A stale job is abandoned immediately.
    clearTimeout(fallbackTimer);
    const job=createColourVisionJob(pixels,selected,strength);
    const total=job.result.width*job.result.height;
    const batch=Math.max(job.result.width,job.result.width*24);
    let next=0;
    const run=()=>{
      fallbackTimer=0;
      if(version!==frameVersion||!isEnabled()||showOriginal||disposed)return;
      try{
        const end=Math.min(total,next+batch);
        job.processPixels(next,end);next=end;
        if(next<total)fallbackTimer=setTimeout(run,0);
        else paint(job.result,version);
      }catch(error){
        status.textContent='Simulation preview unavailable; original artwork is unaffected.';
      }
    };
    fallbackTimer=setTimeout(run,0);
  }
}
source.addEventListener('roygbiv-preview-presented',sourceChanged);
source.addEventListener('roygbiv-preview-interactive',sourceChanged);
toggle.addEventListener('click',()=>{
  const next=panel.hidden;panel.hidden=!next;
  toggle.setAttribute('aria-expanded',String(next));
  if(next)mode.focus();else toggle.focus();
});
close.addEventListener('click',()=>{
  panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();
});
mode.addEventListener('change',()=>{
  selected=mode.value;showOriginal=false;
  updateState();
});
severity.addEventListener('input',()=>{
  strength=Number(severity.value)/100;
  updateState({announce:false});
});
severity.addEventListener('change',()=>updateState());
compare.addEventListener('change',()=>{
  split=compare.checked;
  applyVisibility();splitPositionSet(splitPosition);
  status.textContent=split?'Split comparison enabled. Drag or focus the divider.':'Full simulation preview.';
});
original.addEventListener('click',()=>{
  showOriginal=!showOriginal;
  original.textContent=showOriginal?'Show simulation':'Show original';
  original.setAttribute('aria-pressed',String(showOriginal));
  if(!showOriginal&&processedVersion!==frameVersion)requestConversion();
  applyVisibility();
});
divider.addEventListener('pointerdown',event=>{
  event.preventDefault();divider.setPointerCapture(event.pointerId);
});
divider.addEventListener('pointermove',event=>{
  if(!divider.hasPointerCapture(event.pointerId))return;
  const rect=source.getBoundingClientRect();
  if(rect.width)splitPositionSet((event.clientX-rect.left)/rect.width*100);
});
divider.addEventListener('keydown',event=>{
  let next=splitPosition;
  if(event.key==='ArrowLeft'||event.key==='ArrowDown')next-=5;
  else if(event.key==='ArrowRight'||event.key==='ArrowUp')next+=5;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=100;
  else return;
  event.preventDefault();splitPositionSet(next);
});
// Distinguish the overlay from the generator's canvas without keeping art caches.
// When Draw starts, the source canvas remains untouched and the drawing plane wins.
updateState({announce:false});
