import {simulateImageData} from './colour-vision.js';
// Dedicated view-only worker. Source preview canvases and export workers stay untouched.
self.onmessage=event=>{
  const {id,width,height,data,mode,severity}=event.data||{};
  try{
    const transformed=simulateImageData({width,height,data},mode,severity);
    self.postMessage({id,width,height,data:transformed.data},[transformed.data.buffer]);
  }catch(error){
    self.postMessage({id,error:String(error?.message||error)});
  }
};
