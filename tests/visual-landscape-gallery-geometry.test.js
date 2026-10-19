import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const theme=readFileSync('studio-themes.css','utf8');
const exceptions=readFileSync('ui-audit-fixes.css','utf8');
const liveAudit=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');

test('portrait gallery reservation is owned by studio theme geometry',()=>{
  assert.match(theme,/body\.mobile-gallery-open\s*\{\s*--mobile-tray-height:clamp\(300px,42dvh,420px\)/);
  assert.doesNotMatch(exceptions,/body\.mobile-gallery-open\s*\{\s*--mobile-tray-height:/);
});
test('short landscape gallery override follows portrait gallery rule',()=>{
  const portrait=theme.indexOf('--mobile-tray-height:clamp(300px,42dvh,420px)');
  const landscape=theme.indexOf('--mobile-tray-height:clamp(165px,28dvh,205px)');
  assert.ok(portrait>0&&landscape>portrait,
    'Short-screen override must follow and outrank portrait gallery height');
});
test('real screenshot audit treats artwork/tray overlap as an error',()=>{
  assert.match(liveAudit,/if\(measured\.stageOverlap>1\)\s*\{/);
  assert.match(liveAudit,/errors\.push\(\{key,error\}\)/);
  assert.match(liveAudit,/landscape-700x412/);
});
