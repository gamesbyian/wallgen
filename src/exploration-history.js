// Exploration history is independent of Undo: jumping between promising
// branches does not destroy the artwork's precise undo chain. All snapshots
// are real normalized recipes, and the thumbnail captures the wallpaper only.
export function installExplorationHistory({form,preview,getRecipe,restore,renderThumbnail}){
  const max=10,items=[];
  const actions=form.querySelector('.editor-explore-actions');
  const toggle=document.createElement('button');
  toggle.type='button';toggle.id='editorHistoryToggle';
  toggle.className='editor-search-toggle';toggle.textContent='◴';
  toggle.title='Compare recent variations';toggle.setAttribute('aria-label','Recent variations');
  toggle.setAttribute('aria-pressed','false');actions.append(toggle);
  const panel=document.createElement('section');
  panel.id='editorHistory';panel.className='editor-history';panel.hidden=true;
  panel.setAttribute('aria-label','Recent wallpaper variations');
  const heading=document.createElement('header');
  heading.className='editor-history-heading';
  heading.innerHTML='<strong>Recent variations</strong><span>Tap a thumbnail to restore it.</span>';
  const back=document.createElement('button');
  back.type='button';back.className='editor-history-close';
  back.textContent='Back to tool';back.setAttribute('aria-label','Close recent variations and return to tool');
  heading.append(back);
  const strip=document.createElement('div');
  strip.className='editor-history-strip';
  panel.append(heading,strip);
  form.querySelector('.editor-tool-chooser').after(panel);
  let open=false;
  function refresh(){
    strip.replaceChildren();
    for(const item of [...items].reverse()){
      const button=document.createElement('button');
      button.type='button';button.className='editor-history-choice';
      button.setAttribute('aria-label','Restore '+item.label);
      button.title=item.label;
      const image=document.createElement('img');
      image.alt='';image.src=item.image;
      const label=document.createElement('span');label.textContent=item.label;
      button.append(image,label);
      button.addEventListener('click',()=>{
        restore(item.recipe);
        toggleHistory(false);
      });
      strip.append(button);
    }
    if(!items.length)strip.textContent='Generate or vary a wallpaper to start collecting alternatives.';
  }
  function toggleHistory(next=!open){
    open=next;panel.hidden=!next;
    form.classList.toggle('editor-history-open',open);
    toggle.setAttribute('aria-pressed',String(open));
    if(open)refresh();
  }
  toggle.addEventListener('click',()=>toggleHistory());
  back.addEventListener('click',()=>toggleHistory(false));
  document.addEventListener('editor-tool-changed',()=>toggleHistory(false));
  refresh();
  return {
    remember(recipe,label){
      const snapshot=structuredClone(recipe);
      const signature=JSON.stringify(snapshot);
      if(items.length&&items.at(-1).signature===signature)return;
      // A worker preview can still show the PREVIOUS recipe when this is
      // called. Never photograph the visible canvas for an archival record.
      const item={recipe:snapshot,label,signature,
        image:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='};
      items.push(item);
      if(items.length>max)items.shift();
      if(open)refresh();
      Promise.resolve().then(()=>renderThumbnail(snapshot,120,260)).then(image=>{
        item.image=image;
        if(open&&items.includes(item))refresh();
      }).catch(error=>{
        console.warn('Could not render recent variation thumbnail:',error);
        // The saved recipe stays available even if its thumbnail fails.
      });
    },
    count:()=>items.length,
    close:()=>toggleHistory(false),
  };
}
