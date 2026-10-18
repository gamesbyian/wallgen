import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

/** Self-contained, offline-friendly contact sheet for the Actions ZIP. */
export async function writeAtlasReport(out,{cases,errors,inapplicable}){
  const payload=JSON.stringify({cases,errors,inapplicable}).replace(/</g,'\\u003c');
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ROYGBIV · UI atlas</title><style>
:root {color-scheme: dark; font:14px system-ui,sans-serif;background:#12131a;color:#f2f1f9}
*{box-sizing:border-box} body{margin:0} header{position:sticky;top:0;background:#171923;
border-bottom:1px solid #505466;padding:16px;z-index:4}
h1{font-size:21px;margin:0 0 8px}.small{color:#b7bbcf}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
select,input{background:#292d3d;color:inherit;border:1px solid #69718c;border-radius:6px;padding:9px}
input{min-width:260px;flex:1}main{padding:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
figure{margin:0;border:1px solid #45485e;border-radius:9px;overflow:hidden;background:#242633}
figure img{display:block;max-width:100%;width:100%;height:320px;object-fit:contain;object-position:center top}
figcaption{padding:9px 10px;overflow-wrap:anywhere}
figcaption strong{display:block;font-size:12px}figcaption span{display:block;color:#b7bbcf;font-size:11px}
figure a{display:block}section{margin:20px 0}
details{margin:12px 0;padding:10px;border:1px solid #505466;border-radius:8px}
code{overflow-wrap:anywhere}
</style></head><body><header><h1>ROYGBIV · UI state atlas</h1>
<div id="summary" class="small">Screenshots are UI captures, with wallpaper imagery masked.</div>
<div class="controls"><select id="profile" aria-label="Viewport profile"><option value="">All viewports</option></select>
<select id="zoom" aria-label="UI zoom"><option value="">All zoom levels</option></select>
<select id="kind" aria-label="State type"><option value="">All state types</option></select>
<input id="query" type="search" placeholder="Filter by control, tool, structure, state…" aria-label="Filter screenshots"></div>
</header><main><details><summary>Traversal failures (<span id="errorCount"></span>) and intentionally inapplicable tools (<span id="skipCount"></span>)</summary>
<p class="small">An inapplicable tool is excluded by the app's selected structure or construction. A failure represents an attempted but unverified capture.</p>
<pre id="issues"></pre></details>
<section id="status" class="small"></section><div id="grid" class="grid"></div></main>
<script id="atlas-data" type="application/json">${payload}</script>
<script>
const data=JSON.parse(document.getElementById('atlas-data').textContent);
const byId=id=>document.getElementById(id);
const unique=key=>[...new Set(data.cases.map(x=>x[key]))].filter(Boolean).sort();
for(const [key,values] of Object.entries({profile:unique('profile'),zoom:unique('zoomPercent'),kind:unique('kind')})){
  const control=byId(key);
  for(const v of values){const o=document.createElement('option');o.value=String(v);
  o.textContent=key==='zoom'?v+'%':v;control.append(o);}
}
byId('errorCount').textContent=data.errors.length;
byId('skipCount').textContent=data.inapplicable.length;
byId('issues').textContent=JSON.stringify({errors:data.errors,inapplicable:data.inapplicable},null,2);
byId('summary').textContent=data.cases.length+' captures · '+unique('profile').length+' viewports · 4 zoom levels · '+data.errors.length+' traversal failures';
function show(){
 const match=data.cases.filter(x=>(!byId('profile').value||x.profile===byId('profile').value)
 &&(!byId('zoom').value||String(x.zoomPercent)===byId('zoom').value)
 &&(!byId('kind').value||x.kind===byId('kind').value)
 &&(!byId('query').value||JSON.stringify(x).toLowerCase().includes(byId('query').value.toLowerCase())));
 byId('status').textContent='Showing '+match.length+' of '+data.cases.length+' screenshots';
 const frag=document.createDocumentFragment();
 for(const x of match.slice(0,750)){
  const figure=document.createElement('figure');
  const link=document.createElement('a');link.href=x.file;link.target='_blank';link.rel='noopener';
  const img=document.createElement('img');img.loading='lazy';img.alt=x.id;img.src=x.file;link.append(img);
  const caption=document.createElement('figcaption');
  const strong=document.createElement('strong');strong.textContent=x.id.split('/').at(-1);
  const span=document.createElement('span');span.textContent=x.profile+' · '+x.zoomPercent+'% · '+x.kind;
  caption.append(strong,span);figure.append(link,caption);frag.append(figure);
 }
 byId('grid').replaceChildren(frag);
 if(match.length>750)byId('status').textContent+=' (showing first 750; filter to narrow)';
}
for(const id of ['profile','zoom','kind','query'])byId(id).addEventListener('input',show);
show();
</script></body></html>`;
  await writeFile(join(out,'index.html'),html);
}
