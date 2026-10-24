import {DESIGN_WIDTH,DESIGN_HEIGHT} from './model.js';
import {TEXT_FONTS} from './text-overlays.js';
import {fontFamilyForId,isLocalFontId,localFontsReady} from './local-fonts.js';

// The same post-composite typography pass is used by reference, worker,
// thumbnail, headless, and preview-cache composition. Never render DOM text
// over the preview: it would disappear from PNG exports.
const fallbackRainbow=['#FF474E','#FF9B39','#FFE25B','#4FDD87','#53AAFF','#6359E5','#BB64ED'];
const graphemes=value=>typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'?
  Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value),p=>p.segment):
  Array.from(value);
export function drawTextOverlays(ctx,width,height,scene){
  if(!scene?.textOverlays?.length)return;
  if(!localFontsReady(scene))throw Error('Local font unavailable: prepare fonts before painting');
  const colours=scene.stripes?.length===7?
    scene.stripes.map(item=>item.color):fallbackRainbow;
  ctx.save();
  // Text placement is expressed in canonical 600 x 1300 wallpaper units.
  // Thus a preview and 3024x6552 export retain the same design geometry.
  ctx.scale(width/DESIGN_WIDTH,height/DESIGN_HEIGHT);
  for(const item of scene.textOverlays){
    if(!item.enabled||!item.text)continue;
    ctx.save();
    ctx.translate(DESIGN_WIDTH*item.x/100,DESIGN_HEIGHT*item.y/100);
    ctx.rotate(item.rotation*Math.PI/180);
    ctx.globalAlpha=item.opacity;
    ctx.font='bold '+item.size+'px '+(isLocalFontId(item.font)?
      '"'+fontFamilyForId(item.font)+'"':TEXT_FONTS[item.font]);
    ctx.textAlign='left';
    ctx.textBaseline='middle';
    ctx.lineJoin='round';
    ctx.miterLimit=2;
    ctx.lineWidth=item.size*item.outlineWidth/100;
    ctx.strokeStyle=item.outline==='white'?'#ffffff':'#000000';
    const lines=item.text.split('\n');
    let colourIndex=0;
    const lineHeight=item.size*1.17;
    lines.forEach((line,lineIndex)=>{
      const total=ctx.measureText(line).width;
      const shrink=total>DESIGN_WIDTH*.94?DESIGN_WIDTH*.94/total:1;
      ctx.save();
      ctx.translate(0,(lineIndex-(lines.length-1)/2)*lineHeight);
      ctx.scale(shrink,1);
      const start=-total/2;
      let x=start;
      let units;
      if(item.colour==='rainbow-letter')units=graphemes(line);
      else if(item.colour==='rainbow-word')units=line.match(/\s+|\S+/gu)||[];
      else units=[line];
      const gradient=item.colour==='rainbow-gradient'&&total>0?
        ctx.createLinearGradient(start,0,start+total,0):null;
      if(gradient)colours.forEach((c,i)=>gradient.addColorStop(i/6,c));
      for(const unit of units){
        const unitWidth=ctx.measureText(unit).width;
        if(item.outline!=='none'&&item.outlineWidth>0)ctx.strokeText(unit,x,0);
        ctx.fillStyle=item.colour==='black'?'#000000':
          item.colour==='white'?'#ffffff':gradient||
          colours[colourIndex%colours.length];
        ctx.fillText(unit,x,0);
        x+=unitWidth;
        if(item.colour==='rainbow-letter'&&unit.trim())colourIndex++;
        if(item.colour==='rainbow-word'&&unit.trim())colourIndex++;
      }
      ctx.restore();
    });
    ctx.restore();
  }
  ctx.restore();
}
