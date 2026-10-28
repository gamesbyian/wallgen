import test from 'node:test';
import assert from 'node:assert/strict';
import {
  previewConfigured, consumePreviewAllowance, purgeOldPreviewUsage,
  MAX_PREVIEWS_PER_UTC_DAY
} from '../cloudflare/mcp/src/preview-quota.js';

// Minimal D1 statement double; guards assertion of atomic server-side charge.
function quotaEnv() {
  const rows = new Map();
  const sqlSeen = [];
  return { rows, sqlSeen, BROWSER: {}, HOSTED_PREVIEW_ENABLED: 'true',
    RENDER_SOURCE_URL: 'https://example.org/roygbiv/',
    RENDER_EXPECTED_SHA: '0123456789abcdef0123456789abcdef01234567', RECIPES: {
      prepare(sql) {
        sqlSeen.push(sql);
        let args;
        return {
          bind(...values) { args = values; return this; },
          async first() {
            const [owner,day,max] = args;
            const key = owner + '|' + day, used = rows.get(key) || 0;
            if (used >= max) return null;
            rows.set(key, used + 1);
            return { used: used + 1 };
          },
          async run() { return { success: true }; }
        };
      }
    }
  };
}
test('hosted previews remain unadvertised without all required operator gates', () => {
  const env = quotaEnv();
  assert.equal(previewConfigured(env), true);
  for (const missing of ['BROWSER','RECIPES','RENDER_SOURCE_URL']) {
    assert.equal(previewConfigured({ ...env, [missing]: undefined }), false);
  }
  assert.equal(previewConfigured({ ...env, HOSTED_PREVIEW_ENABLED: 'false' }), false);
  for (const sha of ['', 'main', '0123456', 'G'.repeat(40), '0'.repeat(41)]) {
    assert.equal(previewConfigured({ ...env, RENDER_EXPECTED_SHA: sha }), false);
  }
  for (const bad of ['http://example.org/roygbiv/','https://example.org/roygbiv',
    'https://example.org/roygbiv/?copy=1','https://REPLACE-SOURCE/']) {
    assert.equal(previewConfigured({ ...env, RENDER_SOURCE_URL: bad }), false);
  }
});
test('daily quota is owner- and UTC-day-scoped with one atomic D1 write', async () => {
  const env = quotaEnv();
  const when = Date.parse('2026-10-27T23:59:59Z');
  const a = await consumePreviewAllowance(env, 'github:100', { now: when, max: 2 });
  assert.deepEqual([a.used,a.remaining,a.max],[1,1,2]);
  const b = await consumePreviewAllowance(env, 'github:100', { now: when, max: 2 });
  assert.equal(b.remaining,0);
  await assert.rejects(() => consumePreviewAllowance(env,'github:100',{now:when,max:2}), /allowance/);
  assert.equal((await consumePreviewAllowance(env,'github:101',{now:when,max:2})).used,1);
  assert.equal((await consumePreviewAllowance(env,'github:100',{now:when+2000,max:2})).used,1);
  assert.ok(env.sqlSeen[0].includes('ON CONFLICT(owner, day) DO UPDATE'));
  assert.ok(env.sqlSeen[0].includes('WHERE used < ?'));
  assert.equal(MAX_PREVIEWS_PER_UTC_DAY,16);
  await purgeOldPreviewUsage(env,when);
  assert.ok(env.sqlSeen.some(sql=>sql.startsWith('DELETE FROM preview_usage')));
});
test('quota rejects invalid clock and unreasonable limits', async () => {
  const env = quotaEnv();
  await assert.rejects(() => consumePreviewAllowance(env,'github:100',{now:Infinity}),/Invalid/);
  await assert.rejects(() => consumePreviewAllowance(env,'github:100',{max:1000}),/Invalid/);
});
