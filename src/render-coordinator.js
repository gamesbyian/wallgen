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
  now=()=>Date.now(),randomPreemptAfterMs=75,randomPreemptCooldownMs=185,
}={}){
  let worker=null,ready=false,disabled=!canUseWorker,disposed=false;
  let active=null,pending=null,revision=0,watchdog=null;
  let frameCount=0,staleCount=0,failedReason=null;
  let activeSince=0,lastRandomPreempt=-Infinity,randomPreemptCount=0;
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
    activeSince=now();
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
    // Ignore unsolicited/duplicate frames without freeing the *real* active
    // slot. Otherwise a late stray response can start a second paint while
    // the worker is still rendering the current job.
    if(message.id!==active?.id){
      staleCount++;closeFrame(message);
      return;
    }
    // The 170 ms settled request can overtake its provisional frame. UI
    // re-normalization may replace a recipe object without changing a single
    // value, so reference identity alone is too strict. Allow the earlier
    // bitmap only when the *complete* serialized canonical recipes agree.
    // The art key alone omits compositor controls and is NOT sufficient.
    const completing=active;
    const matchingRecipe=()=>{
      if(pending.recipe===completing.recipe)return true;
      try{return JSON.stringify(pending.recipe)===JSON.stringify(completing.recipe);}
      catch{return false;}
    };
    // For a continuous rotation gesture, the newest exact preview may take
    // hundreds of ms. Display a completed low-resolution frame as an
    // explicitly provisional (potentially trailing) frame ONLY when a newer
    // interactive request belongs to the SAME gesture token. The caller
    // independently checks the live gesture before painting; obsolete
    // designs, other sliders, cancels and post-commit frames remain rejected.
    const trailingGestureFrame=message.quality==='interactive'&&
      completing.quality==='interactive'&&completing.gesture!=null&&
      pending?.gesture===completing.gesture&&pending?.quality==='interactive';
    const sameRecipeUpgrade=message.quality==='interactive'&&
      completing.quality==='interactive'&&
      pending?.quality==='settled'&&
      pending.key===completing.key&&matchingRecipe();
    clearWatchdog();
    active=null;
    if(message.id!==revision&&!sameRecipeUpgrade&&!trailingGestureFrame){
      staleCount++;closeFrame(message);
    }else{
      const delivered=trailingGestureFrame&&message.id!==revision?
        {...message,provisionalStale:true,gesture:completing.gesture}:message;
      try{onFrame?.(delivered);frameCount++;}
      catch(error){closeFrame(message);fail(error);return;}
    }
    dispatch();
  };
  const boot=()=>{
    if(disabled||disposed)return;
    try{
      const instance=workerFactory();
      worker=instance;
      instance.onmessage=event=>{
        // A killed worker may deliver an already queued message after its
        // replacement starts. It never owns the replacement's active slot.
        if(worker!==instance){closeFrame(event.data);return;}
        handle(event.data);
      };
      instance.onerror=event=>{
        if(worker!==instance)return;
        event?.preventDefault?.();fail(event?.message||'Worker script failed');
      };
      instance.onmessageerror=()=>{
        if(worker===instance)fail('Cannot deserialize worker frame');
      };
      arm(startupMs,'Worker initialization timed out');
    }catch(error){fail(error);}
  };
  const preemptObsoleteRandom=(key,quality,intent)=>{
    if(intent!=='randomize'||quality!=='interactive'||!active||!ready||
      key===active.key)return;
    const elapsed=now()-activeSince;
    if(elapsed<randomPreemptAfterMs||
      now()-lastRandomPreempt<randomPreemptCooldownMs)return;
    // Canvas2D work is synchronous inside a worker. Only a distinct new
    // explicit Random/seed reroll is allowed to terminate obsolete work.
    // Throttle restarts; normal edits/Undo/rotation/export never preempt.
    lastRandomPreempt=now();randomPreemptCount++;
    clearWatchdog();
    try{worker?.terminate();}catch{}
    worker=null;ready=false;active=null;
    boot();
  };
  if(!disabled)boot();
  return {
    request(recipe,key,width,height,{quality='settled',gesture=null,intent=null}={}){
      if(disabled||disposed)return false;
      const id=++revision;
      pending={id,key,recipe,width,height,quality,gesture};
      preemptObsoleteRandom(key,quality,intent);
      // If a restarted worker failed to boot, the original caller gets an
      // immediate false and may use its existing main-thread fallback.
      if(disabled)return false;
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
      pending:!!pending,active:!!active,randomPreemptCount};},
  };
}

// Export uses its OWN short-lived worker; a 19.8 MP PNG cannot prevent an
// interactive preview worker from taking the newest slider request.
export function exportWallpaperInWorker({
  recipe,width,height,workerFactory=createRenderWorker,
  startupMs=8000,timeoutMs=120000,
  canUseWorker=typeof Worker==='function'&&typeof OffscreenCanvas==='function',
}){
  if(!canUseWorker)
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

// FIFO, small-canvas render lane for history snapshots and gallery thumbnails.
// Unlike the interactive preview, these are archival recipe images: skipping
// older jobs would attach the wrong artwork to a saved history entry.
export function createThumbnailQueue({
  workerFactory=createRenderWorker,
  canUseWorker=typeof Worker==='function'&&typeof OffscreenCanvas==='function',
  startupMs=8000,jobTimeoutMs=20000,maxPending=32,
}={}){
  let worker=null,ready=false,disabled=!canUseWorker,disposed=false;
  let id=0,active=null,queue=[],timer=null;
  const clearTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
  const fail=error=>{
    if(disabled||disposed)return;
    disabled=true;clearTimer();
    const cause=error instanceof Error?error:new Error(String(error));
    active?.reject(cause);active=null;
    for(const item of queue)item.reject(cause);
    queue=[];
    try{worker?.terminate();}catch{}
  };
  const dispatch=()=>{
    if(!ready||disabled||disposed||active||!queue.length)return;
    active=queue.shift();
    clearTimer();
    timer=setTimeout(()=>fail(new Error('Thumbnail worker timed out')),jobTimeoutMs);
    try{worker.postMessage({type:'thumbnail',id:active.id,
      recipe:active.recipe,width:active.width,height:active.height});}
    catch(error){fail(error);}
  };
  if(!disabled){
    try{
      worker=workerFactory();
      timer=setTimeout(()=>fail(new Error('Thumbnail worker startup timed out')),startupMs);
      worker.onmessage=({data})=>{
        if(disabled||disposed){closeFrame(data);return;}
        if(data?.type==='ready'){
          if(data.protocol!==1){fail('Unknown thumbnail worker protocol');return;}
          ready=true;clearTimer();dispatch();return;
        }
        if(data?.type==='unsupported'){fail(data.error||'Thumbnail worker unavailable');return;}
        if(data?.type==='error'&&data.id===active?.id){
          fail(data.error||'Thumbnail rendering failed');return;
        }
        if(data?.type==='thumbnail'){
          if(data.id!==active?.id){closeFrame(data);return;}
          clearTimer();
          const finished=active;active=null;
          if(data.frame)finished.resolve(data.frame);
          else finished.reject(new Error('Missing thumbnail frame'));
          dispatch();
        }
      };
      worker.onerror=event=>{event?.preventDefault?.();fail(event?.message||'Thumbnail script failed');};
      worker.onmessageerror=()=>fail('Cannot read thumbnail frame');
    }catch(error){fail(error);}
  }
  return {
    request(recipe,width,height){
      if(disabled||disposed)return Promise.reject(new Error('Thumbnail worker unavailable'));
      if(queue.length>=maxPending)return Promise.reject(new Error('Thumbnail queue full'));
      return new Promise((resolve,reject)=>{
        queue.push({id:++id,recipe,width,height,resolve,reject});
        dispatch();
      });
    },
    dispose(){
      if(disposed)return;
      fail('Thumbnail worker closed');disposed=true;disabled=true;
      try{worker?.terminate();}catch{}
    },
    get enabled(){return !disabled&&!disposed;},
    get pending(){return queue.length+(active?1:0);},
  };
}
