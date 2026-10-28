// D1 serializes expensive Browser Run launches across Worker isolates.
// An in-memory promise queue cannot protect against independently scheduled
// requests or multiple edge isolates. No user data enters this table.
export const LEASE_MS = 120000;
const KEY = 'global-browser';

export async function acquirePreviewLease(env,{now=Date.now()}={}) {
  if(!Number.isSafeInteger(now)||now<0)throw RangeError('Invalid browser lease timestamp');
  const token=crypto.randomUUID();
  // Single atomic statement. Only one caller can obtain/steal the lease.
  // A crashed Worker cannot reserve Browser Run permanently.
  const row=await env.RECIPES.prepare(
    'INSERT INTO preview_leases (lease_key, token, acquired_at) VALUES (?, ?, ?) '+
    'ON CONFLICT(lease_key) DO UPDATE SET token=excluded.token, acquired_at=excluded.acquired_at '+
    'WHERE preview_leases.acquired_at < ? RETURNING token'
  ).bind(KEY,token,now,now-LEASE_MS).first();
  if(row?.token!==token)
    throw Error('A ROYGBIV preview is already rendering. Retry after it finishes.');
  return {token,expiresAt:now+LEASE_MS};
}

export async function releasePreviewLease(env,lease) {
  if(typeof lease?.token!=='string'||!lease.token)
    throw Error('Invalid preview render lease');
  // Only the current holder can release. An old timed-out request must not
  // delete a newer request's lease.
  return env.RECIPES.prepare(
    'DELETE FROM preview_leases WHERE lease_key = ? AND token = ?'
  ).bind(KEY,lease.token).run();
}

export const LAUNCH_GAP_MS = 21000;

/** Reserve the free-plan launch cadence across all Worker isolates.
 * Atomic D1 statement; failed reservation never charges a preview.
 * Successful reservations are intentionally kept even on Browser Run 429.
 */
export async function reservePreviewLaunch(env,{now=Date.now()}={}) {
  if(!Number.isSafeInteger(now)||now<0)throw RangeError('Invalid browser launch timestamp');
  const key='global-browser-launch';
  const row=await env.RECIPES.prepare(
    'INSERT INTO preview_launch_pacing (key, last_launch_at) VALUES (?, ?) '+
    'ON CONFLICT(key) DO UPDATE SET last_launch_at=excluded.last_launch_at '+
    'WHERE preview_launch_pacing.last_launch_at <= ? RETURNING last_launch_at'
  ).bind(key,now,now-LAUNCH_GAP_MS).first();
  if (!row) throw Error('Cloudflare Browser Run free-tier launch spacing: retry in approximately 21 seconds. No preview allowance was spent.');
  return row.last_launch_at;
}
