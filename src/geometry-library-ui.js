// Reusable geometry library UI. Contextual source actions, without a new
// primary destination or a competing image-import/Draw editor.
import {openGeometryLibrary} from './geometry-library-store.js';
import {drawPathToGeometry,assetToDrawPath} from './geometry-asset.js';
import {serializeGeometryAsset,parseGeometryAsset,serializeGeometryLibrary,
  parseGeometryLibraryBackup,MAX_BACKUP_BYTES} from './geometry-library-backup.js';

const make=(parent,tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  parent.append(node);
  return node;
};
const pathAvailable=recipe=>recipe?.structure==='paths'&&recipe.geometry==='drawn'&&
  Array.isArray(recipe.customPath)&&recipe.customPath.length>=2;
const safeName=s=>s.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').slice(0,40)||'geometry';
// Monochrome vector previews come from the geometry actually stored, never
// from the image that happened to be on the wallpaper when Save was clicked.
function drawThumbnail(container,asset){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  const geometry=asset.geometry;
  let all=[],rings=[];
  if(geometry.type==='open-path'){
    all=geometry.points.map(([x,y])=>[x*600,y*1300]);
    const path=document.createElementNS(ns,'polyline');
    path.setAttribute('points',all.map(p=>p.join(',')).join(' '));
    path.setAttribute('fill','none');
    path.setAttribute('stroke','#d8c4ff');
    path.setAttribute('stroke-linejoin','round');
    path.setAttribute('stroke-linecap','round');
    path.setAttribute('stroke-width','5');
    path.setAttribute('vector-effect','non-scaling-stroke');
    svg.append(path);
  }else{
    rings=geometry.components.flatMap(c=>[c.outer,...c.holes]);
    all=rings.flat();
    const shape=document.createElementNS(ns,'path');
    shape.setAttribute('d',rings.map(r=>
      'M '+r.map(p=>p.join(' ')).join(' L ')+' Z').join(' '));
    shape.setAttribute('fill-rule','evenodd');
    shape.setAttribute('fill','#e7b5fc');
    svg.append(shape);
  }
  const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
  const padding=Math.max(w,h,1)*.09;
  svg.setAttribute('viewBox',[x-padding,y-padding,Math.max(w,1)+2*padding,
    Math.max(h,1)+2*padding].join(' '));
  container.append(svg);
}

export function installGeometryLibraryUI({getRecipe,applyPath,applyShape,onNotice,downloadBlob}){
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
  const importOne=make(foot,'button','Import shape / library JSON');importOne.type='button';
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
      drawThumbnail(thumb,item);
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
      else button(actions,'Use shape',()=>{
        try{
          if(!applyShape?.(item.geometry))return;
          dialog.close();
          onNotice('Applied saved silhouette. The wallpaper embeds its own copy.');
        }catch(e){say(errorMessage(e));}
      });
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
  async function open({filterKind}={}){
    opener=document.activeElement;
    if(dialog.open)return;
    // More is a nonmodal mobile sheet. Avoid leaving it in front of a modal.
    const tools=document.getElementById('mobileToolsSheet');
    if(tools&&!tools.hidden)document.getElementById('mobileToolsClose')?.click();
    dialog.showModal();
    if(filterKind==='shape'||filterKind==='path')filter.value=filterKind;
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
      if((await db.list({limit:1,offset:500})).length)
        throw new Error('Library exceeds 500 items. Export in smaller batches.');
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
      if(file.size>MAX_BACKUP_BYTES)throw new Error('Geometry JSON exceeds the 16 MiB limit');
      const text=await file.text(),db=await init();
      let manifest;
      try{manifest=JSON.parse(text);}catch{throw new Error('Invalid geometry JSON');}
      if(manifest?.format==='roygbiv.geometry-library'){
        const assets=await parseGeometryLibraryBackup(text);
        const result=await db.importMany(assets);
        say('Imported '+result.added+' items; skipped '+result.skipped+
          ' identical items.'+(db.durable?'':' These are session-only: export a copy.'));
      }else{
        const imported=await parseGeometryAsset(text);
        await db.importMany([imported]);
        say(db.durable?'Imported '+imported.name+'.':
          'Imported for this visit only. Export a copy to preserve it.');
      }
      await refresh();
    }catch(e){say('Could not import: '+errorMessage(e));}
  });
  return {open,refresh,sync,ready:init};
}
