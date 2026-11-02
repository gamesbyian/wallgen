import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflows = path.join(root, '.github/workflows');
const archive = path.join(root, 'docs/ci-archive/workflows');

function events(yaml) {
  const lines = yaml.split(/\r?\n/);
  const start = lines.indexOf('on:');
  assert(start >= 0, 'Workflow event declaration missing');
  const found = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[a-zA-Z_][\w-]*:/.test(lines[i])) break;
    const match = lines[i].match(/^  ([a-zA-Z_][\w-]*):/);
    if (match) found.push(match[1]);
  }
  assert.equal(new Set(found).size, found.length, 'Duplicate triggers');
  return found.sort();
}

test('personal project has only a small active workflow menu', async () => {
  const expected = {
    'check.yml': ['pull_request', 'workflow_dispatch'],
    'pages.yml': ['push', 'workflow_dispatch'],
    'promote-source-visual-plates.yml': ['pull_request', 'workflow_dispatch'],
  };
  // Every active specialty suite must be manually requested; no hidden push.
  const manual = [
    'agent3-mobile-acceptance.yml', 'design-reference-assets.yml',
    'geometry-library-browser.yml', 'headless-render.yml',
    'manual-roygbiv-hosted-release.yml', 'mobile-browser.yml',
    'native-wallpaper-gallery.yml', 'palette-tone-optical-acceptance.yml',
    'per-hue-shape-optical.yml', 'reconstruction-dark-tone-full-resolution.yml',
    'reconstruction-hue-shapes-experiment.yml', 'reconstruction-ink-geometry-experiment.yml',
    'reconstruction-source-mask-profile.yml', 'reconstruction-vtracer-experiment.yml',
    'seven-vibes.yml', 'ui-screenshot-atlas.yml', 'visual-agent1.yml',
  ];
  for (const name of manual) expected[name] = ['workflow_dispatch'];
  const live = (await readdir(workflows)).filter(n => /\.ya?ml$/.test(n)).sort();
  assert.deepEqual(live, Object.keys(expected).sort(),
    'New automatic or specialty workflow? Justify it in the CI policy.');
  for (const name of live) {
    const content = await readFile(path.join(workflows, name), 'utf8');
    assert.deepEqual(events(content), expected[name].sort(), name + ' has unexpected triggers');
  }
  const archived = (await readdir(archive)).filter(n => /\.ya?ml$/.test(n));
  assert(archived.length >= 50, 'Historical workflow evidence unexpectedly removed');
});

test('automatic PR checks stay quick and deep suites require an explicit choice', async () => {
  const check = await readFile(path.join(workflows, 'check.yml'), 'utf8');
  assert.match(check, /  pull_request:/);
  assert.doesNotMatch(check, /^  push:/m);
  assert.match(check, /ci-evidence\.mjs quick -- npm run check:quick/);
  assert.match(check, /steps\.selection\.outputs\.tier == 'full'/);
  assert.match(check, /ci-evidence\.mjs full -- npm run check\n/);
  const pages = await readFile(path.join(workflows, 'pages.yml'), 'utf8');
  assert.match(pages, /run: npm run check:quick/);
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.match(pkg.scripts['check:quick'], /node --test/);
  assert.match(pkg.scripts.check, /npm test/);
});

test('real two-viewport touch and accessible-name acceptance requires explicit same-repo PR opt-in', async () => {
  const check = await readFile(path.join(workflows, 'check.yml'), 'utf8');
  for (const requirement of [
    '  touch-browser:',
    "contains(github.event.pull_request.title, '[touch-browser]')",
    'github.event.pull_request.head.repo.full_name == github.repository',
    'node tests/rotation-scrubber-browser.mjs',
    'node tests/agent3-portrait-swipes-escape.mjs',
    'node tests/agent3-current-accessible-names-browser.mjs',
    'node tests/mobile-touch-continuity-browser.mjs',
    'node tests/independent-keyboard-focus-journey.mjs',
    'node tests/view-pan-escape-focus-browser.mjs',
    'persist-credentials: false',
    'steps.selection.outputs.tier == \'quick\'',
    '  test:'
  ]) {
    assert.ok(check.includes(requirement), 'Opt-in browser CI policy missing: ' + requirement);
  }
});

test('every PR keeps one fail-closed, self-tested required check', async () => {
  const check = await readFile(path.join(workflows, 'check.yml'), 'utf8');
  assert.match(check, /run: node scripts\/ci-select\.mjs/);
  assert.match(check, /CI_BASE_SHA:/);
  assert.match(check, /fetch-depth: 2/);
  assert.match(check, /ci-workflow-policy\.test\.mjs tests\/ci-select\.test\.mjs/);
  assert.match(check, /steps\.selection\.outputs\.tier == 'docs'/);
  assert.match(check, /steps\.selection\.outputs\.tier == 'quick'/);
  assert.match(check, /if: failure\(\)/);
  assert.match(check, /upload-artifact@v4/);
  assert.doesNotMatch(check, /^    paths:/m, 'Required workflow must not be path-filtered');
  const retired = await readdir(archive);
  assert(retired.includes('once-preview-discovery-release.yml'),
    'One-shot credentialed release must remain archived, not be a live push trigger');
  const promote = await readFile(path.join(workflows, 'promote-source-visual-plates.yml'), 'utf8');
  assert.match(promote, /head\.repo\.full_name == github\.repository/,
    'Write-enabled promotion must reject fork PRs');
});

test('manual optical evidence cannot be cancelled by a later distinct request', async () => {
  for (const name of ['ui-screenshot-atlas.yml', 'visual-agent1.yml']) {
    const content = await readFile(path.join(workflows, name), 'utf8');
    assert.match(content, /cancel-in-progress: false/, name + ' must preserve manually requested run');
    assert.doesNotMatch(content, /cancel-in-progress: true/, name + ' has unsafe cancellation');
  }
});

test('SVG raster fallback is generated by the sole Pages publisher, with no bot push', async () => {
  const live = await readdir(workflows);
  assert(!live.includes('logo-raster.yml'), 'Remove redundant write-enabled workflow');
  const retired = await readdir(archive);
  assert(retired.includes('logo-raster.yml'), 'Preserve former workflow for audit history');
  const pages = await readFile(path.join(workflows, 'pages.yml'), 'utf8');
  assert.match(pages, /run: node scripts\/build-logo-raster\.mjs/);
  assert(pages.indexOf('run: node scripts/build-logo-raster.mjs') <
    pages.indexOf('Stamp exact published rendering revision'), 'Build icon before uploading Pages artifact');
  const generator = await readFile(path.join(root, 'scripts/build-logo-raster.mjs'), 'utf8');
  assert.match(generator, /export function parseLogoSvg/);
  assert.match(generator, /export function rasterizeLogoSvg/);
  assert.doesNotMatch(generator, /const EDGES\s*=/, 'Icon coordinates must come from the SVG');
});

test('main docs-only sanity fast path cannot suppress source stamping or trusted deployment', async () => {
  const pages = await readFile(path.join(workflows, 'pages.yml'), 'utf8');
  assert.match(pages, /fetch-depth: 2/);
  assert.match(pages, /CI_BASE_SHA:/);
  assert.match(pages, /CI_ALLOW_DOCS_PUSH: 'true'/);
  assert.match(pages, /run: node scripts\/ci-select\.mjs/);
  assert.match(pages, /run: node --test tests\/ci-select\.test\.mjs/);
  assert.match(pages, /if: \$\{\{ steps\.selection\.outputs\.tier != 'docs' \}\}/);
  assert.match(pages, /run: npm run check:quick/);
  assert.match(pages, /roygbiv-render-version\.json/);
  assert.match(pages, /trusted-renderer\/roygbiv-render-version\.json/);
  assert.match(pages, /actions\/deploy-pages@v4/);
});


test('Pages deployment is independently checked after upload and keeps failure evidence', async () => {
  const pages = await readFile(path.join(workflows, 'pages.yml'), 'utf8');
  const deploy = pages.indexOf('uses: actions/deploy-pages@v4');
  const verify = pages.indexOf('node scripts/ci-evidence.mjs pages-publish -- node scripts/verify-pages-publication.mjs');
  const upload = pages.indexOf('Upload publication failure digest');
  assert(deploy >= 0 && verify > deploy && upload > verify,
    'Public source/PNG proof must run after Pages deployment and preserve failure evidence');
  assert.match(pages, /PAGES_DEPLOY_URL: \$\{\{ steps\.deployment\.outputs\.page_url \}\}/);
  assert.match(pages, /if: failure\(\)/);
  const checker = await readFile(path.join(root, 'scripts/verify-pages-publication.mjs'),'utf8');
  for (const name of ['roygbiv-render-version.json',
    'trusted-renderer/roygbiv-render-version.json',
    'assets/roygbiv-logo-dark.png','assets/roygbiv-logo-cream.png'])
    assert(checker.includes(name), 'Missing public artifact check: ' + name);
});
