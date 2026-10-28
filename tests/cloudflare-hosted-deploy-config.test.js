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
  assert.equal((out.match(/\[browser\]/g)||[]).length,1);
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
