// Opt-in actual WebGL2 raster comparison; independent of UI and production.
// Run after the headless workflow installs Playwright Chromium.
// Chrome's normal mobile smoke uses --disable-gpu and cannot prove shader
// operation. Here Chromium/ANGLE may use software SwiftShader, so this test
// checks correctness rather than GPU throughput on a phone.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const path=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  try{
    const data=readFileSync(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});
    res.end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:[
    '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader',
    '--enable-webgl','--ignore-gpu-blocklist'
  ]});
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  const metrics=await page.evaluate(async()=>{
    const {createMaskedFieldSession}=await import('/src/gpu-fields.js');
    const {drawRegionInteriors}=await import('/src/interior-elements.js');
    const width=300,height=650;
    const owner={id:'experiment',colorIndex:0,color:'#ff0000',
      vertices:[
        {x:60,y:100},{x:555,y:100},{x:555,y:1050},
        {x:345,y:1050},{x:345,y:580},{x:240,y:580},
        {x:240,y:1050},{x:60,y:1050}
      ]};
    const canvas=()=>new OffscreenCanvas(width,height);
    const mask=canvas(),ctx=mask.getContext('2d');
    ctx.scale(width/600,height/1300);
    ctx.fillStyle='#fff';ctx.beginPath();
    owner.vertices.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fill();
    const masks=ctx.getImageData(0,0,width,height).data;
    const cases=[
      {shape:'straight',frequency:5,amplitude:0,position:0,phase:0,
        color:'white',customColor:'#ffffff'},
      {shape:'wave',frequency:6,amplitude:.12,position:.13,phase:40,
        color:'white',customColor:'#ffffff'},
      {shape:'zigzag',frequency:3.8,amplitude:.08,position:-.09,phase:-28,
        color:'custom',customColor:'#55aaff'},
    ];
    const output=[];
    const session=createMaskedFieldSession({width,height});
    if(!session.supported)return {available:false,reason:session.reason,output};
    const initial=session.setMask(mask);
    if(!initial.supported){session.dispose();
      return {available:false,reason:initial.reason,output};}
    try{
    for(const sample of cases){
      const e={id:'benchmark',type:'line',placement:'field',
        stroke:'solid',width:3.4,opacity:1,enabled:true,
        colorSlots:[],objectIds:[],...sample};
      const reference=canvas(),draw=reference.getContext('2d');
      draw.scale(width/600,height/1300);
      drawRegionInteriors(draw,owner,[e],'regions',
        {left:0,top:0,right:600,bottom:1300});
      const ref=draw.getImageData(0,0,width,height).data;
      const gpu=session.render(e);
      if(!gpu.supported)throw Error('Reusable GPU render failed: '+gpu.reason);
      {
        const gl=session.canvas.getContext('webgl2');
        const pixels=new Uint8Array(width*height*4);
        gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        let outside=0,insideSolid=0,gpuSolid=0,gpuVisible=0;
        let alphaDiff=0,significant=0;
        for(let y=0;y<height;y++)for(let x=0;x<width;x++){
          const top=(y*width+x)*4;
          const bottom=((height-1-y)*width+x)*4;
          const a=ref[top+3],b=pixels[bottom+3];
          alphaDiff+=Math.abs(a-b);
          if(Math.abs(a-b)>40)significant++;
          if(masks[top+3]<2&&b>3)outside++;
          if(a>220)insideSolid++;
          if(b>220)gpuSolid++;
          if(b>80)gpuVisible++;
        }
        output.push({shape:e.shape,outside,insideSolid,gpuSolid,gpuVisible,
          meanAlphaDifference:alphaDiff/(width*height),
          significantRatio:significant/(width*height)});
      }
    }
    const stats={...session.stats};
    // Test an actual three-layer ink stack rather than three isolated
    // shaders. The shader must composite all colours/alphas in recipe order,
    // using the SAME uploaded mask and ONE framebuffer draw.
    const layers=[
      {id:'first',enabled:true,placement:'field',type:'line',
        shape:'straight',stroke:'solid',color:'white',width:4,
        frequency:5,amplitude:0,position:0,phase:0,opacity:.68,
        colorSlots:[],objectIds:[]},
      {id:'second',enabled:true,placement:'field',type:'line',
        shape:'wave',stroke:'solid',color:'custom',customColor:'#55aaff',
        width:4.6,frequency:6,amplitude:.12,position:.13,phase:40,
        opacity:.64,colorSlots:[],objectIds:[]},
      {id:'third',enabled:true,placement:'field',type:'line',
        shape:'zigzag',stroke:'solid',color:'black',width:3.6,
        frequency:3.8,amplitude:.08,position:-.09,phase:-28,
        opacity:.74,colorSlots:[],objectIds:[]},
    ];
    const referenceStack=canvas();
    const cpu=referenceStack.getContext('2d');
    cpu.scale(width/600,height/1300);
    drawRegionInteriors(cpu,owner,layers,'regions',
      {left:0,top:0,right:600,bottom:1300});
    const referencePixels=cpu.getImageData(0,0,width,height).data;
    const composed=session.renderMany(layers);
    if(!composed.supported)throw Error('GPU layer stack: '+composed.reason);
    const gl=session.canvas.getContext('webgl2');
    const composedPixels=new Uint8Array(width*height*4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,composedPixels);
    let alphaError=0,significant=0,rgbError=0,rgbSamples=0,outside=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const index=(y*width+x)*4;
      const gpuIndex=((height-1-y)*width+x)*4;
      const a=referencePixels[index+3],b=composedPixels[gpuIndex+3];
      alphaError+=Math.abs(a-b);
      if(Math.abs(a-b)>45)significant++;
      if(masks[index+3]<2&&b>3)outside++;
      if(a>100&&b>100){
        for(let c=0;c<3;c++)rgbError+=Math.abs(
          referencePixels[index+c]-composedPixels[gpuIndex+c]);
        rgbSamples+=3;
      }
    }
    const forwardBytes=composedPixels.slice();
    const reversed=session.renderMany(layers.slice().reverse());
    if(!reversed.supported)throw Error('GPU reverse stack: '+reversed.reason);
    const reversedBytes=new Uint8Array(width*height*4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,reversedBytes);
    let changedOrdering=0;
    for(let i=0;i<forwardBytes.length;i+=4){
      const rgbDistance=Math.abs(forwardBytes[i]-reversedBytes[i])+
        Math.abs(forwardBytes[i+1]-reversedBytes[i+1])+
        Math.abs(forwardBytes[i+2]-reversedBytes[i+2]);
      if(rgbDistance>35)changedOrdering++;
    }
    const layeredMetrics={
      outside,meanAlphaError:alphaError/(width*height),
      significantRatio:significant/(width*height),
      meanRGBError:rgbSamples?rgbError/rgbSamples:Infinity,
      changedOrdering,
      maskUploads:session.stats.maskUploads,
      drawsAfterStack:session.stats.draws,
    };
    // Modifying pixels on the SAME mask canvas must invalidate GPU input.
    const maskContext=mask.getContext('2d');
    maskContext.save();
    maskContext.setTransform(1,0,0,1,0,0);
    maskContext.clearRect(0,0,width,height);
    maskContext.restore();
    const reupload=session.setMask(mask);
    if(!reupload.supported)throw Error('Mask reupload: '+reupload.reason);
    const repaint=session.render({id:'retry',enabled:true,type:'line',
      placement:'field',shape:'straight',stroke:'solid',width:3,opacity:1,
      color:'white',frequency:5,amplitude:0,position:0,phase:0,
      colorSlots:[],objectIds:[]});
    if(!repaint.supported)throw Error('Post-mask repaint: '+repaint.reason);
    const pixels=new Uint8Array(width*height*4);
    session.canvas.getContext('webgl2').readPixels(0,0,width,height,
      session.canvas.getContext('webgl2').RGBA,
      session.canvas.getContext('webgl2').UNSIGNED_BYTE,pixels);
    let stale=0;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)stale++;
    return {available:true,output,stats,layeredMetrics,
      uploadCount:session.stats.maskUploads,
      postClearStalePixels:stale};
    }finally{session.dispose();}
  });
  console.log('GPU_MASKED_FIELD_PARITY',JSON.stringify(metrics));
  // Software GPU use may be prohibited in some CI environments. Only a
  // clear capability failure is skipped; raster mismatches must not be.
  if(!metrics.available){
    console.warn('GPU smoke skipped: '+metrics.reason);
  }else{
    assert.equal(metrics.stats.maskUploads,1,'mask uploaded once for all field variants');
    assert.equal(metrics.stats.draws,3,'three field shaders share the same context');
    assert.equal(metrics.uploadCount,2,'modified canvas mask reuploaded');
    assert.equal(metrics.postClearStalePixels,0,
      'a cleared mask may not leave old decoration pixels');
    assert.equal(metrics.layeredMetrics.maskUploads,1);
    assert.equal(metrics.layeredMetrics.drawsAfterStack,5,
      'three single draws then one per ordered multilayer scene');
    assert.equal(metrics.layeredMetrics.outside,0,'stack must respect exact mask');
    assert.ok(metrics.layeredMetrics.meanAlphaError<25,
      'combined layered ink alpha differs: '+JSON.stringify(metrics.layeredMetrics));
    assert.ok(metrics.layeredMetrics.significantRatio<.12,
      'combined ink has excessive dropped coverage: '+JSON.stringify(metrics.layeredMetrics));
    assert.ok(metrics.layeredMetrics.meanRGBError<65,
      'combined ink colours differ: '+JSON.stringify(metrics.layeredMetrics));
    assert.ok(metrics.layeredMetrics.changedOrdering>5,
      'reversing partially transparent layers must change overlapping ink');
    assert.equal(metrics.output.length,3);
    for(const item of metrics.output){
      assert.equal(item.outside,0,item.shape+' violated polygon clipping');
      assert.ok(item.insideSolid>250,item.shape+' has no Canvas2D markings');
      assert.ok(item.gpuVisible>500,item.shape+' has no visible GPU markings');
      assert.ok(item.meanAlphaDifference<10,
        item.shape+' excessive mismatch: '+JSON.stringify(item));
      assert.ok(item.significantRatio<.06,
        item.shape+' exceeds marked-coverage tolerance: '+JSON.stringify(item));
    }
  }
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
