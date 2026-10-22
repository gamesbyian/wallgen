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
    'logo-raster.yml': ['push', 'workflow_dispatch'],
    'promote-source-visual-plates.yml': ['pull_request', 'workflow_dispatch'],
  };
  const manual = [
    'mobile-browser.yml', 'headless-render.yml', 'agent3-mobile-acceptance.yml',
    'visual-agent1.yml', 'ui-screenshot-atlas.yml', 'seven-vibes.yml',
    'native-wallpaper-gallery.yml', 'design-reference-assets.yml',
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
  assert.match(check, /run: npm run check:quick/);
  assert.match(check, /inputs\.depth == 'full'/);
  assert.match(check, /run: npm run check\n/);
  const pages = await readFile(path.join(workflows, 'pages.yml'), 'utf8');
  assert.match(pages, /run: npm run check:quick/);
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.match(pkg.scripts['check:quick'], /node --test/);
  assert.match(pkg.scripts.check, /npm test/);
});
