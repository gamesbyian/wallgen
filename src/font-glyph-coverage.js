// Non-invasive OpenType 'cmap' coverage inspection for already-verified
// bundled or privately imported TTF/OTF bytes. The native browser renderer
// remains authoritative for actual shaping. An unmapped codepoint means the
// selected font cannot draw that glyph itself and may silently fall back.
// This module never stores raw font bytes, contacts a server or edits recipes.
const coverageByFont=new Map();
const viewBounds=(start,size,length)=>Number.isSafeInteger(start)&&
  Number.isSafeInteger(size)&&start>=0&&size>=0&&start+size<=length;
export function inspectFontCmap(bytes){
  if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<12||
    bytes.byteLength>5*1024*1024)return null;
  const data=new DataView(bytes),len=bytes.byteLength;
  const u16=i=>data.getUint16(i,false),u32=i=>data.getUint32(i,false);
  const tag=u32(0);
  if(tag!==0x00010000&&tag!==0x4f54544f&&tag!==0x74727565)return null;
  const tables=u16(4);
  if(tables>256||!viewBounds(12,tables*16,len))return null;
  let table=null;
  for(let i=0;i<tables;i++){
    const at=12+i*16;
    if(u32(at)===0x636d6170){
      const offset=u32(at+8),size=u32(at+12);
      if(!viewBounds(offset,size,len)||size<4)return null;
      table={offset,size};break;
    }
  }
  if(!table)return null;
  const base=table.offset,end=base+table.size;
  const count=u16(base+2);
  if(count>100||!viewBounds(base+4,count*8,end))return null;
  let chosen=null;
  for(let i=0;i<count;i++){
    const rec=base+4+i*8;
    const platform=u16(rec),encoding=u16(rec+2),offset=u32(rec+4);
    if(platform!==0&&!(platform===3&&(encoding===1||encoding===10)))
      continue;
    const at=base+offset;
    if(!viewBounds(at,2,end))continue;
    const format=u16(at);
    // Unicode full repertoire (format 12) is preferable to BMP-only format 4.
    const priority=format===12?2:format===4?1:0;
    if(!priority||priority<=(chosen?.priority||0))continue;
    chosen={at,format,priority};
  }
  if(!chosen)return null;
  const {at,format}=chosen;
  if(format===12){
    if(!viewBounds(at,16,end))return null;
    const size=u32(at+4),groups=u32(at+12);
    if(groups>65536||size<16||!viewBounds(at,size,end)||
      !viewBounds(at+16,groups*12,at+size))return null;
    const ranges=[];
    for(let i=0;i<groups;i++){
      const pos=at+16+i*12,start=u32(pos),stop=u32(pos+4),glyph=u32(pos+8);
      if(start>stop||stop>0x10ffff||glyph>0xffff||
        (ranges.length&&start<=ranges.at(-1).stop))return null;
      ranges.push({start,stop,glyph});
    }
    return Object.freeze({
      format,has(codepoint){
        if(!Number.isInteger(codepoint)||codepoint<0||codepoint>0x10ffff)
          return false;
        let lo=0,hi=ranges.length-1;
        while(lo<=hi){
          const mid=(lo+hi)>>1,range=ranges[mid];
          if(codepoint<range.start)hi=mid-1;
          else if(codepoint>range.stop)lo=mid+1;
          else return range.glyph+(codepoint-range.start)>0;
        }
        return false;
      },
    });
  }
  if(!viewBounds(at,16,end))return null;
  const size=u16(at+2),segments=u16(at+6)/2;
  if(size<16||!Number.isInteger(segments)||segments<1||segments>8192||
    !viewBounds(at,size,end))return null;
  const stop=at+14,start=stop+segments*2+2,
    delta=start+segments*2,rangeOffset=delta+segments*2;
  if(!viewBounds(rangeOffset,segments*2,at+size))return null;
  const ranges=[];
  for(let i=0;i<segments;i++){
    const first=u16(start+2*i),last=u16(stop+2*i);
    if(first>last||(ranges.length&&first<=ranges.at(-1).last))return null;
    const offset=u16(rangeOffset+2*i);
    // Materialize at most the 65,536 BMP glyph IDs rather than retaining
    // a DataView (and therefore the entire private font ArrayBuffer) in
    // this long-lived UI cache. Header-only delta segments need no array.
    let glyphs=null;
    if(offset){
      glyphs=new Uint16Array(last-first+1);
      for(let n=0;n<glyphs.length;n++){
        const pos=rangeOffset+2*i+offset+2*n;
        glyphs[n]=viewBounds(pos,2,at+size)?u16(pos):0;
      }
    }
    ranges.push({first,last,delta:u16(delta+2*i),glyphs});
  }
  return Object.freeze({
    format,has(cp){
      if(!Number.isInteger(cp)||cp<0||cp>0xffff)return false;
      let lo=0,hi=ranges.length-1;
      while(lo<=hi){
        const mid=(lo+hi)>>1,seg=ranges[mid];
        if(cp<seg.first)hi=mid-1;
        else if(cp>seg.last)lo=mid+1;
        else{
          if(!seg.glyphs)return ((cp+seg.delta)&0xffff)!==0;
          const value=seg.glyphs[cp-seg.first];
          return value!==0&&((value+seg.delta)&0xffff)!==0;
        }
      }
      return false;
    },
  });
}
// Bounds and native FontFace.load already validated elsewhere. Inability to
// inspect an unusual cmap is UNKNOWN, never an invented unsupported verdict.
export function rememberFontCoverage(id,bytes){
  if(typeof id!=='string'||id.length>90)return null;
  const coverage=inspectFontCmap(bytes);
  coverageByFont.set(id,coverage);
  return coverage;
}
export const cachedFontCoverage=id=>coverageByFont.get(id)||null;
export const fontCoverageChecked=id=>coverageByFont.has(id);
export function missingFontCodepoints(coverage,text){
  if(!coverage||typeof coverage.has!=='function'||typeof text!=='string')
    return null;
  const missing=new Set();
  for(const char of text){
    const cp=char.codePointAt(0);
    // Formatting controls/variation selectors do not need their own outline.
    if(/\s/u.test(char)||cp<0x20||cp===0x200c||cp===0x200d||
      (cp>=0xfe00&&cp<=0xfe0f)||(cp>=0xe0100&&cp<=0xe01ef)||
      cp>=0x202a&&cp<=0x202e||cp>=0x2066&&cp<=0x2069)continue;
    if(!coverage.has(cp))missing.add(cp);
  }
  return [...missing].sort((a,b)=>a-b);
}
export function missingGlyphNotice(coverage,text){
  const missing=missingFontCodepoints(coverage,text);
  if(missing===null)return 'Exact glyph coverage is unavailable for this font.';
  if(!missing.length)return '';
  const samples=missing.slice(0,6).map(n=>'U+'+n.toString(16).toUpperCase().padStart(4,'0'));
  return 'This typeface does not contain '+missing.length+' character'+
    (missing.length===1?'':'s')+' ('+samples.join(', ')+
    (missing.length>6?', …':'')+'). The browser may substitute glyphs from another font.';
}
