#!/usr/bin/env node
/**
 * Prepare a disposable Wrangler config for the authenticated hosted MCP Worker.
 * Never edits the checked-in default-off configuration or handles credentials.
 * Operator: verify a real GitHub Pages revision stamp before deployment.
 */
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const TRUSTED_RENDER_ROOT='https://gamesbyian.github.io/wallgen/trusted-renderer/';
export const SHA_PATTERN=/^[a-f0-9]{40}$/;
export function buildHostedPreviewConfig(baseline,{sha,manifest,mode='disabled'}={}) {
  if(typeof baseline!=='string'||!baseline.includes('name = "roygbiv-mcp"'))
    throw Error('Expected ROYGBIV resource Worker configuration');
  if(!SHA_PATTERN.test(sha||'')||manifest?.commit!==sha)
    throw Error('Pages version stamp must match the exact 40-character release commit');
  if(!['disabled','preview'].includes(mode))
    throw Error('Mode must be disabled or preview');
  if(!/^[ \t]*HOSTED_PREVIEW_ENABLED = "false"[ \t]*$/m.test(baseline))
    throw Error('Default-off preview marker missing; refusing release');
  if(/^[ \t]*RENDER_EXPECTED_SHA[ \t]*=/m.test(baseline)||/^[ \t]*\[browser\][ \t]*$/m.test(baseline))
    throw Error('Checked-in configuration already contains release bindings');
  const vars=[
    'HOSTED_PREVIEW_ENABLED = "'+(mode==='preview'?'true':'false')+'"',
    'RENDER_SOURCE_URL = "'+TRUSTED_RENDER_ROOT+'"',
    'RENDER_EXPECTED_SHA = "'+sha+'"'
  ];
  const config=baseline.replace(/^[ \t]*HOSTED_PREVIEW_ENABLED = "false"[ \t]*$/m,vars.join('\n'));
  return config.trimEnd()+'\n\n[browser]\nbinding = "BROWSER"\n';
}

async function main(argv) {
  const values={};
  for(let i=0;i<argv.length;i+=2){
    const arg=argv[i];
    if(!['--sha','--manifest','--mode'].includes(arg)||!argv[i+1]||argv[i+1].startsWith('--'))
      throw Error('Usage: --sha <exact-public-Pages-commit> --manifest <trusted-JSON-path> [--mode disabled|preview]');
    values[arg.slice(2)]=argv[i+1];
  }
  if(!values.sha||!values.manifest)
    throw Error('Both --sha and --manifest are required');
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const configPath=join(root,'cloudflare/mcp/wrangler.toml');
  const out=join(root,'cloudflare/mcp/wrangler.release.generated.toml');
  const baseline=await readFile(configPath,'utf8');
  const manifest=JSON.parse(await readFile(resolve(values.manifest),'utf8'));
  const content=buildHostedPreviewConfig(baseline,{sha:values.sha,manifest,mode:values.mode??'disabled'});
  await writeFile(out,content,{flag:'w',mode:0o600});
  process.stdout.write(JSON.stringify({file:out,sha:values.sha,mode:values.mode??'disabled',
    source:TRUSTED_RENDER_ROOT,previewEnabled:values.mode==='preview'})+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
