import {DESIGN_WIDTH,DESIGN_HEIGHT} from './model.js';
import {TEXT_FONTS} from './text-overlays.js';
import {typefacesReady,typefaceCssFamily} from './typography-fonts.js';
import {availableTextWidth} from './text-direct-geometry.js';
import {rainbowTextStops} from './text-rainbow-shaping.js';
import {layoutTextOnPath} from './text-path-geometry.js';

// The same post-composite typography pass is used by reference, worker,
// thumbnail, headless, and preview-cache composition. Never render DOM text
// over the preview: it would disappear from PNG exports.
const fallbackRainbow=['#FF474E','#FF9B39','#FFE25B','#4FDD87','#53AAFF','#6359E5','#BB64ED'];
export function drawTextOverlays(ctx,width,height,scene){
  if(!scene?.textOverlays?.length)return;
  if(!typefacesReady(scene))throw Error('Typeface unavailable: prepare fonts before painting');
  const baseColours=scene.stripes?.length===7?
    scene.stripes.map(item=>item.color):fallbackRainbow;
  ctx.save();
  // Text placement is expressed in canonical 600 x 1300 wallpaper units.
  // Thus a preview and 3024x6552 export retain the same design geometry.
  ctx.scale(width/DESIGN_WIDTH,height/DESIGN_HEIGHT);
  for(const item of scene.textOverlays){
    if(!item.enabled||!item.text)continue;
    const rainbow=item.rainbowReverse?[...baseColours].reverse():baseColours;
    const phase=item.rainbowOffset??0;
    const colours=phase?rainbow.map((_,i)=>rainbow[(i+phase)%rainbow.length]):rainbow;
    ctx.save();
    ctx.translate(DESIGN_WIDTH*item.x/100,DESIGN_HEIGHT*item.y/100);
    ctx.rotate(item.rotation*Math.PI/180);
    ctx.globalAlpha=item.opacity;
    ctx.font='bold '+item.size+'px '+typefaceCssFamily(item.font);
    // Native Canvas letterSpacing preserves full-line ligatures and joining;
    // never emulate tracking by fragmenting an otherwise straight RTL line.
    if(item.letterSpacing!==undefined&&'letterSpacing' in ctx)
      ctx.letterSpacing=item.letterSpacing+'px';
    const shadowEnabled=item.shadow==='black'||item.shadow==='white';
    const pixelScale=(width/DESIGN_WIDTH+height/DESIGN_HEIGHT)/2;
    ctx.shadowColor=shadowEnabled?
      (item.shadow==='white'?'rgba(255,255,255,.86)':'rgba(0,0,0,.86)'):
      'rgba(0,0,0,0)';
    ctx.shadowBlur=shadowEnabled?(item.shadowBlur??6)*pixelScale:0;
    ctx.shadowOffsetX=shadowEnabled?(item.shadowDistance??7)*pixelScale:0;
    ctx.shadowOffsetY=shadowEnabled?(item.shadowDistance??7)*pixelScale:0;
    ctx.textAlign='left';
    ctx.textBaseline='middle';
    ctx.lineJoin='round';
    ctx.miterLimit=2;
    ctx.lineWidth=item.size*item.outlineWidth/100;
    ctx.strokeStyle=item.outline==='white'?'#ffffff':'#000000';
    const lines=item.text.split('\n');
    let colourIndex=0;
    const lineHeight=item.size*1.17*(1+(item.lineSpacing??0)/100);
    lines.forEach((line,lineIndex)=>{
      const total=ctx.measureText(line).width;
      const room=availableTextWidth(item);
      const shrink=total>room?room/total:1;
      ctx.save();
      const lineOffset=(lineIndex-(lines.length-1)/2)*lineHeight;
      // Curved lettering uses the same final-frame transform, font resolver,
      // colour palette and compositing pass as ordinary text. For joining
      // scripts, the layout refuses splitting and falls through to the
      // untouched whole-line native Canvas paint below.
      const path=item.path&&item.path!=='none'?
        layoutTextOnPath(item,line,unit=>ctx.measureText(unit).width,
          scene.customPath):null;
      // Shift multiple curved lines along the LOCAL PATH NORMAL. A simple
      // vertical offset causes independent lines to cross on steep bends.
      // Unsupported joined scripts still use the untouched straight line.
      ctx.translate(0,path?.supported?0:lineOffset);
      if(path?.supported){
        let inWord=false,wordColour=colours[colourIndex%colours.length];
        for(const glyph of path.glyphs){
          const ink=Boolean(glyph.text.trim());
          let fill=item.colour==='black'?'#000000':item.colour==='white'?'#ffffff':null;
          if(item.colour==='rainbow-letter'){
            fill=colours[colourIndex%colours.length];
            if(ink)colourIndex++;
          }else if(item.colour==='rainbow-word'){
            if(ink&&!inWord){
              wordColour=colours[colourIndex%colours.length];colourIndex++;
            }
            inWord=ink;
            fill=wordColour;
          }
          ctx.save();
          ctx.translate(glyph.x-Math.sin(glyph.angle)*lineOffset,
            glyph.y+Math.cos(glyph.angle)*lineOffset);
          ctx.rotate(glyph.angle);
          ctx.scale(path.shrink,1);
          ctx.textAlign='center';
          if(item.colour==='rainbow-gradient'){
            const left=-path.total/2-glyph.distance/path.shrink;
            const gradient=ctx.createLinearGradient(left,0,left+path.total,0);
            colours.forEach((colour,i)=>gradient.addColorStop(i/6,colour));
            fill=gradient;
          }
          if(item.outline!=='none'&&item.outlineWidth>0){
            // Only the ink fill casts a shadow: never double the glow by
            // shadowing both the dark outline and the filled glyph.
            ctx.save();
            ctx.shadowColor='rgba(0,0,0,0)';
            ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
            ctx.strokeText(glyph.text,0,0);
            ctx.restore();
          }
          ctx.fillStyle=fill||colours[colourIndex%colours.length];
          ctx.fillText(glyph.text,0,0);
          ctx.restore();
        }
        ctx.restore();
        return;
      }
      ctx.scale(shrink,1);
      const start=-total/2;
      let gradient=null;
      if(item.colour==='rainbow-gradient'&&total>0){
        gradient=ctx.createLinearGradient(start,0,start+total,0);
        colours.forEach((colour,i)=>gradient.addColorStop(i/6,colour));
      }else if((item.colour==='rainbow-letter'||item.colour==='rainbow-word')&&total>0){
        const coloursForLine=rainbowTextStops(line,item.colour,colours,colourIndex,
          unit=>ctx.measureText(unit).width);
        colourIndex=coloursForLine.nextIndex;
        gradient=ctx.createLinearGradient(start,0,start+total,0);
        for(const stop of coloursForLine.stops)
          gradient.addColorStop(stop.offset,stop.colour);
      }
      // Critical: draw the entire shaped run only once. Sharp gradient stops
      // recolour letters/words, preserving native ligatures, joining and
      // kerning even when colours change between grapheme clusters.
      if(item.outline!=='none'&&item.outlineWidth>0){
        ctx.save();
        ctx.shadowColor='rgba(0,0,0,0)';
        ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
        ctx.strokeText(line,start,0);
        ctx.restore();
      }
      ctx.fillStyle=item.colour==='black'?'#000000':
        item.colour==='white'?'#ffffff':gradient||colours[colourIndex%colours.length];
      ctx.fillText(line,start,0);
      ctx.restore();
    });
    ctx.restore();
  }
  ctx.restore();
}
