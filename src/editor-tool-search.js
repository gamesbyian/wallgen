/** Return the first tool actually available in the active scene.
 * A setting that exists in the schema but cannot be used here must never
 * silently navigate to an unrelated fallback tool.
 */
export function findEditorToolMatch(query,toolList,{applies=()=>true,labelFor=key=>key,aliasesForTool=()=>[],aliasesForSetting=()=>[],aliasesForCategory=()=>[]}={}){
  const term=String(query??'').trim().toLowerCase();
  if(!term)return null;
  return toolList.find(tool=>applies(tool)&&(
    tool.name.toLowerCase().includes(term)||
    [...aliasesForTool(tool.id),...aliasesForCategory(tool.category)].some(alias=>
      String(alias).toLowerCase().includes(term))||
    tool.settings.some(key=>String(key).toLowerCase().includes(term)||
      String(labelFor(key)||key).toLowerCase().includes(term)||
      aliasesForSetting(key).some(alias=>String(alias).toLowerCase().includes(term)))
  ))||null;
}


// Small, authored vocabulary from the human-intent navigation map. This is
// intentionally not an NLP classifier and does not invent new controls.
export const SETTING_INTENT_ALIASES=Object.freeze({
  spread:['breathing room','space between stripes','separate stripes','stripe clearance'],
  stripeWidth:['thicker stripes','thinner stripes','thickness of the rainbow'],
  scatteredSpacing:['space between circles','circle clearance','space between shapes'],
  scatteredEdgeCrop:['cropped circles','off-frame circles','partially visible shapes'],
  scatteredOverlap:['overlap circles','overlapping shapes'],
  shapeDepth:['bigger bends','deeper waves','wave amplitude'],
  chaos:['irregular paths','more wild lines','geometric irregularity'],
  individuality:['stripe differences','different stripes','individual rainbow bands'],
  textureDisplacement:['texture changes edges','rough stripe contours','distort contours','textured edges'],
  material:['paper texture','fabric texture','cloth texture','material surface'],
  glow:['neon','make it glow','glowing stripes'],
  stripeShadowStrength:['cast shadow','stripe shadows'],
  lightingMood:['ambient light','overall lighting','lighting atmosphere'],
  rayCore:['hole in the middle','radial centre hole','pinwheel centre gap'],
  fieldCenterX:['off centre radial','move burst centre'],
  outlineBuffer:['space between outline and stripe','outline distance'],
  motifSize:['pattern size','smaller motifs','bigger motifs'],
  dotSpacing:['denser dots','space between dots'],
  dotSize:['smaller dots','larger dots']
});
const normalizeQuery=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
const bestTextScore=(query,values,{exact=120,prefix=90,substring=60}={})=>{
  let best=0;
  for(const value of values){
    const candidate=normalizeQuery(value);
    if(!candidate)continue;
    if(candidate===query)best=Math.max(best,exact);
    else if(candidate.startsWith(query))best=Math.max(best,prefix);
    else if(candidate.includes(query))best=Math.max(best,substring);
  }
  return best;
};

/**
 * Return a specific accessible setting (or an actual named tool), with its
 * source home. Exact setting labels outrank an unrelated partial tool name.
 * The caller supplies real scene applicability; no fallback to a hidden tool.
 * An inactive field is still found within a visible tool so the UI can
 * explain its prerequisite rather than pretending the setting is missing.
 */
export function findEditorSearchHit(query,toolList,{
  applies=()=>true,labelFor=key=>key,aliasesForTool=()=>[],
  aliasesForSetting=()=>[],aliasesForCategory=()=>[]
}={}){
  const term=normalizeQuery(query);
  if(!term)return null;
  let winner=null,order=0;
  const consider=result=>{
    if(!winner||result.score>winner.score||
      (result.score===winner.score&&result.order<winner.order))winner=result;
  };
  for(const tool of toolList){
    const sequence=order++;
    if(!applies(tool))continue;
    const toolScore=bestTextScore(term,[tool.name,...aliasesForTool(tool.id)],
      {exact:105,prefix:78,substring:52});
    const categoryScore=bestTextScore(term,aliasesForCategory(tool.category),
      {exact:43,prefix:34,substring:24});
    if(toolScore||categoryScore)consider({
      tool,key:null,label:tool.name,score:Math.max(toolScore,categoryScore),
      order:sequence,kind:'tool'
    });
    for(const key of tool.settings){
      const label=String(labelFor(key)||key);
      const score=Math.max(
        bestTextScore(term,[key,label],{exact:130,prefix:100,substring:73}),
        bestTextScore(term,aliasesForSetting(key),{exact:118,prefix:93,substring:68}),
        bestTextScore(term,SETTING_INTENT_ALIASES[key]||[],
          {exact:112,prefix:88,substring:65})
      );
      if(score)consider({tool,key,label,score,order:sequence,kind:'setting'});
    }
  }
  if(!winner)return null;
  const {order:_order,...result}=winner;
  return result;
}
