import {MAX_TEXT_OVERLAYS,newTextOverlay,TEXT_FONTS,TEXT_COLOURS,TEXT_OUTLINES} from './text-overlays.js';
import {importLocalFont,listLocalFonts,isLocalFontId} from './local-fonts.js';
import {BUNDLED_FONTS,isBundledFontId} from './bundled-fonts.js';

// A tool inside the seven-category editor, not a floating DOM preview layer.
// Every mutation takes the existing recipe/Undo path supplied by app.js.
export function installTextOverlayTool({getRecipe,changeRecipe,onFontNotice=()=>{}}){
  const card=document.querySelector('.editor-tool-card[data-editor-tool="typography"]');
  if(!card)throw Error('Typography card must be mounted before text controls');
  const root=document.createElement('div');
  root.className='text-overlay-editor';
  root.innerHTML=`
    <div class="text-overlay-commands">
      <label class="text-overlay-picker">Text object
        <select data-text-picker aria-label="Select text object"></select>
      </label>
      <button type="button" data-text-add>Add text</button>
      <button type="button" data-text-remove>Remove</button>
    </div>
    <div data-text-fields>
      <label class="text-overlay-wide">Words
        <textarea data-text-key="text" rows="2" maxlength="160" spellcheck="false" placeholder="Type a phrase"></textarea>
      </label>
      <div class="text-overlay-grid">
        <label>Typeface<select data-text-key="font"></select></label>
        <label>Colour<select data-text-key="colour"></select></label>
        <label>Outline<select data-text-key="outline"></select></label>
        <label>Text size <input type="range" data-text-key="size" min="12" max="180" step="1"></label>
        <label>Horizontal <input type="range" data-text-key="x" min="0" max="100" step="1"></label>
        <label>Vertical <input type="range" data-text-key="y" min="0" max="100" step="1"></label>
      </div>
      <label class="text-overlay-import">Import a TTF/OTF font from this device
        <input type="file" data-text-import accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf,application/x-font-opentype">
      </label>
      <p class="text-overlay-font-status" data-text-font-status role="status" aria-live="polite"></p>
      <details class="text-overlay-advanced">
        <summary>More text options</summary>
        <div class="text-overlay-grid">
          <label>Stroke width <input type="range" data-text-key="outlineWidth" min="0" max="20" step="1"></label>
          <label>Rotation <input type="range" data-text-key="rotation" min="-180" max="180" step="1"></label>
          <label>Opacity <input type="range" data-text-key="opacity" min="0" max="1" step="0.05"></label>
          <label class="text-overlay-check"><input type="checkbox" data-text-key="enabled"> Visible</label>
          <label class="text-overlay-check"><input type="checkbox" data-text-key="locked"> Keep style when randomizing</label>
        </div>
      </details>
    </div>
    <p class="text-overlay-hint">27 included, licensed typefaces travel with ROYGBIV. Your imported fonts stay private on this device, never inside a PNG or link. Reimport your original TTF/OTF file on another device; missing fonts block export rather than silently substitute.</p>
  `;
  card.append(root);
  const pick=root.querySelector('[data-text-picker]');
  const fields=root.querySelector('[data-text-fields]');
  const add=root.querySelector('[data-text-add]');
  const remove=root.querySelector('[data-text-remove]');
  const font=root.querySelector('[data-text-key="font"]');
  const colour=root.querySelector('[data-text-key="colour"]');
  const outline=root.querySelector('[data-text-key="outline"]');
  const fontFile=root.querySelector('[data-text-import]');
  const fontStatus=root.querySelector('[data-text-font-status]');
  let library=[];
  const options=(select,entries)=>select.replaceChildren(...entries.map(([value,label])=>{
    const option=document.createElement('option');option.value=value;option.textContent=label;return option;
  }));
  const baseFonts=Object.keys(TEXT_FONTS).map(key=>[key,({
    bold:'Poster bold',rounded:'Friendly rounded',modern:'Modern clean',
    editorial:'Editorial serif',typewriter:'Typewriter',playful:'Playful'
  })[key]]);
  const refreshFontOptions=selected=>{
    const bundled=Object.entries(BUNDLED_FONTS)
      .map(([id,entry])=>[id,entry.group+' · '+entry.label]);
    const names=[...baseFonts,...bundled,
      ...library.map(entry=>[entry.id,'My fonts · '+entry.name])];
    if(isLocalFontId(selected)&&!library.some(entry=>entry.id===selected))
      names.push([selected,'Missing imported font · reimport to restore']);
    options(font,names);
    if(selected)font.value=selected;
  };
  options(colour,TEXT_COLOURS.map(key=>[key,({
    black:'Black',white:'White','rainbow-letter':'Rainbow · each letter',
    'rainbow-word':'Rainbow · each word','rainbow-gradient':'Rainbow · gradient'
  })[key]]));
  options(outline,TEXT_OUTLINES.map(key=>[key,({
    none:'No outline',black:'Black outline',white:'White outline'
  })[key]]));
  let selectedId=null;
  const currentItems=()=>getRecipe().textOverlays||[];
  function sync(){
    const items=currentItems();
    if(!items.some(item=>item.id===selectedId))selectedId=items[0]?.id||null;
    options(pick,items.map((item,index)=>[item.id,(index+1)+'. '+item.text.replace(/\s+/g,' ').slice(0,30)]));
    if(selectedId)pick.value=selectedId;
    const item=items.find(item=>item.id===selectedId);
    fields.hidden=!item;
    pick.disabled=!item;
    remove.disabled=!item;
    add.disabled=items.length>=MAX_TEXT_OVERLAYS;
    if(!item){fontStatus.textContent='';return;}
    refreshFontOptions(item.font);
    fontStatus.textContent=isLocalFontId(item.font)&&
      !library.some(entry=>entry.id===item.font)?
      'Font file unavailable on this device. Reimport its original TTF/OTF to restore rendering.':'';
    for(const control of fields.querySelectorAll('[data-text-key]')){
      const key=control.dataset.textKey;
      if(control.type==='checkbox')control.checked=Boolean(item[key]);
      else if(control.value!==String(item[key]))control.value=String(item[key]);
    }
  }
  function commit(items){
    changeRecipe({...getRecipe(),textOverlays:items});
    sync();
  }
  add.addEventListener('click',()=>{
    const items=currentItems();
    if(items.length>=MAX_TEXT_OVERLAYS)return;
    let index=1;
    while(items.some(item=>item.id==='text-'+index))index++;
    const next=newTextOverlay('text-'+index);
    selectedId=next.id;
    commit([...items,next]);
    fields.querySelector('[data-text-key="text"]').focus();
  });
  remove.addEventListener('click',()=>{
    if(!selectedId)return;
    commit(currentItems().filter(item=>item.id!==selectedId));
  });
  pick.addEventListener('change',()=>{selectedId=pick.value;sync();});
  // Commit on change (not every keystroke) to avoid recreating the live
  // wallpaper and stealing Android IME focus during ordinary text entry.
  fields.addEventListener('change',event=>{
    const key=event.target.dataset.textKey;
    if(!key||!selectedId)return;
    const value=event.target.type==='checkbox'?event.target.checked:
      event.target.type==='range'?Number(event.target.value):event.target.value;
    commit(currentItems().map(item=>item.id===selectedId?{...item,[key]:value}:item));
  });
  fontFile.addEventListener('change',async()=>{
    const file=fontFile.files?.[0];
    if(!file||!selectedId)return;
    fontFile.disabled=true;
    fontStatus.textContent='Checking and saving font on this device…';
    try{
      const installed=await importLocalFont(file);
      library=await listLocalFonts();
      fontStatus.textContent='Font installed locally: '+installed.name;
      commit(currentItems().map(item=>item.id===selectedId?
        {...item,font:installed.id}:item));
      onFontNotice('Imported '+installed.name+' to this device.');
    }catch(error){
      fontStatus.textContent=String(error?.message||error);
      onFontNotice(fontStatus.textContent);
    }finally{fontFile.value='';fontFile.disabled=false;}
  });
  void listLocalFonts().then(found=>{library=found;sync();}).catch(error=>{
    fontStatus.textContent='Local fonts unavailable: '+String(error?.message||error);
  });
  document.addEventListener('roygbiv-controls-synced',sync);
  sync();
  return {sync};
}
