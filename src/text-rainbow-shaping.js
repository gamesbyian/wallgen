// Pure colour segmentation for type that remains painted as one fully
// shaped line. Splitting a line into separate fillText(glyph) calls destroys
// Arabic joining, kerning, ligatures and some complex-script positioning.
// Conservative, lazy fallback when a browser has no Intl.Segmenter. It is
// deliberately not a complete UAX #29 implementation. Joining marks, emoji
// modifiers, variation selectors, ZWJ sequences and regional-indicator pairs
// must never be split across saved-text limits or rainbow colour boundaries.
// Remaining complex-language shaping stays native/straight in canCurveText.
const trailingGraphemePart=/[\p{Mark}\p{Emoji_Modifier}]/u;
const regionalIndicator=/\p{Regional_Indicator}/u;
const emojiTag=/[\u{e0020}-\u{e007f}]/u;
export function* fallbackTextGraphemes(value){
  let cluster='',regionalCount=0;
  for(const char of value){
    const regional=regionalIndicator.test(char);
    const join=cluster&&(trailingGraphemePart.test(char)||
      emojiTag.test(char)||char==='\u200d'||cluster.endsWith('\u200d')||
      (regional&&regionalCount===1));
    if(join){
      cluster+=char;
      if(regional)regionalCount++;
    }else{
      if(cluster)yield cluster;
      cluster=char;
      regionalCount=regional?1:0;
    }
  }
  if(cluster)yield cluster;
}
export const textGraphemes=value=>typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'?
  Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value),p=>p.segment):
  Array.from(fallbackTextGraphemes(value));
// Only unambiguous Arabic/Hebrew-only strong-letter runs can have their
// horizontal colour ordering reversed without a full Unicode Bidi resolver.
// Numbers and other scripts can reorder independently, so preserve the
// established native-shaped line and its previous colour mapping instead.
export function isSimpleRightToLeft(line){
  let found=false;
  for(const glyph of String(line||'')){
    if(/\p{Number}/u.test(glyph))return false;
    if(/[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(glyph)){
      found=true;continue;
    }
    if(/\p{Letter}/u.test(glyph))return false;
  }
  return found;
}
// Pure direction controls alter Bidi layout but have no visible ink and must
// not consume a rainbow-letter/word colour slot between real glyphs.
const directionOnly=/^[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]+$/u;
export function rainbowTextStops(line,mode,colours,startIndex,measure,{rightToLeft=false}={}){
  if(!['rainbow-letter','rainbow-word'].includes(mode))
    throw Error('Unknown rainbow segmentation mode');
  if(!Array.isArray(colours)||!colours.length)throw Error('Rainbow palette is empty');
  const units=mode==='rainbow-letter'?textGraphemes(line):line.match(/\s+|\S+/gu)||[];
  let colourIndex=startIndex,weight=0;
  const spans=[];
  for(const unit of units){
    const raw=Number(measure(unit));
    const width=Number.isFinite(raw)?Math.max(0,raw):0;
    spans.push({width,colour:colours[colourIndex%colours.length]});
    weight+=width;
    if(unit.trim())colourIndex++;
  }
  if(!spans.length||weight===0)
    return {stops:[],nextIndex:colourIndex};
  // Normalizing individual advances to the measured *whole* line gives
  // bounded monotonic stop positions even when ligatures/Arabic joining
  // compress the actual shaped run. The Canvas paints that intact run once.
  const stops=[{offset:0,colour:spans[0].colour}];
  let cursor=0;
  for(let i=0;i<spans.length-1;i++){
    cursor+=spans[i].width;
    if(spans[i].colour===spans[i+1].colour)continue;
    const offset=Math.min(1,Math.max(0,cursor/weight));
    stops.push({offset,colour:spans[i].colour},
      {offset,colour:spans[i+1].colour});
  }
  stops.push({offset:1,colour:spans.at(-1).colour});
  // Canvas2D paints RTL letters visually right-to-left even when the logical
  // text begins with the first (red) rainbow glyph. Reflect the *stops* and
  // reverse their order; never split/reorder native joined text itself.
  const visual=rightToLeft?stops.slice().reverse().map(stop=>({
    offset:1-stop.offset,colour:stop.colour
  })):stops;
  return {stops:visual,nextIndex:colourIndex};
}
