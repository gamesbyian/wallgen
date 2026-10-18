#!/usr/bin/env node
/**
 * ROYGBIV recipe-to-phone-video preparation. This tool NEVER opens a browser,
 * renders an image or starts recording. The executable recorder is deliberately
 * a separate follow-up stage requiring explicit authorization.
 *
 * Usage: node scripts/prepare-phone-video.mjs --recipe path/to/recipe.json
 *        [--out artifacts/phone-video/manifest.json]
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { normalizeRecipe, encodeRecipe } from '../src/model.js';
import { EDITOR_CATEGORIES, SETTING_TOOL, WIZARD_STEPS } from '../src/editor-schema.js';

function args(argv) {
  const result = {};
  for (let i=0; i<argv.length; i++) {
    const k=argv[i];
    if (k==='--help') { result.help=true; continue; }
    if (k!=='--recipe' && k!=='--out') throw new Error('Unknown option: '+k);
    if (!argv[i+1] || argv[i+1].startsWith('--')) throw new Error('Missing value for '+k);
    result[k.slice(2)]=argv[++i];
  }
  return result;
}
function safeEqual(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function buildManifest(input) {
  if (!input || typeof input!=='object' || Array.isArray(input)) throw Error('Recipe must be an object');
  if (input.version!==2) throw Error('Only current v2 recipes are supported, got version '+input.version);
  const defaults=normalizeRecipe();
  const target=normalizeRecipe(input);
  const missing=Object.keys(input).filter(k=>!(k in target));
  if (missing.length) throw Error('Unknown recipe keys: '+missing.join(', '));
  const normalizedChanges=Object.keys(target).filter(k=>!safeEqual(defaults[k],target[k]));
  const stages=[];
  const owned=new Set();
  for (const category of EDITOR_CATEGORIES) {
    const steps=[];
    for (const tool of category.tools) {
      const changed=tool.settings.filter(key=>normalizedChanges.includes(key));
      for (const key of changed) owned.add(key);
      if (changed.length) steps.push({tool:tool.id,label:tool.name,
        controls:changed.map(key=>({key,from:defaults[key],to:target[key]}))});
    }
    if (steps.length) stages.push({category:category.id,label:category.label,steps});
  }
  const special=[];
  if (target.customPath?.length) special.push({
    kind:'drawn-path',pointCount:target.customPath.length,
    note:'Must be reproduced using the real Draw Path tool; points may fall beyond canvas. Do not silently import recipe to simulate drawing.'
  });
  if (target.interiorElements?.length) special.push({
    kind:'interior-elements',count:target.interiorElements.length,
    enabled:target.interiorElements.filter(e=>e.enabled).length,
    note:'Use Details > Elements controls including ordering, placements and disabled elements.'
  });
  const unowned=normalizedChanges.filter(key=>!owned.has(key)
    && !['customPath','interiorElements','seed','drawnAnchors','drawnCorners','lockedSettings','lockedResolved','positionX','positionY','viewZoom','primesOnly'].includes(key));
  const blockers=[];
  if (target.customPath?.length) blockers.push('Exact off-canvas custom-path tracing needs a tested UI pointer/camera mapping.');
  if (target.interiorElements?.length) blockers.push('Interior element editing needs verified selectors and interactions.');
  if (unowned.length) blockers.push('Changed settings without editor-schema ownership: '+unowned.join(', '));
  return {
    schema:'roygbiv-phone-video-preparation/v1',status:'prepared-not-recorded',
    sourceVersion:input.version,seed:target.seed,phone:{width:412,height:915,deviceScaleFactor:1},
    target:{recipe:target,shareCode:encodeRecipe(target)},
    buildOrder:WIZARD_STEPS,stages,special,unowned,blockers,
    recording:{enabled:false,started:false,format:'mp4',destination:'artifacts/phone-video/',
      safety:'No video or browser launch is implemented by this preparation script.'}
  };
}
async function main() {
  const options=args(process.argv.slice(2));
  if (options.help) { console.log('Usage: node scripts/prepare-phone-video.mjs --recipe input.json [--out manifest.json]'); return; }
  if (!options.recipe) throw Error('--recipe is required');
  const raw=JSON.parse(await readFile(resolve(options.recipe),'utf8'));
  const manifest=buildManifest(raw.recipe??raw);
  const output=resolve(options.out||'artifacts/phone-video/manifest.json');
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({manifest:output,seed:manifest.seed,stages:manifest.stages.length,
    special:manifest.special.length,blockers:manifest.blockers,recordingStarted:false},null,2));
}
main().catch(err=>{console.error('ROYGBIV phone-video preparation: '+err.message);process.exitCode=1;});
