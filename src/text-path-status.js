// Accurate, accessible selected-text baseline disclosure. The editor must
// explain the same native fallback decisions that the canonical renderer makes,
// without altering authored paths, saved recipes or actual painted glyphs.
import {canCurveText,prepareTextFollowPath} from './text-path-geometry.js';

export function textPathStatus(item,customPath){
  if(!item?.path||item.path==='none')
    return 'Text uses a straight baseline with native browser shaping.';
  const pathName={
    wave:'Wave',arc:'Arch',circle:'Circle',hairpin:'Hairpin',loop:'Loop',
    drawn:'Draw'
  }[item.path]||'curved';
  // Merely having two saved Draw points does not mean a usable stroke
  // exists. The renderer refuses paths shorter than 35 design units.
  if(item.path==='drawn'&&!prepareTextFollowPath(item,customPath))
    return 'Draw a usable path in the Draw tool first. Until then, lettering renders straight; your Draw baseline choice stays saved.';
  const lines=String(item.text||'').split('\n').filter(line=>line.trim());
  const straight=lines.filter(line=>!canCurveText(line)).length;
  if(straight===lines.length&&straight>0)
    return 'This text currently renders straight to preserve native joined or bidirectional glyph shaping. Your '+pathName+' baseline choice stays saved.';
  if(straight)
    return straight+' of '+lines.length+' lines render straight to preserve native glyph shaping; other lines follow the '+pathName+' baseline. Your authored path stays saved.';
  if(item.path==='drawn')
    return 'Using the authored Draw path shape; Horizontal/Vertical move the text along with its curve.';
  return 'This text follows the selected '+pathName+' baseline. Joining or bidirectional text may need native straight-line shaping.';
}
