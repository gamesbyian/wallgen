// Post-deployment acceptance: public Pages must serve this exact built source.
// No browser/Cloudflare dependency, no credentials, and no separate workflow.
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHA = /^[0-9a-f]{40}$/;
const assetNames = ['assets/roygbiv-logo-dark.png', 'assets/roygbiv-logo-cream.png'];
const versionNames = ['roygbiv-render-version.json',
  'trusted-renderer/roygbiv-render-version.json'];

function publishedRoot(pageUrl) {
  const url = new URL(pageUrl);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      url.search || url.hash) throw new Error('Pages verification requires a clean HTTPS deployment URL');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}
async function fetchPublished(url, fetchImpl) {
  const result = await fetchImpl(url.href, {
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!result?.ok) throw new Error('Published asset HTTP ' +
    (result?.status ?? 'unavailable') + ': ' + url.pathname);
  const length = Number(result.headers?.get('content-length') || 0);
  if (length > 4 * 1024 * 1024) throw new Error('Oversized published asset: ' + url.pathname);
  const data = Buffer.from(await result.arrayBuffer());
  if (data.length > 4 * 1024 * 1024) throw new Error('Oversized published asset: ' + url.pathname);
  return data;
}
export async function checkPublishedPages({ pageUrl, commit, trustedCommit,
  fetchImpl = fetch, readAsset = path => readFileSync(resolve(root, path)) } = {}) {
  if (!SHA.test(commit || '') || !SHA.test(trustedCommit || ''))
    throw new Error('Pages verification requires exact full release SHAs');
  const base = publishedRoot(pageUrl);
  const files = [...versionNames, ...assetNames];
  const downloaded = await Promise.all(files.map(name => {
    const url = new URL(name, base);
    url.searchParams.set('roygbiv_verify', commit);
    return fetchPublished(url, fetchImpl);
  }));
  for (let i = 0; i < versionNames.length; i++) {
    let manifest;
    try { manifest = JSON.parse(downloaded[i].toString('utf8')); }
    catch { throw new Error('Invalid published version JSON: ' + versionNames[i]); }
    const expected = i === 0 ? commit : trustedCommit;
    if (manifest?.commit !== expected)
      throw new Error('Published source mismatch at ' + versionNames[i] +
        ': expected ' + expected + ', got ' + String(manifest?.commit || 'missing'));
  }
  for (let i = 0; i < assetNames.length; i++) {
    const name = assetNames[i];
    const expected = readAsset(name);
    if (!Buffer.from(expected).equals(downloaded[i + versionNames.length]))
      throw new Error('Published PNG differs from built SVG-derived asset: ' + name);
  }
  return { commit, trustedCommit, pageUrl: base.href,
    assetsChecked: files.length };
}
export async function verifyPublishedPages(options = {}) {
  const attempts = options.attempts ?? 7;
  const pauseMs = options.pauseMs ?? 3000;
  const sleepImpl = options.sleepImpl ?? sleep;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 12 ||
      !Number.isFinite(pauseMs) || pauseMs < 0 || pauseMs > 10000)
    throw new RangeError('Unbounded Pages verification retry configuration');
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await checkPublishedPages(options); }
    catch (error) {
      lastError = error;
      console.error('Pages verification attempt ' + attempt + '/' +
        attempts + ': ' + error.message);
      if (attempt < attempts) await sleepImpl(pauseMs);
    }
  }
  throw new Error('Published Pages artifact not independently verified: ' +
    String(lastError?.message || 'unknown'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const trusted = JSON.parse(readFileSync(resolve(root,
    'cloudflare/mcp/trusted-renderer-release.json'), 'utf8'));
  try {
    const result = await verifyPublishedPages({
      pageUrl: process.env.PAGES_DEPLOY_URL, commit: process.env.GITHUB_SHA,
      trustedCommit: trusted.commit,
    });
    console.log('Published Pages source, renderer pin and both SVG-derived PNGs verified: ' +
      result.commit + ' at ' + result.pageUrl);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
