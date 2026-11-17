// Presentation and editing contract for settings inherited from Starting style.
// 'auto' is canonical recipe state, never a visible select option.
// Family and orientation have their own intentional Surprise me semantics.
export const STYLE_INHERITABLE_KEYS=Object.freeze([
  'geometry','motif','palette','outline','material'
]);

export function isStyleInherited(recipe,key){
  return STYLE_INHERITABLE_KEYS.includes(key)&&recipe[key]==='auto';
}

export function effectiveStyleValue(recipe,scene,key){
  if(!STYLE_INHERITABLE_KEYS.includes(key))
    throw new RangeError('Not a style-inheritable setting: '+key);
  return isStyleInherited(recipe,key)?scene[key]:recipe[key];
}

// All unrelated form edits must preserve an existing 'auto' even though
// the native select now shows its effective concrete choice.
export function storedStyleValue(key,recipe,controlValue){
  return isStyleInherited(recipe,key)?'auto':controlValue;
}

// A direct edit, including deliberately pinning the effective SAME value,
// is an explicit override. 'auto' restores live inheritance.
export function withStyleChoice(recipe,key,value){
  if(!STYLE_INHERITABLE_KEYS.includes(key))
    throw new RangeError('Not a style-inheritable setting: '+key);
  return {...recipe,[key]:value};
}
