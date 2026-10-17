// Organize the existing live controls into complete adjustment cards on phones.
// Desktop DOM and CSS order are restored losslessly; no duplicate input values,
// recipe code, event listeners, or lock state.
const mobileCardsQuery=window.matchMedia('(max-width:790px)');
const form=document.getElementById('controls');

function setting(name){
  const field=form.elements.namedItem(name);
  if(!field)throw Error('Missing wallpaper setting '+name);
  return field.closest('.lockable-setting') ||
    field.closest('.texture-rotation-field') ||
    field.closest('.layer-add-lock') ||
    field.closest('label');
}
function byId(id){
  const node=document.getElementById(id);
  if(!node)throw Error('Missing wallpaper section '+id);
  return node;
}
// Every relationship is explicit. The first item determines the order of the
// resulting card. Optional child controls remain hidden until enabled.
const definitions=[
  {name:'Geometry',members:()=>[
    setting('geometry'),setting('shapeFrequency'),setting('shapeDepth')]},
  {name:'Stripe pattern',members:()=>[
    setting('motif'),setting('patternHomogeneity')]},
  {name:'Stripe shadows',members:()=>[
    document.querySelector('#panel-design .stripe-shadow-section')]},
  {name:'Outlines',members:()=>[
    setting('outline'),setting('gap')]},
  {name:'Canvas lighting',members:()=>[
    document.querySelector('#panel-colour .lighting-subsection')]},
  {name:'Texture layer 1',members:()=>[
    document.querySelector('#panel-textures .texture-layer-group')]},
  {name:'Texture layer 2',members:()=>[byId('textureLayer2Panel')]},
  {name:'Texture layer 3',members:()=>[byId('textureLayer3Panel')]},
  {name:'Individuality',members:()=>[
    setting('individuality'),setting('overridePatternHomogeneity')]},
];
let groups=[];
function group(){
  if(groups.length)return;
  for(const spec of definitions){
    const members=spec.members();
    if(members.some(n=>!n))throw Error('Incomplete '+spec.name+' editor group');
    const unique=[...new Set(members)];
    const anchor=unique[0];
    const parent=anchor.parentNode;
    const host=document.createElement('div');
    host.className='mobile-setting-cluster';
    host.dataset.group=spec.name;
    host.setAttribute('role','group');
    host.setAttribute('aria-label',spec.name+' controls');
    parent.insertBefore(host,anchor);
    const records=unique.map(node=>{
      const marker=document.createComment('Original position: '+spec.name);
      node.before(marker);
      host.append(node);
      return {node,marker};
    });
    groups.push({host,records});
  }
  document.body.classList.add('mobile-settings-grouped');
  document.dispatchEvent(new Event('mobile-setting-groups-changed'));
}
function restore(){
  if(!groups.length)return;
  for(const {host,records} of groups.slice().reverse()){
    for(const {node,marker} of records){
      marker.replaceWith(node);
    }
    host.remove();
  }
  groups=[];
  document.body.classList.remove('mobile-settings-grouped');
  document.dispatchEvent(new Event('mobile-setting-groups-changed'));
}
function syncGroups(){
  if(mobileCardsQuery.matches)group();
  else restore();
}
mobileCardsQuery.addEventListener('change',syncGroups);
syncGroups();
