import {drawWallpaper} from './renderer.js';

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
  const {type,id,recipe,width,height,key}=data||{};
  if(type!=='preview'&&type!=='export')return;
  let surface,cache;
  const start=performance.now();
  try{
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
      throw Error('Invalid render dimensions');
    surface=new OffscreenCanvas(width,height);
    if(type==='preview'){
      cache={};
      drawWallpaper(surface,recipe,{cache});
      // Transfer only the two immutable cached layers. The main thread
      // already has a pixel-identical compositor for nudge, shadows and
      // lighting; transferring a third full-frame bitmap wastes memory.
      const background=cache.background.transferToImageBitmap();
      const ink=cache.ink.transferToImageBitmap();
      try{
        self.postMessage({type:'frame',id,key,background,ink,
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
