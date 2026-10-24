// Pure colour segmentation for type that remains painted as one fully
// shaped line. Splitting a line into separate fillText(glyph) calls destroys
// Arabic joining, kerning, ligatures and some complex-script positioning.
export const textGraphemes=value=>typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'?
  Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value),p=>p.segment):
  Array.from(value);
export function rainbowTextStops(line,mode,colours,startIndex,measure){
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
  return {stops,nextIndex:colourIndex};
}
