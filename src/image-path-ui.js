import {extractImagePathCandidates,extractImageShapeCandidates,imagePlacement,pathToWallpaper} from './image-path.js?v=20261023-fullframe1';
import {drawAuthoringLockReason,drawAuthoringLockMessage,pathStructureLockedOutsidePaths} from './path-authoring-locks.js';
import {verifyLocalSilhouetteSvg} from './svg-import-safety.js';
import {reconstructionCandidates,rankReconstructionCandidates,refineReconstructionCandidate,describeReconstructionImage,reconstructionPlacement,RECONSTRUCTION_FRAME} from './image-reconstruction.js?v=20261023-r0-observed2';

/** A live import dialog must match the current authoritative lock state,
 * even if a recipe restores a lock while image decoding is in flight. */
export function imagePathActionAvailability(recipe,candidate,working=false){
  const blocked=drawAuthoringLockReason(recipe);
  // Using a detected angle is not always the same as importing a Draw path.
  // A locked existing straight/wave geometry can still rotate if its layout
  // direction controls are unlocked. Match app.js onAngle's exact contract.
  const locks=recipe?.lockedSettings||[];
  const angleBlocked=pathStructureLockedOutsidePaths(recipe)||
    locks.includes('orientation')||locks.includes('diagonalRotation')||
    (recipe?.geometry==='drawn'&&locks.includes('geometry'));
  return {
    blocked,
    angleBlocked,
    canApply:!working&&!blocked&&!!candidate&&candidate.kind!=='shape',
    canShape:!working&&candidate?.kind==='shape'&&
      !(locks.includes('structure')&&recipe?.structure!=='regions')&&
      !(locks.includes('regionMode')&&recipe?.regionMode!=='scattered')&&
      !(locks.includes('scatteredShapeKind')&&recipe?.scatteredShapeKind!=='imported'),
    canAngle:!working&&!angleBlocked&&candidate?.kind==='line',
    canChooseAnother:!working&&!blocked
  };
}

// The image is transient: only the selected vector centreline enters the recipe.
// A native dialog provides an accessible, phone-friendly full-stage workspace.
export function installImagePathTool({getRecipe,onNotice,onPath,onAngle,onShape,onRecipe,onRender}){
  const byId=id=>document.getElementById(id);
  const launch=byId('importPathToggle'),fileInput=byId('imagePathFile'),
    dialog=byId('imagePathDialog'),canvas=byId('imagePathCanvas'),
    chooser=byId('imagePathCandidate'),status=byId('imagePathStatus'),
    apply=byId('imagePathApply'),shapeButton=byId('imagePathShape'),
    angleButton=byId('imagePathAngle'),another=byId('imagePathAnother'),
    closeButton=byId('imagePathCancel'),
    recipeWorkspace=byId('imageRecipeWorkspace'),recipeChooser=byId('imageRecipeCandidate'),
    recipeApply=byId('imageRecipeApply'),recipeStatus=byId('imageRecipeStatus'),
    recipeCanvas=byId('imageRecipeCanvas');
  const ctx=canvas.getContext('2d');
  let image=null,candidates=[],selected=0,width=0,height=0,working=false;
  let loadRevision=0,reconstructed=[];
  const phases={idle:'Choose image',analyzing:'Analyzing',ready:'Select geometry',empty:'No geometry'};
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
      const contours=candidate.kind==='shape'?
        candidate.geometry.components.flatMap(c=>[c.outer,...c.holes].map(ring=>
          ring.map(([x,y])=>[x/width,y/height]))):[candidate.points];
      ctx.beginPath();
      for(const contour of contours){
        for(let i=0;i<contour.length;i++){
          const [x,y]=contour[i],px=box.x+x*box.width,py=box.y+y*box.height;
          if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        if(candidate.kind==='shape')ctx.closePath();
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
    const access=imagePathActionAvailability(getRecipe(),candidate,working);
    apply.disabled=!access.canApply;
    shapeButton.disabled=!access.canShape||!onShape;
    angleButton.disabled=!access.canAngle;
    another.disabled=!access.canChooseAnother;
    setPhase(candidate?'ready':'empty');
    status.textContent=access.blocked?
      access.canAngle?'Path import is locked; this detected line angle can still be applied.':
        drawAuthoringLockMessage(access.blocked):candidate?
      candidate.kind==='shape'? 'Fillable silhouette. Use it as repeated rainbow shapes.':
      candidate.kind==='contour'?
        'Shape outline. It may be closed; inspect the join after applying.':
      candidate.kind==='arc'?
        'Colour-band centreline. Adjust its curve in the point editor.':
        'Detected line: '+candidate.angle+'°. Import it as a precisely angled path.':
      'No reliable geometry found. Try a cleaner image.';
    paint();
  }
  function chooseReconstruction(index){
    recipeChooser.value=String(index);
    const candidate=reconstructed[index];
    recipeApply.disabled=!candidate||working;
    if(!candidate)return;
    recipeStatus.textContent=candidate.label+'. Estimated colour/coverage difference: '+
      candidate.error.toFixed(3)+' (lower is better). '+candidate.uncertainty+
      (candidate.lockedChanges?.length?' Locked settings kept: '+candidate.lockedChanges.join(', ')+'.':'')+
      ' This is an inferred approximation, never the original source recipe.';
    try{onRender(candidate.recipe,recipeCanvas);}
    catch(error){recipeStatus.textContent+=' Preview unavailable: '+error.message;}
  }
  function recoverRecipes(pixels){
    reconstructed=[];recipeChooser.replaceChildren();recipeWorkspace.hidden=true;
    if(!onRecipe||!onRender)return;
    const candidates=reconstructionCandidates(pixels,getRecipe());
    if(!candidates.length)return;
    const frame=document.createElement('canvas');
    frame.width=RECONSTRUCTION_FRAME.width;frame.height=RECONSTRUCTION_FRAME.height;
    const g=frame.getContext('2d',{willReadFrequently:true});
    const desc=describeReconstructionImage(pixels);
    g.fillStyle=desc.background;g.fillRect(0,0,frame.width,frame.height);
    const box=reconstructionPlacement(width,height);
    g.drawImage(image,box.x*frame.width/600,box.y*frame.height/1300,
      box.width*frame.width/600,box.height*frame.height/1300);
    const reference=g.getImageData(0,0,frame.width,frame.height);
    const renderPixels=(recipe,w,h)=>{
      const rendered=document.createElement('canvas');rendered.width=w;rendered.height=h;
      onRender(recipe,rendered);
      return rendered.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h);
    };
    reconstructed=rankReconstructionCandidates(candidates,reference,renderPixels)
      .filter(result=>Number.isFinite(result.error));
    if(reconstructed.length){
      reconstructed[0]=refineReconstructionCandidate(reconstructed[0],
        reference,renderPixels);
      reconstructed.sort((a,b)=>a.error-b.error);
    }
    for(const [i,item] of reconstructed.entries()){
      const option=document.createElement('option');
      option.value=String(i);option.textContent=item.label+' ('+item.error.toFixed(3)+')';
      recipeChooser.append(option);
    }
    recipeWorkspace.hidden=!reconstructed.length;
    if(reconstructed.length)chooseReconstruction(0);
  }
  async function decode(file){
    if(!file||!allowed.test(file.type)&&!(/\.(png|jpe?g|webp|svg)$/i.test(file.name)))
      throw new Error('Choose a PNG, JPEG, WebP or SVG image.');
    if(file.size>12*1024*1024)throw new Error('Image must be smaller than 12 MB.');
    if(file.type==='image/svg+xml'||/\.svg$/i.test(file.name))
      verifyLocalSilhouetteSvg(await file.text());
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
    if(blocked){
      // A file selection is not an import when a lock disallows it. Clear
      // the native input so retrying that SAME file after unlocking emits
      // another change event, rather than silently doing nothing.
      fileInput.value='';
      onNotice(drawAuthoringLockMessage(blocked));
      return;
    }
    if(!dialog.open)dialog.showModal();
    setPhase('analyzing');
    working=true;apply.disabled=true;shapeButton.disabled=true;angleButton.disabled=true;another.disabled=true;chooser.disabled=true;
    // Hide candidates from the previous import until this image's analysis
    // has completed. Their old labels must not be mistaken for new results.
    chooser.replaceChildren();candidates=[];image=null;
    reconstructed=[];recipeWorkspace.hidden=true;recipeApply.disabled=true;
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
      const shapeCandidates=extractImageShapeCandidates(pixels);
      if(revision!==loadRevision||!dialog.open)return;
      candidates=[...extracted,...shapeCandidates].slice(0,18);
      chooser.replaceChildren();
      candidates.forEach((item,i)=>{
        const option=document.createElement('option');
        option.value=String(i);option.textContent=(i+1)+'. '+item.label;
        chooser.append(option);
      });
      selected=0;working=false;choose(0);
      // Recipe fitting is optional: original path/silhouette extraction
      // stays usable if a renderer or unsupported image defeats fitting.
      try{recoverRecipes(pixels);}catch(error){
        recipeWorkspace.hidden=false;recipeApply.disabled=true;
        recipeStatus.textContent='Editable recipe fitting unavailable: '+(error?.message||'unknown error');
      }
    }catch(error){
      if(revision!==loadRevision)return;
      image=null;candidates=[];chooser.replaceChildren();apply.disabled=true;shapeButton.disabled=true;angleButton.disabled=true;
      setPhase('empty');
      status.textContent=error?.message||'Image analysis failed.';
      paint();
    }finally{
      if(revision===loadRevision){
        working=false;
        another.disabled=!imagePathActionAvailability(
          getRecipe(),candidates[selected],false).canChooseAnother;
        chooser.disabled=false;fileInput.value='';
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
  recipeChooser.addEventListener('change',()=>chooseReconstruction(Number(recipeChooser.value)));
  recipeApply.addEventListener('click',()=>{
    const candidate=reconstructed[Number(recipeChooser.value)];
    if(working||!candidate||!onRecipe)return;
    if(onRecipe(candidate.recipe,candidate)){dialog.close();}
  });
  another.addEventListener('click',()=>{
    const blocked=drawAuthoringLockReason(getRecipe());
    if(blocked){onNotice(drawAuthoringLockMessage(blocked));return;}
    fileInput.click();
  });
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
  shapeButton.addEventListener('click',()=>{
    const candidate=candidates[selected];
    if(working||candidate?.kind!=='shape'||!onShape)return;
    if(!imagePathActionAvailability(getRecipe(),candidate,working).canShape){
      status.textContent='Unlock structure, region layout or shape source before using this silhouette.';
      return;
    }
    if(onShape(candidate.geometry)){
      dialog.close();
      onNotice('Imported a fillable silhouette. Save it in My shapes & paths for later reuse.');
    }
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
    image=null;candidates=[];reconstructed=[];chooser.replaceChildren();
    recipeChooser.replaceChildren();recipeWorkspace.hidden=true;fileInput.value='';
  });
  return {sync(recipe){
    const access=imagePathActionAvailability(recipe,candidates[selected],working);
    launch.disabled=!!access.blocked;
    if(!dialog.open)return;
    // The picker may have opened before a lock was restored. Do not expose
    // an Apply button that will be rejected after the user taps it.
    apply.disabled=!access.canApply;
    shapeButton.disabled=!access.canShape||!onShape;
    angleButton.disabled=!access.canAngle;
    another.disabled=!access.canChooseAnother;
    recipeApply.disabled=working||!reconstructed.length;
    if(access.blocked)status.textContent=access.canAngle?
      'Path import is locked; this detected line angle can still be applied.':
      drawAuthoringLockMessage(access.blocked);
    else if(!working)choose(selected); // Restore the existing selected candidate.
  }};
}
