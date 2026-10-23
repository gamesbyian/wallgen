#!/usr/bin/env node
// Pass one or more local JSON activity exports, uploaded batch files, or
// directories containing those files. No network, telemetry upload or token.
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {analyzeCreativeUsage,markdownCreativeUsageReport} from '../src/creative-usage-report.js';

async function filesAt(target){
  const items=await readdir(target,{withFileTypes:true}).catch(()=>null);
  if(!items)return [target];
  const files=[];
  for(const entry of items){
    if(entry.name.startsWith('.')||entry.name==='node_modules')continue;
    if(entry.isDirectory())files.push(...await filesAt(path.join(target,entry.name)));
    else if(entry.isFile()&&entry.name.endsWith('.json'))
      files.push(path.join(target,entry.name));
  }
  return files.sort();
}
const args=process.argv.slice(2),json=args.includes('--json');
const targets=args.filter(x=>x!=='--json');
if(!targets.length){
  process.stderr.write('Usage: node scripts/summarize-creative-usage.mjs [--json] <activity.json|private-batch-directory> ...\n');
  process.exitCode=2;
}else{
  try{
    const filenames=(await Promise.all(targets.map(filesAt))).flat();
    if(!filenames.length)throw new Error('No JSON activity files found');
    const sources=[];
    for(const filename of filenames){
      const body=await readFile(filename,'utf8');
      sources.push({source:filename,data:JSON.parse(body)});
    }
    const report=analyzeCreativeUsage(sources);
    process.stdout.write(json?JSON.stringify(report,null,2)+'\n':
      markdownCreativeUsageReport(report));
  }catch(error){
    process.stderr.write('Usage analysis failed: '+String(error.message||error)+'\n');
    process.exitCode=1;
  }
}
