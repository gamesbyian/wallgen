// One small, explicit local-recording control; no separate editor state.
import {USAGE_MODE_KEY} from './creative-recorder.js';

const escapeFileName=()=>new Date().toISOString().replace(/[:.]/g,'-');
function downloadLog(data){
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='roygbiv-activity-'+escapeFileName()+'.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),20000);
}
export function installCreativeRecorderUI({recorder,getRecipe}){
  const host=document.querySelector('.secondary-actions');
  if(!host)return;
  const launch=document.createElement('button');
  launch.type='button';launch.id='creativeActivityOpen';
  launch.textContent='Activity log';
  launch.setAttribute('aria-label','Manage private creative activity recording');
  host.append(launch);
  const dialog=document.createElement('dialog');
  dialog.id='creativeActivityDialog';dialog.className='creative-activity-dialog';
  dialog.setAttribute('aria-labelledby','creativeActivityTitle');
  dialog.innerHTML=`<div class="creative-activity-panel">
    <div class="creative-activity-head">
      <h2 id="creativeActivityTitle">Creative activity</h2>
      <button type="button" data-usage-close aria-label="Close activity settings">Close</button>
    </div>
    <p>Optionally keep a private, reconstructable history of your design sessions on this device. It records recipe changes, navigation, exports and superseded designs. It does not record your typing, imported photos or the image itself.</p>
    <label class="creative-activity-choice"><input type="checkbox" data-usage-enabled> Record my creative activity locally</label>
    <p data-usage-status role="status" aria-live="polite"></p>
    <div class="creative-activity-actions">
      <button type="button" data-usage-export>Export my activity JSON</button>
      <button type="button" data-usage-clear>Delete recorded activity</button>
    </div>
    <p class="creative-activity-foot">Recording starts only after you enable it. It is stored in this browser, not uploaded anywhere. Disabling stops future recording but leaves saved data until you delete it. Browser storage may be cleared or evicted. GitHub backup is not connected yet.</p>
  </div>`;
  document.body.append(dialog);
  const enabled=dialog.querySelector('[data-usage-enabled]');
  const status=dialog.querySelector('[data-usage-status]');
  async function refresh(){
    const records=await recorder.records();
    enabled.checked=recorder.enabled;
    status.textContent=(recorder.enabled?'Recording on':'Recording off')+
      ' · '+records.length+' event'+(records.length===1?'':'s')+
      (recorder.durable?' saved locally.':'. '+recorder.warning)+
      (recorder.error?' Recent write failed; export your records if possible.':'');
  }
  launch.addEventListener('click',()=>{
    void refresh();
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
  });
  dialog.querySelector('[data-usage-close]').addEventListener('click',()=>{
    if(typeof dialog.close==='function')dialog.close();
    else dialog.removeAttribute('open');
  });
  enabled.addEventListener('change',()=>{
    const value=enabled.checked;
    try{localStorage.setItem(USAGE_MODE_KEY,value?'local':'off');}
    catch{ /* Session-only mode is still explicit. */ }
    recorder.setEnabled(value,getRecipe());
    void refresh();
  });
  dialog.querySelector('[data-usage-export]').addEventListener('click',async()=>{
    status.textContent='Preparing your activity file…';
    try{downloadLog(await recorder.exportJSON());await refresh();}
    catch(error){status.textContent='Export failed: '+String(error.message||error);}
  });
  dialog.querySelector('[data-usage-clear]').addEventListener('click',async()=>{
    if(!confirm('Delete all local creative activity records? This cannot be undone.'))return;
    try{await recorder.clear();if(recorder.enabled)recorder.start(getRecipe());await refresh();}
    catch(error){status.textContent='Could not delete records: '+String(error.message||error);}
  });
}
