// Small, auditable arithmetic grammar for vector-angle inspectors.
// No eval/Function, no browser state, no implicit percentages or pixels.
// Leading minus denotes an absolute negative angle; relative edits use
// explicit += / -= / *= / /= to avoid silently changing that meaning.
const N=String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?`;
const ABSOLUTE=new RegExp(String.raw`^(${N})\s*(?:°|deg)?$`,'i');
const RELATIVE=new RegExp(String.raw`^([+*/-])=\s*(${N})\s*(°|deg)?$`,'i');
const BINARY=new RegExp(String.raw`^(${N})\s*([+*/-])\s*(${N})\s*(?:°|deg)?$`,'i');
const operate=(a,op,b)=>op==='+'?a+b:op==='-'?a-b:
  op==='*'?a*b:op==='/'&&b!==0?a/b:NaN;
export function parseAngleExpression(input,current){
  if(typeof input!=='string'||!Number.isFinite(current)||input.length>64)return null;
  const text=input.trim().replace(/\u2212/g,'-').replace(/\u00d7/g,'*').replace(/\u00f7/g,'/');
  if(!text)return null;
  const absolute=ABSOLUTE.exec(text);
  if(absolute){
    const value=Number(absolute[1]);
    return Number.isFinite(value)?value:null;
  }
  const relative=RELATIVE.exec(text);
  if(relative){
    if(relative[3]&&(relative[1]==='*'||relative[1]==='/'))return null;
    const value=operate(current,relative[1],Number(relative[2]));
    return Number.isFinite(value)?value:null;
  }
  const binary=BINARY.exec(text);
  if(binary){
    const value=operate(Number(binary[1]),binary[2],Number(binary[3]));
    return Number.isFinite(value)?value:null;
  }
  return null;
}
