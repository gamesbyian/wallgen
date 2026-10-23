// Read the *actual rendered* tool rail. Applicability belongs to editor-layout,
// which hides controls the current scene cannot use. Never fork that policy
// with a second geometry/structure-specific swipe inventory.
export function visibleMobileTools(chips,category){
  return [...chips].filter(chip=>
    chip.dataset.category===category && !chip.hidden && !chip.disabled)
    .map(chip=>({id:chip.dataset.editorTool,
      name:chip.querySelector?.('span')?.textContent?.trim()||
        chip.textContent.trim()}));
}
export function adjacentVisibleMobileTool(choices,currentId,direction){
  const index=choices.findIndex(tool=>tool.id===currentId);
  if(index<0)return null;
  const next=Math.max(0,Math.min(choices.length-1,index+Math.sign(direction)));
  return next===index?null:choices[next].id;
}
