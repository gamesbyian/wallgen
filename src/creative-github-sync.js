// GitHub Pages compatible, opt-in backup into an existing *private* repo.
// The personal token stays on device; it is never written into a batch or URL.
export const GITHUB_USAGE_REPO='gamesbyian/general-purpose';
export const GITHUB_USAGE_BRANCH='data/roygbiv-usage';
export const GITHUB_USAGE_PATH='telemetry/roygbiv';
export const USAGE_TOKEN_KEY='roygbiv:usage-github-token:v1';
const copy=x=>structuredClone(x);

export function orderUsageEvents(rows){
  return [...rows].sort((a,b)=>String(a.at).localeCompare(String(b.at))||
    String(a.sessionId).localeCompare(String(b.sessionId))||
    Number(a.seq)-Number(b.seq)||String(a.eventId).localeCompare(String(b.eventId)));
}
export function makeUsageBatch(events,syncedIds=[],{
  id=()=>globalThis.crypto.randomUUID(),now=()=>new Date().toISOString(),
  maxEvents=20,maxBytes=130000
}={}){
  const synced=new Set(syncedIds),records=[];
  for(const event of orderUsageEvents(events)){
    if(synced.has(event.eventId))continue;
    const projected=[...records,event];
    if(records.length&&(
      projected.length>maxEvents||
      new TextEncoder().encode(JSON.stringify(projected)).byteLength>maxBytes))break;
    if(new TextEncoder().encode(JSON.stringify(projected)).byteLength>maxBytes)
      throw new Error('An activity event exceeds the private backup batch limit. Retained locally.');
    records.push(copy(event));
  }
  if(!records.length)return null;
  const batchId=id(),day=String(records[0].at).slice(0,10);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(day)?day:'unknown-date';
  const [year,month,dayPart]=date.split('-');
  const safeId=String(batchId).replace(/[^a-zA-Z0-9-]/g,'').slice(0,90);
  if(!safeId)throw new Error('No valid activity batch ID');
  const path=GITHUB_USAGE_PATH+'/'+year+'/'+month+'/'+dayPart+'/'+safeId+'.json';
  const json=JSON.stringify({schema:1,source:'ROYGBIV consented creative activity',
    batchId:safeId,createdAt:now(),events:records},null,0)+'\n';
  return {id:safeId,path,json,eventIds:records.map(row=>row.eventId)};
}
export function encodeGithubContent(content){
  const bytes=new TextEncoder().encode(content);
  let binary='';
  for(let i=0;i<bytes.length;i+=8192)
    binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
export function createGithubUsageWriter({fetchImpl=globalThis.fetch,
  repo=GITHUB_USAGE_REPO,branch=GITHUB_USAGE_BRANCH}={}){
  const base='https://api.github.com/repos/'+repo+'/contents/';
  const headers=token=>({
    Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'
  });
  async function upload(batch,token,{signal}={}){
    if(typeof token!=='string'||token.trim().length<20)
      throw new Error('Enter a valid GitHub fine-grained personal access token.');
    const content=encodeGithubContent(batch.json);
    const path=batch.path.split('/').map(encodeURIComponent).join('/');
    const url=base+path;
    const response=await fetchImpl(url,{
      method:'PUT',headers:{...headers(token),'Content-Type':'application/json'},
      body:JSON.stringify({message:'data: save ROYGBIV creative activity batch '+batch.id,
        content,branch}),signal
    });
    if(response.status===201||response.status===422){
      // A successful PUT response alone cannot prove the intended bytes are
      // retrievable. The same readback also makes retries after an ambiguous
      // network failure idempotent, without overwriting an unrelated file.
      const check=await fetchImpl(url+'?ref='+encodeURIComponent(branch),{
        headers:headers(token),signal,cache:'no-store'
      });
      if(!check.ok)
        throw new Error('GitHub backup readback failed (HTTP '+check.status+'). Local batch retained.');
      const existing=await check.json();
      if(existing.encoding!=='base64'||
        String(existing.content||'').replace(/\s/g,'')!==content)
        throw new Error('GitHub backup readback differs from local batch. Local batch retained.');
      return {uploaded:true,existing:response.status===422};
    }
    const message=response.status===401||response.status===403?
      'GitHub backup was refused; check token permissions/expiry and API limits.':
      'GitHub backup failed (HTTP '+response.status+').';
    throw new Error(message);
  }
  return {upload};
}
export function createGithubUsageSync({store,recorder,writer=createGithubUsageWriter()}){
  let busy=null,controller=null;
  async function run(token,{maxBatches=3}={}){
    if(busy)return busy;
    const attempt=new AbortController();
    controller=attempt;
    busy=(async()=>{
      if(!token||!recorder.enabled)return {uploaded:0};
      if(recorder.error)throw new Error('Local recording failed. Resolve storage before backing up.');
      await recorder.flush();
      let total=0;
      for(let i=0;i<maxBatches;i++){
        if(!recorder.enabled||attempt.signal.aborted)break;
        const batch=await store.reserveBatch();
        if(!batch||!recorder.enabled||attempt.signal.aborted)break;
        await writer.upload(batch,token,{signal:attempt.signal});
        // If the owner opted out while a request was in flight, leave the
        // batch unacknowledged. A later consensual retry verifies exact bytes.
        if(!recorder.enabled||attempt.signal.aborted)break;
        await store.ackBatch(batch.id);
        total+=batch.eventIds.length;
      }
      return {uploaded:total};
    })();
    try{return await busy;}finally{busy=null;controller=null;}
  }
  return {run,cancel:()=>controller?.abort()};
}
