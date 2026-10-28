import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pages=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
const adapter=readFileSync(new URL('../cloudflare/mcp/src/browser-render.js',import.meta.url),'utf8');
test('Pages publishes the exact commit marker after sanity and before upload',()=>{
  const check=pages.indexOf('npm run check:quick');
  const marker=pages.indexOf('roygbiv-render-version.json');
  const upload=pages.indexOf('actions/upload-pages-artifact');
  assert.ok(check>=0&&marker>check&&upload>marker);
  assert.match(pages,/printf '\{"commit":"%s"\}\\n'/);
});
test('hosted render refuses unmatched or missing source before importing code',()=>{
  const verify=adapter.indexOf("manifest?.commit!==expectedCommit");
  const importRenderer=adapter.indexOf("await import(new URL('src/renderer.js'");
  assert.ok(verify>=0&&importRenderer>verify);
  assert.match(adapter,/redirect:'error'/);
  assert.match(adapter,/cache:'no-store'/);
  assert.match(adapter,/Trusted renderer revision mismatch/);
});

test('Browser Run session constrains allowed host before navigating',()=>{
  const launch=adapter.indexOf('guardrails:{allowedDomains:[new URL(root).hostname]}');
  const navigate=adapter.indexOf('await page.goto(root');
  assert.ok(launch>=0&&navigate>launch);
  assert.match(adapter,/route\.abort\(\)/);
});
