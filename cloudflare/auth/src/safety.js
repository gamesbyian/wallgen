export function htmlEscape(input) {
  return String(input).replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
}
export function permittedGitHubIdentity(user,allowlist) {
  if (!user || !Number.isSafeInteger(user.id) || user.id<=0 ||
      typeof user.login!=='string' || !user.login) return false;
  if(typeof allowlist!=='string'||!allowlist.trim())return false;
  const allowed=new Set(allowlist.split(',').map(s=>s.trim()).filter(Boolean));
  return allowed.has(String(user.id));
}
export function configurationReady(env) {
  return Boolean(env.AUTH_SERVER_URL?.startsWith('https://') &&
    env.MCP_SERVER_URL?.startsWith('https://') &&
    env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET &&
    env.ALLOWED_GITHUB_IDS?.trim());
}
