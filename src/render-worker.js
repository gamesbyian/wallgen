import {drawWallpaper} from './renderer.js?v=20261024-text-overlays1';

// Sole rendering worker entry point. No DOM access; Canvas2D is shared with
// the reference renderer via createRenderSurface() and OffscreenCanvas.
const supported=typeof OffscreenCanvas==='function'&&typeof Path2D==='function'&&
  typeof OffscreenCanvas.prototype.transferToImageBitmap==='function'&&
  typeof OffscreenCanvas.prototype.convertToBlob==='function';
self.postMessage(supported?{type:'ready',protocol:1}:{type:'unsupported',
  error:'OffscreenCanvas/Path2D bitmap or PNG support unavailable in this worker'});

function dispose(canvas){
  if(!canvas)return;
  // Release backing stores explicitly, especially after 19.8 MP export.
  try{canvas.width=0;canvas.height=0;}catch{}
}
self.onmessage=async({data})=>{
  if(!supported)return;
  const {type,id,recipe,width,height,key,quality='settled'}=data||{};
  if(type!=='preview'&&type!=='export'&&type!=='thumbnail')return;
  let surface,cache;
  const start=performance.now();
  try{
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
      throw Error('Invalid render dimensions');
    surface=new OffscreenCanvas(width,height);
    if(type==='thumbnail'){
      drawWallpaper(surface,recipe);
      const frame=surface.transferToImageBitmap();
      try{self.postMessage({type:'thumbnail',id,frame},[frame]);}
      catch(error){frame.close();throw error;}
    }else if(type==='preview'){
      if(quality==='interactive'){
        // A transient lower-resolution frame while the user is dragging.
        // Do not populate the full overscan nudge cache for obsolete frames.
        drawWallpaper(surface,recipe);
        const frame=surface.transferToImageBitmap();
        try{self.postMessage({type:'frame',id,key,quality,frame,
          ms:performance.now()-start},[frame]);}
        catch(error){frame.close();throw error;}
        return;
      }
      cache={};
      // Settled previews transfer unfiltered ink/background; the presenting
      // compositor applies Photo exactly once, also when the user nudges.
      drawWallpaper(surface,recipe,{cache,skipPhoto:true});
      // Transfer only the two immutable cached layers. The main thread
      // already has a pixel-identical compositor for nudge, shadows and
      // lighting; transferring a third full-frame bitmap wastes memory.
      const background=cache.background.transferToImageBitmap();
      const ink=cache.ink.transferToImageBitmap();
      try{
        self.postMessage({type:'frame',id,key,quality,background,ink,
          overhang:cache.overhang,ms:performance.now()-start},
          [background,ink]);
      }catch(error){
        background.close();ink.close();throw error;
      }
    }else{
      drawWallpaper(surface,recipe);
      const blob=await surface.convertToBlob({type:'image/png'});
      self.postMessage({type:'exported',id,blob,ms:performance.now()-start});
    }
  }catch(error){
    self.postMessage({type:'error',id,operation:type,
      error:String(error?.message||error)});
  }finally{
    dispose(cache?.background);dispose(cache?.ink);
    dispose(surface);
  }
};
