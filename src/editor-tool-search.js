/** Return the first tool actually available in the active scene.
 * A setting that exists in the schema but cannot be used here must never
 * silently navigate to an unrelated fallback tool.
 */
export function findEditorToolMatch(query,toolList,{applies=()=>true,labelFor=key=>key}={}){
  const term=String(query??'').trim().toLowerCase();
  if(!term)return null;
  return toolList.find(tool=>applies(tool)&&(
    tool.name.toLowerCase().includes(term)||
    tool.settings.some(key=>String(key).toLowerCase().includes(term)||
      String(labelFor(key)||key).toLowerCase().includes(term))
  ))||null;
}
