import { ownerKey } from './storage.js';

// Closed unless explicitly opted in by the operator AND provisioned with a
// Browser Run binding and a trusted ROYGBIV source URL. Never offer the tool
// when one of those prerequisites is missing.
export function previewConfigured(env) {
  if (env?.HOSTED_PREVIEW_ENABLED !== 'true' ||
      !env.BROWSER || !env.RECIPES ||
      typeof env.RENDER_SOURCE_URL !== 'string' ||
      env.RENDER_SOURCE_URL.includes('REPLACE') ||
      !/^[0-9a-f]{40}$/.test(env.RENDER_EXPECTED_SHA || '')) return false;
  try {
    const url = new URL(env.RENDER_SOURCE_URL);
    return url.protocol === 'https:' && !url.username && !url.password &&
      !url.search && !url.hash && url.pathname.endsWith('/');
  } catch { return false; }
}

export const MAX_PREVIEWS_PER_UTC_DAY = 16;

/**
 * Charge a bounded daily allowance *before* launching a paid browser.
 * One SQLite UPSERT is atomic even when multiple MCP requests arrive at once.
 * Failed renders consume a slot: no retry loop or free-failure cost hole.
 */
export async function consumePreviewAllowance(env, userId, {
  now = Date.now(), max = MAX_PREVIEWS_PER_UTC_DAY
} = {}) {
  if (!Number.isFinite(now) || !Number.isInteger(max) || max < 1 || max > 30)
    throw new RangeError('Invalid hosted preview quota');
  const day = new Date(now).toISOString().slice(0, 10);
  const owner = ownerKey(userId);
  const row = await env.RECIPES.prepare(
    'INSERT INTO preview_usage (owner, day, used) VALUES (?, ?, 1) ' +
    'ON CONFLICT(owner, day) DO UPDATE SET used = used + 1 WHERE used < ? ' +
    'RETURNING used'
  ).bind(owner, day, max).first();
  if (!row) throw new Error('Daily hosted preview allowance reached. Try again after 00:00 UTC.');
  return { used: row.used, remaining: max - row.used, max, resetsAt: new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString() };
}

export async function purgeOldPreviewUsage(env, now = Date.now()) {
  const cutoff = new Date(now - 2 * 86400000).toISOString().slice(0, 10);
  return env.RECIPES.prepare('DELETE FROM preview_usage WHERE day < ?')
    .bind(cutoff).run();
}
