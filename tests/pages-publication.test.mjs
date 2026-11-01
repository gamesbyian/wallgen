import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPublishedPages, verifyPublishedPages } from '../scripts/verify-pages-publication.mjs';

const commit = 'a'.repeat(40);
const trustedCommit = 'b'.repeat(40);
const assets = {
  'index.html': Buffer.from('<html>built application</html>'),
  'src/app.js': Buffer.from('export const app = 1;'),
  'src/model.js': Buffer.from('export const model = 1;'),
  'src/renderer.js': Buffer.from('export const renderer = 1;'),
  'src/render-worker.js': Buffer.from('export const worker = 1;'),
  'assets/roygbiv-logo-dark.png': Buffer.from('dark-generated-icon'),
  'assets/roygbiv-logo-cream.png': Buffer.from('cream-generated-icon'),
};
function harness(overrides = {}) {
  const requested = [];
  const files = {
    'roygbiv-render-version.json': JSON.stringify({commit}),
    'trusted-renderer/roygbiv-render-version.json': JSON.stringify({commit: trustedCommit}),
    ...assets,
    ...overrides,
  };
  return {
    requested,
    options: {
      pageUrl: 'https://example.github.io/wallgen/',
      commit, trustedCommit,
      readAsset: name => assets[name],
      fetchImpl: async (url, init) => {
        const parsed = new URL(url);
        const key = parsed.pathname.replace(/^\/wallgen\//, '');
        requested.push({url:parsed, init, key});
        const body = files[key];
        return body == null ? new Response('Not found', {status:404}) :
          new Response(body, {status:200});
      },
    },
  };
}

test('published Pages proof checks both exact source SHAs and both PNG bytes', async () => {
  const { options, requested } = harness();
  const result = await checkPublishedPages(options);
  assert.equal(result.commit, commit);
  assert.equal(result.trustedCommit, trustedCommit);
  assert.equal(result.assetsChecked, 9);
  assert.deepEqual(requested.map(p=>p.key), [
    'roygbiv-render-version.json',
    'trusted-renderer/roygbiv-render-version.json',
    'index.html',
    'src/app.js',
    'src/model.js',
    'src/renderer.js',
    'src/render-worker.js',
    'assets/roygbiv-logo-dark.png',
    'assets/roygbiv-logo-cream.png',
  ]);
  for (const request of requested) {
    assert.equal(request.url.searchParams.get('roygbiv_verify'),commit);
    assert.equal(request.init.cache,'no-store');
    assert.equal(request.init.redirect,'error');
    assert.ok(request.init.signal);
  }
});

test('stale source, stale pin and mismatched PNG cannot pass publication', async () => {
  for (const [overrides, diagnostic] of [
    [{'roygbiv-render-version.json':JSON.stringify({commit:'c'.repeat(40)})},/Published source mismatch/],
    [{'trusted-renderer/roygbiv-render-version.json':JSON.stringify({commit:'c'.repeat(40)})},/Published source mismatch/],
    [{'assets/roygbiv-logo-cream.png':Buffer.from('wrong')},/Published source asset differs/],
    [{'src/renderer.js':Buffer.from('stale renderer')},/Published source asset differs/],
    [{'index.html':Buffer.from('stale editor')},/Published source asset differs/],
    [{'assets/roygbiv-logo-dark.png':null},/HTTP 404/],
    [{'roygbiv-render-version.json':'broken JSON'},/Invalid published version JSON/],
  ]) {
    await assert.rejects(checkPublishedPages(harness(overrides).options),diagnostic);
  }
});

test('deployment verification is bounded, retries the stale CDN then succeeds', async () => {
  const { options, requested } = harness();
  let wave=0;
  const origin=options.fetchImpl;
  const pauses=[];
  options.fetchImpl=(url,init)=>{
    if (url.includes('roygbiv-render-version.json') && !url.includes('trusted-renderer/') && wave++===0)
      return Promise.resolve(new Response(JSON.stringify({commit:'c'.repeat(40)}), {status:200}));
    return origin(url,init);
  };
  const result=await verifyPublishedPages({...options,attempts:2,pauseMs:1,
    sleepImpl:async ms=>{pauses.push(ms);}});
  assert.equal(result.commit,commit);
  assert.deepEqual(pauses,[1]);
  assert.equal(requested.length,17,'one intercepted manifest request plus all nine paths on the second attempt');
});

test('persistent outage fails visibly and invalid URLs or SHAs never count as proof', async () => {
  const h=harness({'assets/roygbiv-logo-dark.png':null});
  let attempts=0;
  await assert.rejects(verifyPublishedPages({...h.options,attempts:2,pauseMs:0,
    sleepImpl:async()=>{attempts++;}}),/not independently verified: Published asset HTTP 404/);
  assert.equal(attempts,1);
  await assert.rejects(checkPublishedPages({...h.options,commit:'short'}),/full release SHAs/);
  await assert.rejects(checkPublishedPages({...h.options,pageUrl:'http://example.com/wallgen/'}),/clean HTTPS/);
  await assert.rejects(checkPublishedPages({...h.options,pageUrl:'https://user:pw@example.com/wallgen/'}),/clean HTTPS/);
  await assert.rejects(verifyPublishedPages({...h.options,attempts:100}),/Unbounded/);
});
