/** Prefer the actual source-visible name over a camelCase recipe key.
 * Read a disposable label clone so nested option text, hints, numeric values
 * and per-setting dice never leak into screen-reader action names.
 */
export function sourceSettingLabel(field,key){
  const explicit=field?.getAttribute?.('aria-label')?.trim();
  if(explicit)return explicit;
  const nativeLabel=field?.closest?.('label')||field?.labels?.[0];
  if(nativeLabel){
    const copy=nativeLabel.cloneNode(true);
    for(const control of copy.querySelectorAll('input,select,textarea,button,output,small'))
      control.remove();
    const text=copy.textContent.replace(/\s+/g,' ').trim();
    if(text)return text.slice(0,100);
  }
  return String(key||'Setting').replace(/([a-z0-9])([A-Z])/g,'$1 $2')
    .replace(/[_-]+/g,' ').trim().replace(/^./,char=>char.toUpperCase());
}
// Semantic control grammar. This is an adapter over existing source form
// controls, not a recreated set of input elements or a new recipe engine.
export function controlKind(field,root){
  if(!field||!root)throw new TypeError('An actual source form control is required');
  if(root.classList?.contains('texture-rotation-field'))return 'rotation';
  if(field.type==='range')return 'slider';
  if(field.type==='checkbox')return 'toggle';
  if(field.type==='color')return 'colour';
  if(field.tagName==='SELECT')return 'choice';
  if(field.type==='number')return 'number';
  if(field.tagName==='TEXTAREA')return 'text';
  if(field.type==='hidden')return 'hidden';
  return 'text';
}
export function annotateEditorSettingRow(root,field,key,{category,tool}={}){
  if(!root||!field||!key||!category||!tool)
    throw new TypeError('Canonical source control, setting, category and tool required');
  const kind=controlKind(field,root);
  // A composite can own more than one original setting. Never discard a key
  // or move a source input to fabricate a prettier row.
  const keys=new Set((root.dataset.controlKeys||'').split(' ').filter(Boolean));
  keys.add(key);
  root.dataset.controlKeys=[...keys].join(' ');
  if(root.dataset.controlKind&&root.dataset.controlKind!==kind)
    root.dataset.controlKind='compound';
  else if(!root.dataset.controlKind)
    root.dataset.controlKind=kind;
  root.dataset.controlCategory=category;
  root.dataset.controlTool=tool;
  root.classList.add('editor-setting-row');
  return root;
}
