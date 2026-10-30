/**
 * Browser/PWA adapter for AYA's one-way creative artifact contract.
 * The browser cannot invoke the Android AAR. It shares one reviewed UTF-8
 * file with the receiving agent via the platform share sheet where supported.
 */
import {buildAyaRecipeHandoff} from './aya-recipe-reference.js';

export function installAyaRecipeHandoff({getCurrentRecipe}){
  if(typeof getCurrentRecipe!=='function')throw new TypeError('A current recipe getter is required');
  const dialog=document.getElementById('ayaRecipeDialog');
  const open=document.getElementById('ayaRecipeOpen');
  const close=dialog.querySelector('#ayaRecipeClose');
  const prompt=dialog.querySelector('#ayaRecipePrompt');
  const include=dialog.querySelector('#ayaRecipeIncludeCurrent');
  const status=dialog.querySelector('#ayaRecipeStatus');
  const share=dialog.querySelector('#ayaRecipeShare');
  const copy=dialog.querySelector('#ayaRecipeCopy');
  const save=dialog.querySelector('#ayaRecipeSave');
  if(!open||!dialog||!close||!prompt||!include||!status||!share||!copy||!save)
    throw new Error('AYA handoff controls are missing');
  let busy=false;
  const note=message=>{status.textContent=message;};
  const payload=()=>buildAyaRecipeHandoff({
    direction:prompt.value,
    currentRecipe:include.checked?getCurrentRecipe():null
  });
  const withPayload=handler=>async()=>{
    if(busy)return;
    let content;
    try{content=payload();}catch(error){note(error.message);prompt.focus();return;}
    busy=true;
    for(const button of [share,copy,save])button.disabled=true;
    try{await handler(content);}
    catch(error){if(error?.name!=='AbortError')note('Handoff not completed: '+error.message);}
    finally{busy=false;for(const button of [share,copy,save])button.disabled=false;}
  };
  open.addEventListener('click',()=>{
    note('Your guide is prepared locally. Nothing is sent until you choose Share.');
    // Preserve prompt and checkbox when the user reopens the composer.
    if(!dialog.open)dialog.showModal();
    prompt.focus({preventScroll:true});
  });
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if(event.target===dialog)dialog.close();
  });
  share.addEventListener('click',withPayload(async content=>{
    const file=new File([content],'roygbiv-aya-recipe-guide.txt',{type:'text/plain'});
    if(!navigator.share||!navigator.canShare||!navigator.canShare({files:[file]})){
      note('File sharing is unavailable here. Use Copy guide or Save guide, then attach it to your agent chat.');
      return;
    }
    await navigator.share({
      title:'ROYGBIV · Ask Your Agent',
      text:'Please use the attached ROYGBIV reference and design brief to generate an importable JSON recipe.',
      files:[file]
    });
    note('Share sheet completed. Your agent may still require a separate Send action.');
  }));
  copy.addEventListener('click',withPayload(async content=>{
    if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable in this context; use Save guide.');
    await navigator.clipboard.writeText(content);
    note('Guide copied. Paste it into your agent conversation and request a .json recipe.');
  }));
  save.addEventListener('click',withPayload(async content=>{
    const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    try{
      const a=document.createElement('a');
      a.href=url;a.download='roygbiv-aya-recipe-guide.txt';
      document.body.append(a);a.click();a.remove();
      note('Guide download requested. Attach this file in your chosen agent app.');
    }finally{setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }));
}
