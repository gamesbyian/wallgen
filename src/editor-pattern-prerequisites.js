/**
 * Source-linked activation hints for technically available tools with no
 * currently useful sliders. Never mutate dormant recipe values or invent
 * replacement inputs. app.js::inactiveSettingKeys owns the field policy.
 */
export const PATTERN_PREREQUISITE_TOOLS=Object.freeze([
  {tool:'marks',keys:['dotSize','dotSpacing']},
  {tool:'motif-scale',keys:['motifSize','motifFrequency']}
].map(item=>Object.freeze({...item,keys:Object.freeze(item.keys)})));

export function patternToolPrerequisite(tool,{construction='ribbon',motif='solid'}={}){
  if(!PATTERN_PREREQUISITE_TOOLS.some(item=>item.tool===tool))return null;
  if(construction==='woven'||construction==='tonal')
    return {tool:'structure',message:'Choose Patterned ribbon or Fine line in Structure to edit these marks.'};
  if(tool==='motif-scale'){
    if(construction!=='ribbon')
      return {tool:'structure',message:'Choose Patterned ribbon in Structure to size repeated motifs.'};
    return {tool:'patterns',message:'Choose Dots, Stars or another non-solid pattern in Patterns first.'};
  }
  // Dots are meaningful for dotted stroke lines OR the ribbon Dots motif.
  return {tool:'patterns',message:'Choose Dotted line or the Dots stripe pattern in Patterns first.'};
}

export function installPatternPrerequisites({tools,form,select}){
  if(!tools||!form||typeof select!=='function')throw new TypeError('Source editor required');
  const entries=PATTERN_PREREQUISITE_TOOLS.map(({tool,keys})=>{
    const card=tools.get(tool)?.card;
    if(!card)throw new Error('No source card for '+tool);
    const note=document.createElement('div');
    note.className='editor-pattern-prerequisite';
    note.hidden=true;
    note.setAttribute('role','note');
    const text=document.createElement('span');
    const button=document.createElement('button');
    button.type='button';
    button.textContent='Open enabling tool';
    button.setAttribute('aria-label','Open the setting needed to activate '+tools.get(tool).spec.name);
    button.addEventListener('click',()=>{
      const config=patternToolPrerequisite(tool,{
        construction:form.elements.namedItem('construction')?.value,
        motif:form.elements.namedItem('motif')?.value
      });
      if(config)select('stripes',config.tool);
    });
    note.append(text,button);
    card.append(note);
    return {tool,keys,note,text,button};
  });
  function sync(){
    const construction=form.elements.namedItem('construction')?.value||'ribbon';
    const motif=form.elements.namedItem('motif')?.value||'solid';
    for(const entry of entries){
      const entirelyInactive=entry.keys.every(key=>
        form.elements.namedItem(key)?.dataset.inactive==='true');
      const config=entirelyInactive?patternToolPrerequisite(entry.tool,{construction,motif}):null;
      entry.note.hidden=!config;
      if(config){
        entry.text.textContent=config.message;
        entry.button.textContent=config.tool==='structure'?'Go to Structure':'Go to Patterns';
      }
    }
  }
  document.addEventListener('roygbiv-controls-synced',sync);
  document.addEventListener('editor-tool-changed',sync);
  sync();
  return {sync};
}
