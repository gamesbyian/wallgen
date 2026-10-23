// One small, explicit local-recording control; no separate editor state.
import {USAGE_MODE_KEY} from './creative-recorder.js';
import {FEEDBACK_PREF_KEY,CREATIVE_FEEDBACK_OPTIONS} from './creative-feedback.js';
import {createGithubUsageSync,USAGE_TOKEN_KEY,GITHUB_USAGE_REPO} from './creative-github-sync.js';

const escapeFileName=()=>new Date().toISOString().replace(/[:.]/g,'-');
function downloadLog(data){
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='roygbiv-activity-'+escapeFileName()+'.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),20000);
}
export function installCreativeRecorderUI({recorder,getRecipe,store}){
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
    <p>Optionally keep a private, reconstructable history of your design sessions on this device. It records recipe changes, navigation, exports and superseded designs. It does not store raw typing, imported source photos or rendered images. It does preserve editable recipe geometry, including shapes derived from imports.</p>
    <label class="creative-activity-choice"><input type="checkbox" data-usage-enabled> Record my creative activity locally</label>
    <label for="creativeFeedbackFrequency">Optional one-question surveys</label>
    <select id="creativeFeedbackFrequency" data-usage-feedback>
      <option value="every">After every eligible export or substantial restart</option>
      <option value="occasionally">Occasionally (about one in three)</option>
      <option value="never">Never ask</option>
    </select>
    <p data-usage-status role="status" aria-live="polite"></p>
    <p data-usage-queue>Backup queue: no status available yet.</p>
    <details class="creative-activity-recent">
      <summary>Review latest recorded events</summary>
      <ol data-usage-recent></ol>
    </details>
    <div class="creative-activity-actions">
      <button type="button" data-usage-export>Export my activity JSON</button>
      <button type="button" data-usage-clear>Delete all local activity</button>
    </div>
    <p>Local records are kept until you delete them or your browser clears storage. You can optionally remove complete sessions over 90 days old after their remote backup has been acknowledged. No unsent or active session is pruned.</p>
    <button type="button" data-usage-prune>Remove backed-up local sessions older than 90 days</button>
    <details class="creative-activity-backup">
      <summary>Private GitHub backup (optional)</summary>
      <p>Upload batches only to the existing private <code>gamesbyian/general-purpose</code> repository, branch <code>data/roygbiv-usage</code>. No GitHub Actions or new repository required.</p>
      <p><strong>Important:</strong> GitHub permissions cover the entire private repository, not just the activity folder. A token kept in this browser could be exposed if the device or website is compromised. You can revoke it in GitHub Settings at any time.</p>
      <label for="creativeGitHubToken">Fine-grained personal access token (Contents read/write on general-purpose only)</label>
      <input data-usage-token id="creativeGitHubToken" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your token on this device">
      <label class="creative-activity-choice"><input data-usage-remember type="checkbox"> Remember token on this device across visits (less secure)</label>
      <div class="creative-activity-actions">
        <button type="button" data-usage-sync>Enable backup and sync now</button>
        <button type="button" data-usage-disconnect>Disconnect backup</button>
      </div>
      <p data-usage-sync-status role="status" aria-live="polite">Not connected. Existing local records are unaffected.</p>
      <p>Remote backup retains copies in Git history. Deleting local data or disconnecting does not delete remote files.</p>
    </details>
    <p class="creative-activity-foot">Recording starts only after you enable it. By default records stay in this browser; GitHub backup needs a separate token and explicit connection. Disabling stops future collection, but local and previously uploaded data remain until deleted. Browser storage may be cleared or evicted.</p>
  </div>`;
  document.body.append(dialog);
  const enabled=dialog.querySelector('[data-usage-enabled]');
  const status=dialog.querySelector('[data-usage-status]');
  const queueStatus=dialog.querySelector('[data-usage-queue]');
  let connectionRevision=0;
  const feedbackSelect=dialog.querySelector('[data-usage-feedback]');
  try{
    const pref=localStorage.getItem(FEEDBACK_PREF_KEY);
    if(CREATIVE_FEEDBACK_OPTIONS.includes(pref))feedbackSelect.value=pref;
  }catch{}
  feedbackSelect.addEventListener('change',()=>{
    try{localStorage.setItem(FEEDBACK_PREF_KEY,feedbackSelect.value);}catch{}
  });
  async function refresh(){
    const records=await recorder.records();
    const summary=await store.syncSummary();
    enabled.checked=recorder.enabled;
    status.textContent=(recorder.enabled?'Recording on':'Recording off')+
      ' · '+records.length+' event'+(records.length===1?'':'s')+
      (recorder.durable?' saved locally.':'. '+recorder.warning)+
      (recorder.error?' Recent write failed; export your records if possible.':'');
    queueStatus.textContent='Backup queue: '+summary.pending+
      ' not yet confirmed, '+summary.backedUp+' confirmed remotely'+
      (summary.reserved?' ('+summary.reserved+' held for safe retry)':'')+
      '. Local data is retained until you explicitly delete it.';
    const recent=dialog.querySelector('[data-usage-recent]');
    recent.replaceChildren();
    for(const item of records.slice(-12).reverse()){
      const row=document.createElement('li');
      const keys=Array.isArray(item.changes)?item.changes.map(x=>x.key)
        .filter(key=>typeof key==='string').slice(0,6).join(', '):'';
      row.textContent=[item.at,item.type,item.cause,keys].filter(Boolean).join(' · ');
      recent.append(row);
    }
    if(!recent.children.length){
      const row=document.createElement('li');
      row.textContent='No activity recorded on this device.';
      recent.append(row);
    }
  }
  launch.addEventListener('click',()=>{
    void refresh();
    if(typeof dialog.showModal==='function')dialog.showModal();
    else dialog.setAttribute('open','');
  });
  dialog.querySelector('[data-usage-close]').addEventListener('click',()=>{
    if(typeof dialog.close==='function')dialog.close();
    else {dialog.removeAttribute('open');launch.focus();}
  });
  dialog.addEventListener('close',()=>launch.focus());
  enabled.addEventListener('change',()=>{
    const value=enabled.checked;
    if(!value){connectionRevision++;sync.cancel();}
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
    if(!confirm('Delete all local creative activity records? This cannot be undone. Previously uploaded records remain on GitHub.'))return;
    try{connectionRevision++;sync.cancel();await recorder.clear();if(recorder.enabled)recorder.start(getRecipe());await refresh();}
    catch(error){status.textContent='Could not delete records: '+String(error.message||error);}
  });
  dialog.querySelector('[data-usage-prune]').addEventListener('click',async()=>{
    if(!recorder.durable){
      status.textContent='Persistent storage is unavailable; there is no durable history to prune.';
      return;
    }
    if(!confirm('Delete only fully backed-up local sessions older than 90 days? This cannot be undone locally. Copies in GitHub history remain.'))return;
    try{
      connectionRevision++;sync.cancel();
      await recorder.flush();
      const cutoff=new Date(Date.now()-90*24*60*60*1000).toISOString();
      const removed=await store.pruneSyncedBefore(cutoff);
      await refresh();
      status.textContent+=' Removed '+removed+' old locally backed-up event(s); no unsent or current session events were deleted.';
    }catch(error){status.textContent='Could not prune backed-up records: '+String(error.message||error);}
  });

  const sync=createGithubUsageSync({store,recorder});
  const tokenInput=dialog.querySelector('[data-usage-token]');
  const remember=dialog.querySelector('[data-usage-remember]');
  const syncStatus=dialog.querySelector('[data-usage-sync-status]');
  let token='';
  try{
    token=sessionStorage.getItem(USAGE_TOKEN_KEY)||
      localStorage.getItem(USAGE_TOKEN_KEY)||'';
    remember.checked=Boolean(localStorage.getItem(USAGE_TOKEN_KEY));
  }catch{}
  if(token)syncStatus.textContent='Backup token available on this device. Sync is ready.';
  async function syncNow(){
    if(!token||!recorder.enabled||!recorder.durable)return {uploaded:0};
    const revision=connectionRevision;
    syncStatus.textContent='Uploading queued activity batches…';
    try{
      const result=await sync.run(token,{maxBatches:5});
      // An asynchronous request may complete after the user disconnected,
      // disabled recording or deleted history. Never overwrite that choice.
      if(revision===connectionRevision&&token&&recorder.enabled){
        syncStatus.textContent='Private GitHub backup confirmed: '+result.uploaded+
          ' additional event(s) uploaded this attempt.';
        if(dialog.open)await refresh();
      }
      return result;
    }catch(error){
      if(revision===connectionRevision&&token&&recorder.enabled)
        syncStatus.textContent='Backup not confirmed. Local queue retained. '+
          String(error.message||error);
      return {uploaded:0,error};
    }
  }
  dialog.querySelector('[data-usage-sync]').addEventListener('click',async()=>{
    if(!recorder.enabled){syncStatus.textContent='Enable local recording first.';return;}
    if(!recorder.durable){syncStatus.textContent='Persistent local storage is unavailable; cannot safely sync.';return;}
    if(tokenInput.value.trim())token=tokenInput.value.trim();
    if(!token){syncStatus.textContent='Enter a GitHub token before connecting.';return;}
    try{
      if(remember.checked){
        localStorage.setItem(USAGE_TOKEN_KEY,token);
        sessionStorage.removeItem(USAGE_TOKEN_KEY);
      }else{
        sessionStorage.setItem(USAGE_TOKEN_KEY,token);
        localStorage.removeItem(USAGE_TOKEN_KEY);
      }
      tokenInput.value='';
      await syncNow();
    }catch(error){
      syncStatus.textContent='Token storage unavailable. Local activity remains saved. '+String(error.message||error);
    }
  });
  dialog.querySelector('[data-usage-disconnect]').addEventListener('click',()=>{
    connectionRevision++;sync.cancel();
    token='';tokenInput.value='';remember.checked=false;
    try{sessionStorage.removeItem(USAGE_TOKEN_KEY);localStorage.removeItem(USAGE_TOKEN_KEY);}catch{}
    syncStatus.textContent='Disconnected on this device. Existing remote files remain in '+GITHUB_USAGE_REPO+'.';
  });
  // Network writes are bounded, not one per gesture. Sessions with expired
  // credentials simply keep their local outbox for the next manual retry.
  setInterval(()=>{
    if(document.visibilityState==='visible'&&token&&recorder.enabled)
      void syncNow();
  },180000);
  // Do not permanently stop retries on pagehide: Android may return to the
  // very same BFCache page. Abort only the in-flight request; its outbox stays.
  window.addEventListener('pagehide',()=>sync.cancel());
  window.addEventListener('online',()=>{
    if(token&&recorder.enabled&&document.visibilityState==='visible')void syncNow();
  });
  document.addEventListener('visibilitychange',()=>{
    if(token&&recorder.enabled&&document.visibilityState==='visible')void syncNow();
  });
  return {syncNow};
}
