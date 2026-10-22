// Reusable geometry library UI. Contextual source actions, without a new
// primary destination or a competing image-import/Draw editor.
import {openGeometryLibrary} from './geometry-library-store.js';
import {drawPathToGeometry,assetToDrawPath} from './geometry-asset.js';
import {serializeGeometryAsset,parseGeometryAsset,serializeGeometryLibrary
} from './geometry-library-backup.js';

const make=(parent,tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  parent.append(node);
  return node;
};
const pathAvailable=recipe=>recipe?.structure==='paths'&&recipe.geometry==='drawn'&&
  Array.isArray(recipe.customPath)&&recipe.customPath.length>=2;
const safeName=s=>s.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').slice(0,40)||'geometry';

export function installGeometryLibraryUI({getRecipe,applyPath,onNotice,downloadBlob}){
  const dialog=make(document.body,'dialog');
  dialog.className='geometry-library-dialog';
  dialog.setAttribute('aria-label','My shapes and paths');
  const header=make(dialog,'header');
  make(header,'strong','My shapes & paths');
  const close=make(header,'button','Close');close.type='button';
  close.setAttribute('aria-label','Close geometry library');
  const note=make(dialog,'p');
  note.className='geometry-library-note';
  note.textContent='Save a path once and reuse it in another wallpaper.';
  const toolbar=make(dialog,'div');
  toolbar.className='geometry-library-toolbar';
  const search=make(toolbar,'input');search.type='search';search.placeholder='Find shapes or paths';
  search.setAttribute('aria-label','Search saved geometry');
  const filter=make(toolbar,'select');
  filter.setAttribute('aria-label','Geometry type');
  for(const [value,title] of [['','All'],['path','Paths'],['shape','Shapes']]){
    const option=make(filter,'option',title);option.value=value;
  }
  const nameRow=make(dialog,'div');nameRow.className='geometry-library-save';
  const name=make(nameRow,'input');name.type='text';name.maxLength=80;
  name.setAttribute('aria-label','Name for current path');
  name.placeholder='Name this path (optional)';
  const save=make(nameRow,'button','Save current path');save.type='button';
  const status=make(dialog,'p');status.className='geometry-library-status';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const list=make(dialog,'div');list.className='geometry-library-list';
  const foot=make(dialog,'footer');
  const exportAll=make(foot,'button','Export library JSON');exportAll.type='button';
  const importOne=make(foot,'button','Import geometry JSON');importOne.type='button';
  const upload=make(foot,'input');upload.type='file';upload.accept='.json,application/json';upload.hidden=true;
  let store=null,loading=null,request=0,opener=null,busy=false;
  const say=message=>{status.textContent=message;};
  const errorMessage=e=>e?.code==='duplicate'?'That geometry is already in your library.':
    e?.code==='conflict'?'This item changed in another tab. Refresh before editing.':
    e?.message||'Geometry library operation failed.';
  const canSave=()=>pathAvailable(getRecipe());
  const sync=()=>{
    save.disabled=busy||!canSave();
    save.title=canSave()?'Save the currently used drawn path':
      'Switch to a wallpaper using a custom drawn or imported path to save it';
  };
  const init=()=>loading||(loading=openGeometryLibrary().then(db=>{
    store=db;
    if(!db.durable)say(db.warning);
    return db;
  }).catch(e=>{loading=null;throw e;}));
  const button=(parent,label,callback)=>{
    const item=make(parent,'button',label);item.type='button';
    item.addEventListener('click',callback);
    return item;
  };
  const download=(text,filename)=>{
    downloadBlob(new Blob([text],{type:'application/json'}),filename);
  };
  async function refresh(){
    const id=++request;
    const db=await init();
    const items=await db.list({kind:filter.value||undefined,query:search.value,limit:500});
    if(id!==request||!dialog.open)return;
    list.replaceChildren();
    if(!items.length){
      const empty=make(list,'p',search.value.trim()?'No matching shapes or paths.':
        'No saved items yet. Draw or import a path, then save it here.');
      empty.className='geometry-library-empty';
      return;
    }
    for(const item of items){
      const card=make(list,'article');card.className='geometry-library-item';
      const thumb=make(card,'div');thumb.className='geometry-library-thumb';
      const icon=make(thumb,'span',item.kind==='path'?'∿':'◇');
      icon.setAttribute('aria-hidden','true');
      const data=make(card,'div');data.className='geometry-library-item-info';
      make(data,'strong',item.name);
      make(data,'small',item.kind==='path'?'Path':'Shape');
      const actions=make(card,'div');actions.className='geometry-library-item-actions';
      if(item.kind==='path')button(actions,'Use path',()=>{
        try{
          if(!applyPath(assetToDrawPath(item)))return;
          dialog.close();
          onNotice('Applied saved path. Undo restores the previous wallpaper.');
        }catch(e){say(errorMessage(e));}
      });
      else make(actions,'span','Available for Scattered shapes soon');
      button(actions,'Export',async()=>{
        try{download(await serializeGeometryAsset(item),
          'roygbiv-'+safeName(item.name)+'.geometry.json');
          say('Exported '+item.name+'.');
        }catch(e){say(errorMessage(e));}
      });
      button(actions,'Delete',async()=>{
        if(!confirm('Delete "'+item.name+'"? Saved wallpaper recipes keep their own geometry.'))return;
        try{await db.delete(item.id,{ifRevision:item.revision});
          say('Deleted '+item.name+'.');await refresh();
        }catch(e){say(errorMessage(e));}
      });
    }
  }
  async function open(){
    opener=document.activeElement;
    if(dialog.open)return;
    // More is a nonmodal mobile sheet. Avoid leaving it in front of a modal.
    const tools=document.getElementById('mobileToolsSheet');
    if(tools&&!tools.hidden)document.getElementById('mobileToolsClose')?.click();
    dialog.showModal();
    sync();
    if(canSave())name.value='Path '+getRecipe().seed.slice(0,25);
    else name.value='';
    say('Loading your library…');
    try{await init();if(store.warning)say(store.warning);else say('');
      await refresh();
    }catch(e){say('Could not open library: '+errorMessage(e));}
    search.focus();
  }
  const desktop=document.querySelector('.export-metadata');
  const openDesktop=make(desktop,'button','My shapes & paths');
  openDesktop.id='geometryLibraryToggle';openDesktop.type='button';
  openDesktop.className='text-link-button geometry-library-open';
  openDesktop.addEventListener('click',open);
  const mobileMore=document.getElementById('mobileToolsContent');
  const openMobile=make(mobileMore,'button','My shapes & paths');
  openMobile.id='mobileGeometryLibrary';openMobile.type='button';
  openMobile.className='geometry-library-mobile-entry';
  openMobile.addEventListener('click',open);
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    ++request;opener?.focus?.();opener=null;
  });
  search.addEventListener('input',()=>{void refresh().catch(e=>say(errorMessage(e)));});
  filter.addEventListener('change',()=>{void refresh().catch(e=>say(errorMessage(e)));});
  document.addEventListener('roygbiv-controls-synced',sync);
  save.addEventListener('click',async()=>{
    if(busy||!canSave())return;
    busy=true;sync();say('Saving path…');
    try{
      const db=await init();
      const asset=await db.add({name:name.value.trim()||'Untitled path',
        geometry:drawPathToGeometry(getRecipe()),source:{kind:'drawn'}});
      say(db.durable?'Saved '+asset.name+'.':
        'Saved for this visit only. Browser storage is unavailable; export this item.');
      await refresh();
    }catch(e){say('Could not save: '+errorMessage(e));}
    finally{busy=false;sync();}
  });
  exportAll.addEventListener('click',async()=>{
    try{
      const db=await init(),items=await db.list({limit:500});
      const content=await serializeGeometryLibrary(items);
      download(content,'roygbiv-shapes-and-paths.json');
      say('Exported '+items.length+' geometry items.');
    }catch(e){say(errorMessage(e));}
  });
  importOne.addEventListener('click',()=>upload.click());
  upload.addEventListener('change',async()=>{
    const file=upload.files?.[0];upload.value='';
    if(!file)return;
    try{
      if(file.size>1024*1024)throw new Error('Single geometry JSON must be 1 MiB or smaller');
      const imported=await parseGeometryAsset(await file.text());
      const db=await init();
      await db.add(imported);
      say(db.durable?'Imported '+imported.name+'.':
        'Imported for this visit only. Export a copy to preserve it.');
      await refresh();
    }catch(e){say('Could not import: '+errorMessage(e));}
  });
  return {open,refresh,sync,ready:init};
}
