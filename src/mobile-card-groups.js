// A single horizontal swipe rail owns vertical motion. Related settings form
// self-contained, fixed-height cards, with ZERO nested vertical scroll areas.
// Move the actual controls, never proxies, and restore exact desktop DOM order.
const mobileCardsQuery=window.matchMedia('(max-width:790px)');
const form=document.getElementById('controls');
const panelForLayer=n=>document.getElementById('textureLayer'+n+'Panel');
function setting(name){
  const field=form.elements.namedItem(name);
  if(!field)throw Error('Missing setting '+name);
  return field.closest('.lockable-setting') ||
    field.closest('.texture-rotation-field') ||
    field.closest('label');
}
function layerFields(n){
  const suffix=n===1?'':String(n);
  return {
    material:setting('material'+suffix),
    coverage:setting('textureCoverage'+suffix),
    strength:setting('textureStrength'+suffix),
    scale:setting('textureScale'+suffix),
    rotation:setting('textureRotation'+suffix),
    blend:setting('textureBlend'+suffix),
  };
}
const definitions=[
  {name:'Composition',members:()=>[setting('composition'),setting('repeatCount'),setting('repeatSpacing')]},
  {name:'Direction',members:()=>[setting('orientation'),setting('reverseStripes')]},
  {name:'Diagonal transform',members:()=>[document.getElementById('diagonalSettings')]},
  {name:'Geometry',members:()=>[setting('geometry'),setting('shapeFrequency'),setting('shapeDepth')]},
  {name:'Path details',members:()=>[setting('turnRadius')]},
  {name:'Construction',members:()=>[setting('construction'),setting('tonalContrast'),setting('brushRoughness')]},
  {name:'Line marks',members:()=>[setting('lineStyle'),setting('dotSize'),setting('dotSpacing')]},
  {name:'Stripe pattern',members:()=>[setting('motif'),setting('patternHomogeneity')]},
  {name:'Stripe shadows',members:()=>[document.querySelector('#panel-design .stripe-shadow-section')]},
  {name:'Outlines',members:()=>[setting('outline'),setting('gap')]},
  {name:'Canvas lighting',members:()=>[document.querySelector('#panel-colour .lighting-subsection')]},
  ...[1,2,3].flatMap(n=>[
    {name:'Texture '+n+' material',layer:n,members:()=>{
      const a=layerFields(n);
      return [...(n>1?[panelForLayer(n).querySelector('.texture-layer-panel-head')]:[]),
        a.material,a.coverage,a.blend];
    }},
    {name:'Texture '+n+' finish',layer:n,members:()=>{
      const a=layerFields(n);return [a.strength,a.scale,a.rotation];
    }},
  ]),
  {name:'Individuality',members:()=>[setting('individuality'),setting('overridePatternHomogeneity')]},
];
let groups=[];
function refreshVisibility(){
  for(const {host,spec} of groups){
    host.hidden=Boolean((spec.layer>1&&panelForLayer(spec.layer).hidden)||
      (spec.name==='Diagonal transform'&&document.getElementById('diagonalSettings').hidden));
  }
  document.dispatchEvent(new Event('mobile-setting-groups-changed'));
}
function group(){
  if(groups.length)return;
  for(const spec of definitions){
    const unique=[...new Set(spec.members())];
    if(unique.some(node=>!node))throw Error('Missing '+spec.name+' control');
    const parent=unique[0].parentNode;
    const host=document.createElement('div');
    host.className='mobile-setting-cluster';
    host.dataset.group=spec.name;
    host.setAttribute('role','group');
    host.setAttribute('aria-label',spec.name+' controls');
    parent.insertBefore(host,unique[0]);
    const records=unique.map(node=>{
      const marker=document.createComment('Original position: '+spec.name);
      node.before(marker);host.append(node);
      return {node,marker};
    });
    groups.push({host,records,spec});
  }
  document.body.classList.add('mobile-settings-grouped');
  refreshVisibility();
}
function restore(){
  if(!groups.length)return;
  for(const {host,records} of [...groups].reverse()){
    for(const {node,marker} of records)marker.replaceWith(node);
    host.remove();
  }
  groups=[];
  document.body.classList.remove('mobile-settings-grouped');
  document.dispatchEvent(new Event('mobile-setting-groups-changed'));
}
const watch=new MutationObserver(refreshVisibility);
for(const n of [2,3])watch.observe(panelForLayer(n),{attributes:true,attributeFilter:['hidden']});
watch.observe(document.getElementById('diagonalSettings'),{attributes:true,attributeFilter:['hidden']});
function syncGroups(){if(mobileCardsQuery.matches)group();else restore();}
mobileCardsQuery.addEventListener('change',syncGroups);
syncGroups();
