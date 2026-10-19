import {extractImagePathCandidates,imagePlacement,pathToWallpaper} from './image-path.js?v=20261018-import1';
import {drawAuthoringLockReason,drawAuthoringLockMessage} from './path-authoring-locks.js';

// The image is transient: only the selected vector centreline enters the recipe.
// A native dialog provides an accessible, phone-friendly full-stage workspace.
export function installImagePathTool({getRecipe,onNotice,onPath,onAngle}){
  const byId=id=>document.getElementById(id);
  const launch=byId('importPathToggle'),fileInput=byId('imagePathFile'),
    dialog=byId('imagePathDialog'),canvas=byId('imagePathCanvas'),
    chooser=byId('imagePathCandidate'),status=byId('imagePathStatus'),
    apply=byId('imagePathApply'),angleButton=byId('imagePathAngle'),another=byId('imagePathAnother'),
    closeButton=byId('imagePathCancel');
  const ctx=canvas.getContext('2d');
  let image=null,candidates=[],selected=0,width=0,height=0,working=false;
  let loadRevision=0;
  const phases={idle:'Choose image',analyzing:'Analyzing',ready:'Select path',empty:'No paths'};
  const phaseLabel=dialog.querySelector('.image-path-phase');
  function setPhase(next){
    dialog.dataset.phase=next;
    phaseLabel.textContent=phases[next];
  }
  const allowed=/^image\/(png|jpeg|webp|svg\+xml)$/;
  const placement=()=>imagePlacement(width,height);
  function paint(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#111523';ctx.fillRect(0,0,600,1300);
    if(!image)return;
    const box=placement();
    ctx.drawImage(image,box.x,box.y,box.width,box.height);
    candidates.forEach((candidate,index)=>{
      if(candidate.points.length<2)return;
      ctx.beginPath();
      for(let i=0;i<candidate.points.length;i++){
        const [x,y]=candidate.points[i],px=box.x+x*box.width,py=box.y+y*box.height;
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.lineJoin='round';ctx.lineCap='round';
      ctx.lineWidth=index===selected?5:2;
      ctx.strokeStyle=index===selected?'#ffef79':'#3ef5eb';
      ctx.shadowColor='#111';ctx.shadowBlur=5;
      ctx.stroke();ctx.shadowBlur=0;
    });
  }
  function choose(i){
    selected=Math.max(0,Math.min(candidates.length-1,i));
    chooser.value=String(selected);
    const candidate=candidates[selected];
    apply.disabled=!candidate;
    angleButton.disabled=!candidate||candidate.kind!=='line';
    setPhase(candidate?'ready':'empty');
    status.textContent=candidate?
      candidate.kind==='contour'?
        'Shape outline. It may be closed; inspect the join after applying.':
      candidate.kind==='arc'?
        'Colour-band centreline. Adjust its curve in the point editor.':
        'Detected line: '+candidate.angle+'°. Import it as a precisely angled path.':
      'No reliable geometry found. Try a cleaner image.';
    paint();
  }
  async function decode(file){
    if(!file||!allowed.test(file.type)&&!(/\.(png|jpe?g|webp|svg)$/i.test(file.name)))
      throw new Error('Choose a PNG, JPEG, WebP or SVG image.');
    if(file.size>12*1024*1024)throw new Error('Image must be smaller than 12 MB.');
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();
      img.src=url;
      await img.decode();
      if(!img.naturalWidth||!img.naturalHeight||
         img.naturalWidth>10000||img.naturalHeight>10000||
         img.naturalWidth*img.naturalHeight>40000000)
        throw new Error('Image dimensions are too large to analyze safely.');
      return img;
    }finally{
      // The decoded image keeps its pixels even after its object URL is revoked.
      URL.revokeObjectURL(url);
    }
  }
  async function load(file){
    if(!file)return;
    const revision=++loadRevision;
    const blocked=drawAuthoringLockReason(getRecipe());
    if(blocked){onNotice(drawAuthoringLockMessage(blocked));return;}
    if(!dialog.open)dialog.showModal();
    setPhase('analyzing');
    working=true;apply.disabled=true;angleButton.disabled=true;another.disabled=true;chooser.disabled=true;
    // Hide candidates from the previous import until this image's analysis
    // has completed. Their old labels must not be mistaken for new results.
    chooser.replaceChildren();candidates=[];image=null;
    status.textContent='Analyzing the image locally…';
    try{
      const decoded=await decode(file);
      if(revision!==loadRevision||!dialog.open)return;
      width=decoded.naturalWidth;height=decoded.naturalHeight;image=decoded;
      const downsample=document.createElement('canvas'),limit=600,
        scale=Math.min(1,limit/Math.max(width,height));
      downsample.width=Math.max(12,Math.round(width*scale));
      downsample.height=Math.max(12,Math.round(height*scale));
      const dc=downsample.getContext('2d',{willReadFrequently:true});
      dc.drawImage(image,0,0,downsample.width,downsample.height);
      const pixels=dc.getImageData(0,0,downsample.width,downsample.height);
      const extracted=extractImagePathCandidates(pixels);
      if(revision!==loadRevision||!dialog.open)return;
      candidates=extracted;
      chooser.replaceChildren();
      candidates.forEach((item,i)=>{
        const option=document.createElement('option');
        option.value=String(i);option.textContent=(i+1)+'. '+item.label;
        chooser.append(option);
      });
      selected=0;choose(0);
    }catch(error){
      if(revision!==loadRevision)return;
      image=null;candidates=[];chooser.replaceChildren();apply.disabled=true;angleButton.disabled=true;
      setPhase('empty');
      status.textContent=error?.message||'Image analysis failed.';
      paint();
    }finally{
      if(revision===loadRevision){
        working=false;another.disabled=false;chooser.disabled=false;fileInput.value='';
      }
    }
  }
  launch.addEventListener('click',()=>{
    const blocked=drawAuthoringLockReason(getRecipe());
    if(blocked){onNotice(drawAuthoringLockMessage(blocked));return;}
    fileInput.click();
  });
  fileInput.addEventListener('change',()=>{void load(fileInput.files?.[0]);});
  chooser.addEventListener('change',()=>choose(Number(chooser.value)));
  another.addEventListener('click',()=>fileInput.click());
  closeButton.addEventListener('click',()=>dialog.close());
  canvas.addEventListener('pointerdown',event=>{
    if(!candidates.length)return;
    const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*600/rect.width,
      y=(event.clientY-rect.top)*1300/rect.height;
    const box=placement();let best=-1,distance=24;
    for(let i=0;i<candidates.length;i++){
      const points=candidates[i].points;
      for(let k=1;k<points.length;k++){
        const a=[box.x+points[k-1][0]*box.width,box.y+points[k-1][1]*box.height],
          b=[box.x+points[k][0]*box.width,box.y+points[k][1]*box.height];
        const dx=b[0]-a[0],dy=b[1]-a[1],
          t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));
        const d=Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
        if(d<distance){distance=d;best=i;}
      }
    }
    if(best>=0)choose(best);
  });
  angleButton.addEventListener('click',()=>{
    if(working||candidates[selected]?.kind!=='line')return;
    if(onAngle(candidates[selected].angle))dialog.close();
  });
  apply.addEventListener('click',()=>{
    if(working)return;
    const candidate=candidates[selected];
    if(!candidate)return;
    const imported=pathToWallpaper(candidate,width,height);
    if(!imported){status.textContent='This path is too short to import.';return;}
    const blocked=drawAuthoringLockReason(getRecipe());
    if(blocked){
      status.textContent=drawAuthoringLockMessage(blocked);
      onNotice(status.textContent);
      return;
    }
    dialog.close();
    onPath(imported);
  });
  dialog.addEventListener('close',()=>{
    // The HTML dialog close event may be delivered after the user has
    // already reopened the picker for a second image. Never clear that
    // newer import's state from a delayed event belonging to the old one.
    if(dialog.open)return;
    ++loadRevision;working=false;
    setPhase('idle');
    image=null;candidates=[];chooser.replaceChildren();fileInput.value='';
  });
  return {sync(recipe){launch.disabled=!!drawAuthoringLockReason(recipe);}};
}
