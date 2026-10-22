// Stable authored-object choices derived from the same scene objects consumed
// by the renderer. Choices never change recipe state or reindex the objects.
const NAMES=['Red','Orange','Yellow','Green','Blue','Indigo','Violet'];
export function embroideryObjectChoices(scene){
  const results=[],seen=new Set();
  for(const object of scene?.objects||[]){
    if(object.kind==='path-group'){
      for(const stripe of object.stripes||[]){
        const index=Number(stripe.index);
        if(!Number.isInteger(index)||index<0||index>6)continue;
        const id=object.id+'/stripe-'+index;
        if(seen.has(id))continue;
        seen.add(id);
        results.push({id,label:(stripe.name||NAMES[index])+
          ' · Ribbon '+(index+1)+(scene.objects.length>1?' · '+object.id:'')});
      }
    }else if(object.kind==='region'&&typeof object.id==='string'){
      if(seen.has(object.id))continue;
      seen.add(object.id);
      const slot=Number.isInteger(object.colorIndex)?object.colorIndex:-1;
      results.push({id:object.id,label:(NAMES[slot]||'Colour')+
        ' · '+(scene.structure==='radial'?'Region ':'Shape ')+
        (results.length+1)});
    }
    if(results.length>=256)break;
  }
  return results.slice(0,256);
}
// A removed/renamed object is represented honestly in the control, preserving
// the saved assignment until the user explicitly picks another object.
export function resolveEmbroideryObjectChoice(choices,storedId){
  const desired=typeof storedId==='string'?storedId:'';
  if(desired&&!choices.some(choice=>choice.id===desired))
    return {selected:desired,options:[...choices,
      {id:desired,label:'Unavailable saved object · '+desired,missing:true}]};
  return {selected:desired||choices[0]?.id||'',options:choices};
}
