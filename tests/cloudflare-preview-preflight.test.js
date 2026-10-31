import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preflightTrustedRendererRevision,trustedRendererSource}
  from '../cloudflare/mcp/src/preview-source-preflight.js';

const sha='a'.repeat(40);
const env={RENDER_SOURCE_URL:'https://gamesbyian.github.io/wallgen/',
  RENDER_EXPECTED_SHA:sha};
const valid=JSON.stringify({commit:sha});
const response=(body,status=200)=>({ok:status===200,status,text:async()=>body});

test('successful read-only preflight checks exact trusted source without browsers or quota',async()=>{
  const calls=[];
  const got=await preflightTrustedRendererRevision(env,{fetcher:async(...args)=>{
    calls.push(args);return response(valid);
  }});
  assert.deepEqual(got,{root:env.RENDER_SOURCE_URL,expectedCommit:sha});
  assert.deepEqual(calls,[[
    'https://gamesbyian.github.io/wallgen/roygbiv-render-version.json',
    {method:'GET',cache:'no-store',credentials:'omit',redirect:'error'}
  ]]);
  assert.deepEqual(env,{RENDER_SOURCE_URL:'https://gamesbyian.github.io/wallgen/',
    RENDER_EXPECTED_SHA:sha});
});

test('stale manifest blocks before browser launch and never accepts a prefix SHA',async()=>{
  await assert.rejects(preflightTrustedRendererRevision(env,{
    fetcher:async()=>response(JSON.stringify({commit:sha.slice(0,12)}))
  }),/Trusted renderer revision mismatch/);
  await assert.rejects(preflightTrustedRendererRevision(env,{
    fetcher:async()=>response(JSON.stringify({commit:'b'.repeat(40)}))
  }),/Trusted renderer revision mismatch/);
});

test('malformed or missing deployment marker fails closed',async()=>{
  for(const [body,status,expected] of [
    ['<html>not a manifest</html>',200,/manifest invalid/],
    [JSON.stringify({sha}),200,/revision mismatch/],
    [valid.repeat(20),200,/manifest invalid/],
    ['',404,/manifest unavailable/]
  ]){
    await assert.rejects(preflightTrustedRendererRevision(env,
      {fetcher:async()=>response(body,status)}),expected);
  }
  await assert.rejects(preflightTrustedRendererRevision(env,
    {fetcher:async()=>{throw Error('Connection refused')}}),/manifest unavailable/);
  await assert.rejects(preflightTrustedRendererRevision(env,
    {fetcher:async()=>({ok:true,text:async()=>{throw Error('Truncated')}})}),/manifest unreadable/);
});

test('only a configured HTTPS directory and full SHA are accepted',()=>{
  for(const url of ['http://example.com/a/','https://example.com/a',
    'https://u:p@example.com/a/','https://example.com/a/?x=1',
    'https://example.com/a/#fragment','REPLACE_ME','not a URL']){
    assert.throws(()=>trustedRendererSource({...env,RENDER_SOURCE_URL:url}),
      /Render source/);
  }
  for(const hash of ['','ABC','A'.repeat(40),'a'.repeat(39),'g'.repeat(40)]){
    assert.throws(()=>trustedRendererSource({...env,RENDER_EXPECTED_SHA:hash}),
      /Trusted renderer revision was not configured/);
  }
});

test('preflight precedes D1 lease and quota, with in-browser second check intact',()=>{
  const index=readFileSync(new URL('../cloudflare/mcp/src/index.js',import.meta.url),'utf8');
  const browser=readFileSync(new URL('../cloudflare/mcp/src/browser-render.js',import.meta.url),'utf8');
  const section=index.slice(index.indexOf("mcp.registerTool('roygbiv_preview'"));
  for(const later of ['acquirePreviewLease(env)','reservePreviewLaunch(env)',
    'consumePreviewAllowance(env,userId)','renderPreview(env,recipe,width)']){
    assert.ok(section.indexOf('await preflightTrustedRendererRevision(env)')<
      section.indexOf(later),'preflight must precede '+later);
  }
  assert.match(browser,/manifest\?\.commit!==expectedCommit/);
  assert.match(browser,/Trusted renderer revision mismatch/);
});
