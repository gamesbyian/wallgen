import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('reduced motion disables lock and global status transitions without changing base state',()=>{
  const base=read('styles.css'),audit=read('ui-audit-fixes.css');
  assert.match(base,/\.setting-lock\{color:[^}]*transition:background/);
  assert.match(base,/@media\(prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}\.setting-lock\{transition:none\}\}/);
  assert.match(audit,/\.studio-status\{position:fixed;[^}]*transition:opacity \.12s\}/);
  assert.match(audit,/@media\(prefers-reduced-motion:reduce\)\{\.studio-status\{transition:none\}\}/);
  const html=read('index.html');
  assert.match(html,/styles\.css\?v=20261019-motion3/);
  assert.match(html,/ui-audit-fixes\.css\?v=20261019-motion1/);
});
