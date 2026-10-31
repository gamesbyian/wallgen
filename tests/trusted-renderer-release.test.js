import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildHostedPreviewConfig,TRUSTED_RENDER_ROOT}
  from '../scripts/prepare-hosted-preview-config.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const release=JSON.parse(read('cloudflare/mcp/trusted-renderer-release.json'));
const pages=read('.github/workflows/pages.yml');
const manual=read('.github/workflows/manual-roygbiv-hosted-release.yml');
const base=read('cloudflare/mcp/wrangler.toml');

test('trusted renderer release is one explicit immutable full commit',()=>{
  assert.equal(release.schema,1);
  assert.match(release.commit,/^[a-f0-9]{40}$/);
  assert.equal(release.snapshotPath,'trusted-renderer');
  assert.deepEqual(release.sourcePaths,['src','assets','render-host.html']);
  assert.equal(TRUSTED_RENDER_ROOT,
    'https://gamesbyian.github.io/wallgen/trusted-renderer/');
});

test('Pages publishes immutable source beside rolling main, never from current checkout',()=>{
  assert.match(pages,/git fetch --no-tags --depth=1 origin "\$PIN"/);
  assert.match(pages,/git archive --format=tar "\$PIN" src assets render-host\.html/);
  assert.match(pages,/tar -xf - -C trusted-renderer/);
  assert.match(pages,/trusted-renderer\/roygbiv-render-version\.json/);
  assert.match(pages,/> roygbiv-render-version\.json/);
  assert.match(pages,/test ! -e trusted-renderer/);
  assert.doesNotMatch(pages,/cp -r src trusted-renderer/);
});

test('owner release checks BOTH main Pages and independent trusted renderer',()=>{
  assert.match(manual,/roygbiv-render-version\.json' -o \/tmp\/roygbiv-render-version\.json/);
  assert.match(manual,/commit!==process\.env\.GITHUB_SHA/);
  assert.match(manual,/trusted-renderer\/roygbiv-render-version\.json/);
  assert.match(manual,/published\.commit!==pin\.commit/);
  assert.match(manual,/--sha "\$PIN"/);
  assert.match(manual,/--manifest \/tmp\/roygbiv-trusted-render-version\.json/);
  assert.doesNotMatch(manual,/prepare-hosted-preview-config\.mjs --sha "\$GITHUB_SHA"/);
  assert.match(manual,/ENABLE_AUTHENTICATED_BROWSER_PREVIEWS/);
});

test('Worker release config remains default disabled unless explicitly approved',()=>{
  const config=buildHostedPreviewConfig(base,{sha:release.commit,
    manifest:{commit:release.commit},mode:'preview'});
  assert.match(config,/HOSTED_PREVIEW_ENABLED = "true"/);
  assert.ok(config.includes('RENDER_SOURCE_URL = "'+TRUSTED_RENDER_ROOT+'"'));
  assert.ok(config.includes('RENDER_EXPECTED_SHA = "'+release.commit+'"'));
  assert.throws(()=>buildHostedPreviewConfig(base,{sha:release.commit,
    manifest:{commit:'b'.repeat(40)},mode:'preview'}));
  assert.match(base,/HOSTED_PREVIEW_ENABLED = "false"/);
});
