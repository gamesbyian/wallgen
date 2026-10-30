// Precision for existing slider-value fields, expressed in their ORIGINAL
// input units. Reuse the audited angle arithmetic grammar without letting
// degree, pixel or relative-percent units leak into scalar controls.
import {parseAngleExpression} from './precision-angle-expression.js';
const scalarCharacters=/^[0-9eE+*/=.\s\-−×÷]+$/;
const absolutePercent=/^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\s*%\s*$/;
export function parseScalarExpression(input,current,{min,max,step=1,unit='unitless'}={}){
  if(typeof input!=='string'||!Number.isFinite(current)||input.length>64||
    ![min,max,step].every(Number.isFinite)||min>max||step<=0||
    !['percent','count','unitless','angle'].includes(unit))return null;
  let expression=input.trim();
  if(unit==='percent'&&absolutePercent.test(expression))
    expression=expression.replace(/%\s*$/,'').trim();
  if(unit==='angle'){
    // The same angle grammar handles explicit degree suffixes and bounds.
    const degrees=parseAngleExpression(expression,current);
    if(degrees===null)return null;
    expression=String(degrees);
  }else if(!scalarCharacters.test(expression))return null;
  // Relative percentages require distinct additive versus multiplicative
  // meanings; reject them rather than silently guessing.
  const parsed=parseAngleExpression(expression,current);
  if(parsed===null)return null;
  const clamped=Math.max(min,Math.min(max,parsed));
  const rounded=min+Math.round((clamped-min)/step)*step;
  const result=Math.max(min,Math.min(max,rounded));
  return Number.isFinite(result)?Number(result.toFixed(9)):null;
}
