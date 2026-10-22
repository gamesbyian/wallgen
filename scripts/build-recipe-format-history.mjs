#!/usr/bin/env node
/**
 * Source-derived recipe schema ledger. Run from a FULL local Git clone:
 * node scripts/build-recipe-format-history.mjs
 *
 * This scans all observed model.js revisions; it reports membership changes,
 * NOT proof of default/render equivalence (helper logic and semantics change).
 * No workflow, web API, browser, image decoding or dependency installation.
 */
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});
export function extractRecipeKeyInventory(source){
  const begin=source.indexOf('export function normalizeRecipe(');
  if(begin<0)throw Error('Source has no exported normalizeRecipe function');
  const body=source.slice(begin);
  const firstReturn=body.indexOf('\n  return {');
  if(firstReturn<0)throw Error('Normalizer has no expected return object');
  const tail=body.slice(firstReturn+1);
  const end=tail.search(/\n}\s*\n/);
  if(end<0)throw Error('Could not locate normalizer body end');
  const section=tail.slice(0,end);
  const explicit=[...new Set([...section.matchAll(/^    ([A-Za-z_$][\w$]*)\s*:/gm)].map(m=>m[1]))];
  // Source-qualified optional spread names, never silently treated as fixed
  // compulsory keys when absent in historical saved snapshots.
  const optional=[...new Set([...section.matchAll(/\.\.\.\(input\.([A-Za-z_$][\w$]*)\?/g)]
    .map(m=>m[1]))];
  return {explicitKeys:explicit.sort(),optionalKeys:optional.sort()};
}
// Source-expression evidence, complementary to top-level key membership.
// A missing field and a changed normalization/default expression require
// different conversion decisions. This is lexical evidence ONLY; behavior
// can also change in helper functions, enums, seed RNG and the renderer.
export function extractRecipeFieldExpressions(source){
  const begin=source.indexOf('export function normalizeRecipe(');
  if(begin<0)throw Error('Source has no exported normalizeRecipe function');
  const start=source.indexOf('\n  return {',begin);
  if(start<0)throw Error('Normalizer has no expected return object');
  const end=source.indexOf('\n  };',start);
  if(end<0)throw Error('Could not locate normalizer return object end');
  const section=source.slice(start+'\n  return {'.length,end);
  const pattern=/^    ([A-Za-z_$][\w$]*)(:|,)[ \t]*/gm;
  const anchors=[...section.matchAll(pattern)];
  const fields={};
  for(let i=0;i<anchors.length;i++){
    const found=anchors[i],key=found[1];
    let expression=section.slice(found.index+found[0].length,
      anchors[i+1]?.index??section.length);
    expression=expression.split('\n').filter(line=>
      !/^\s*\/\//.test(line)&&!/^\s*\.\.\.\(/.test(line))
      .join(' ').trim().replace(/,\s*$/,'').replace(/\s+/g,' ');
    fields[key]=found[2]===','?'[shorthand]':expression;
  }
  return Object.fromEntries(Object.entries(fields).sort(([a],[b])=>a.localeCompare(b)));
}
export function sourceExpressionDiff(previous={},next={}){
  const before=new Set(Object.keys(previous)),after=new Set(Object.keys(next));
  return {
    added:[...after].filter(k=>!before.has(k)).sort(),
    removed:[...before].filter(k=>!after.has(k)).sort(),
    changed:[...after].filter(k=>before.has(k)&&previous[k]!==next[k]).sort(),
  };
}

export function sourceSchemaDiff(previous,next){
  const old=new Set(previous?.explicitKeys||[]),now=new Set(next.explicitKeys);
  return {added:[...now].filter(k=>!old.has(k)).sort(),
    removed:[...old].filter(k=>!now.has(k)).sort()};
}
async function main(){
  if(process.argv.includes('--help')){
    process.stdout.write('Usage: node scripts/build-recipe-format-history.mjs [--out path | --semantic-out path]\nRequires a full local Git clone. No CI job is created.\n');
    return;
  }
  const semanticAt=process.argv.indexOf('--semantic-out');
  const semantic=semanticAt>=0;
  const at=process.argv.indexOf('--out');
  const out=resolve(root,semantic?
    process.argv[semanticAt+1]||'docs/recipe-format-history/model-expression-history.json':
    at>=0?process.argv[at+1]||'docs/recipe-format-history/model-key-ledger.json':
    'docs/recipe-format-history/model-key-ledger.json');
  const rows=git('log','--all','--format=%H%x09%cI%x09%s','--','src/model.js')
    .split('\n').filter(Boolean).map(row=>{
      const [sha,date,...title]=row.split('\t');
      return {sha,date,subject:title.join('\t')};
    }).reverse();
  if(!rows.length)throw Error('No model.js history: use a complete Git clone');
  let previous=null,priorExpressions={};
  const revisions=[];
  for(const row of rows){
    const source=git('show',row.sha+':src/model.js');
    const inventory=extractRecipeKeyInventory(source);
    const change=sourceSchemaDiff(previous,inventory);
    if(semantic){
      const expressions=extractRecipeFieldExpressions(source);
      revisions.push({...row,...sourceExpressionDiff(priorExpressions,expressions)});
      priorExpressions=expressions;
    }else revisions.push({...row,...inventory,...change});
    previous=inventory;
  }
  await mkdir(dirname(out),{recursive:true});
  await writeFile(out,JSON.stringify(semantic?
    {schema:1,method:'Normalizer top-level source-expression changes; renderer/helper semantics NOT proven',
      revisionCount:revisions.length,revisions}:
    {schema:1,warning:'Field-membership proxy only; not semantic conversion proof',
      revisionCount:revisions.length,revisions},null,2)+'\n');
  process.stdout.write(JSON.stringify({file:out,revisions:revisions.length,
    mode:semantic?'semantic expressions':'explicit membership'})+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
