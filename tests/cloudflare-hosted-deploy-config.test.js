import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildHostedPreviewConfig,TRUSTED_RENDER_ROOT} from '../scripts/prepare-hosted-preview-config.mjs';

const base=readFileSync(new URL('../cloudflare/mcp/wrangler.toml',import.meta.url),'utf8');
const sha='0123456789abcdef0123456789abcdef01234567';
const manifest={commit:sha};

test('default release keeps preview unavailable and preserves existing auth/data bindings',()=>{
  const out=buildHostedPreviewConfig(base,{sha,manifest});
  assert.match(out,/HOSTED_PREVIEW_ENABLED = "false"/);
  assert.match(out,new RegExp('RENDER_EXPECTED_SHA = "'+sha+'"'));
  assert.ok(out.includes('RENDER_SOURCE_URL = "'+TRUSTED_RENDER_ROOT+'"'));
  assert.ok(out.includes('[browser]\nbinding = "BROWSER"'));
  for(const binding of ['AUTH_SERVER','PRIVATE_ARTIFACTS','RECIPES'])
    assert.ok(out.includes('binding = "'+binding+'"'));
  assert.ok(out.includes('crons = ["0 3 * * *"]'));
  assert.equal((out.match(/^HOSTED_PREVIEW_ENABLED =/gm)||[]).length,1);
});
test('preview activation is an explicit deployment mode',()=>{
  const out=buildHostedPreviewConfig(base,{sha,manifest,mode:'preview'});
  assert.match(out,/^HOSTED_PREVIEW_ENABLED = "true"$/m);
  assert.equal((out.match(/^\[browser\]$/gm)||[]).length,1);
});
test('mismatch, malformed SHA, unapproved modes and corrupt defaults fail closed',()=>{
  for(const args of [
    {sha,manifest:{commit:'a'.repeat(40)}},
    {sha:'main',manifest:{commit:'main'}},
    {sha:'z'.repeat(40),manifest:{commit:'z'.repeat(40)}},
    {sha,manifest,mode:'production'}
  ]) assert.throws(()=>buildHostedPreviewConfig(base,args));
  assert.throws(()=>buildHostedPreviewConfig(base.replace('HOSTED_PREVIEW_ENABLED = "false"',
    'HOSTED_PREVIEW_ENABLED = "true"'),{sha,manifest}));
  assert.throws(()=>buildHostedPreviewConfig(base+'\n[browser]\nbinding = "OTHER"\n',{sha,manifest}));
});

test('manual release audits and uploads the actual Wrangler bundle instead of empty root README',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/manual-roygbiv-hosted-release.yml',import.meta.url),'utf8');
  assert.match(workflow,/cloudflare\/mcp\/artifacts\/roygbiv-hosted\/index\.js/);
  assert.match(workflow,/sha256sum index\.js > SHA256SUMS/);
  assert.match(workflow,/if-no-files-found: error/);
  assert.match(workflow,/compression-level: 0/);
  assert.doesNotMatch(workflow,/^\s*path: artifacts\/roygbiv-hosted\//m);
});

test('public health route bypasses OAuth wrapper while MCP remains protected',()=>{
  const worker=readFileSync(new URL('../cloudflare/mcp/src/index.js',import.meta.url),'utf8');
  const position=worker.indexOf("if(request.method==='GET' && new URL(request.url).pathname==='/health')");
  const oauth=worker.lastIndexOf('return oauthResource.fetch(request,env,ctx)');
  assert.ok(position>0&&oauth>position);
  assert.match(worker,/rendering:previewConfigured\(env\)\?'auth-required':'not-configured'/);
  assert.match(worker,/new URL\(request.url\).pathname!==\s*'\/mcp'/);
});
