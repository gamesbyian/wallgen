// Latest-only preview scheduler. UI recipe commits never wait for rendering.
// The worker can finish its current synchronous Canvas2D pass, but queued
// intermediate slider frames are replaced rather than serialized.
export function createRenderWorker(){
  return new Worker(new URL('./render-worker.js',import.meta.url),{type:'module'});
}
export function closeFrame(message){
  for(const key of ['frame','ink','background']){
    try{message?.[key]?.close?.();}catch{}
  }
}
export function createPreviewCoordinator({
  onFrame,onFailure,workerFactory=createRenderWorker,
  canUseWorker=typeof Worker==='function'&&typeof OffscreenCanvas==='function',
  startupMs=8000,frameTimeoutMs=20000,
}={}){
  let worker=null,ready=false,disabled=!canUseWorker,disposed=false;
  let active=null,pending=null,revision=0,watchdog=null;
  let frameCount=0,staleCount=0,failedReason=null;
  const clearWatchdog=()=>{if(watchdog!==null)clearTimeout(watchdog);watchdog=null;};
  const fail=error=>{
    if(disposed||disabled)return;
    disabled=true;ready=false;failedReason=String(error?.message||error);
    clearWatchdog();active=null;pending=null;
    try{worker?.terminate();}catch{}
    worker=null;
    onFailure?.(failedReason);
  };
  const arm=(ms,reason)=>{
    clearWatchdog();
    watchdog=setTimeout(()=>fail(new Error(reason)),ms);
  };
  const dispatch=()=>{
    if(disabled||disposed||!ready||active||!pending)return;
    active=pending;pending=null;
    arm(frameTimeoutMs,'Worker preview timed out');
    try{worker.postMessage({type:'preview',...active});}
    catch(error){fail(error);}
  };
  const handle=message=>{
    if(disabled||disposed){closeFrame(message);return;}
    if(message?.type==='ready'){
      if(message.protocol!==1){fail('Incompatible worker protocol');return;}
      ready=true;clearWatchdog();dispatch();return;
    }
    if(message?.type==='unsupported'){fail(message.error||'Worker unsupported');return;}
    if(message?.type==='error'){
      if(message.id===active?.id)fail(message.error||'Worker renderer failed');
      return;
    }
    if(message?.type!=='frame')return;
    clearWatchdog();
    const match=message.id===active?.id;
    active=null;
    if(!match||message.id!==revision){
      staleCount++;closeFrame(message);
    }else{
      try{onFrame?.(message);frameCount++;}
      catch(error){closeFrame(message);fail(error);return;}
    }
    dispatch();
  };
  if(!disabled){
    try{
      worker=workerFactory();
      worker.onmessage=event=>handle(event.data);
      worker.onerror=event=>{event?.preventDefault?.();fail(event?.message||'Worker script failed');};
      worker.onmessageerror=()=>fail('Cannot deserialize worker frame');
      arm(startupMs,'Worker initialization timed out');
    }catch(error){fail(error);}
  }
  return {
    request(recipe,key,width,height){
      if(disabled||disposed)return false;
      const id=++revision;
      pending={id,key,recipe,width,height};
      dispatch();
      return true;
    },
    invalidate(){
      ++revision;
      pending=null;
    },
    dispose(){
      disposed=true;disabled=true;clearWatchdog();
      pending=null;active=null;
      try{worker?.terminate();}catch{}
      worker=null;
    },
    get enabled(){return !disabled&&!disposed;},
    get ready(){return ready&&!disabled&&!disposed;},
    get status(){return {ready,disabled,failedReason,frameCount,staleCount,
      pending:!!pending,active:!!active};},
  };
}

// Export uses its OWN short-lived worker; a 19.8 MP PNG cannot prevent an
// interactive preview worker from taking the newest slider request.
export function exportWallpaperInWorker({
  recipe,width,height,workerFactory=createRenderWorker,
  startupMs=8000,timeoutMs=120000,
}){
  if(typeof Worker!=='function'||typeof OffscreenCanvas!=='function')
    return Promise.reject(new Error('OffscreenCanvas worker export unavailable'));
  return new Promise((resolve,reject)=>{
    let worker,timer,finished=false;
    const settle=(error,blob)=>{
      if(finished)return;
      finished=true;clearTimeout(timer);
      try{worker?.terminate();}catch{}
      if(error)reject(error);else resolve(blob);
    };
    try{
      worker=workerFactory();
      timer=setTimeout(()=>settle(new Error('PNG worker startup timed out')),startupMs);
      worker.onmessage=({data})=>{
        if(data?.type==='unsupported'){settle(new Error(data.error));return;}
        if(data?.type==='ready'){
          if(data.protocol!==1){settle(new Error('Invalid export worker protocol'));return;}
          clearTimeout(timer);
          timer=setTimeout(()=>settle(new Error('PNG export timed out')),timeoutMs);
          try{worker.postMessage({type:'export',id:1,recipe,width,height});}
          catch(error){settle(error);}
        }else if(data?.type==='exported'&&data.id===1){
          if(!(data.blob instanceof Blob)||!data.blob.size)
            settle(new Error('Empty worker PNG'));
          else settle(null,data.blob);
        }else if(data?.type==='error'&&data.id===1){
          settle(new Error(data.error||'Worker PNG encoding failed'));
        }
      };
      worker.onerror=event=>{event?.preventDefault?.();
        settle(new Error(event?.message||'PNG worker crashed'));};
      worker.onmessageerror=()=>settle(new Error('Invalid PNG worker message'));
    }catch(error){settle(error);}
  });
}
