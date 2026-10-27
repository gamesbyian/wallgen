import { OAuthAuthorizationServer } from '@cloudflare/workers-oauth-provider';

// Authorization-server scaffold. /authorize intentionally fails closed until
// a real upstream identity provider, user allowlist, CSRF and explicit consent
// have been configured and exercised against a genuine MCP client.
const server=new OAuthAuthorizationServer({
  issuer:'https://REPLACE-AUTH-HOST',
  resources:['https://REPLACE-MCP-HOST/mcp'],
  scopesSupported:['wallpaper:read','wallpaper:create','wallpaper:export','offline_access'],
  clientIdMetadataDocumentEnabled:true
});
export default class AuthServer extends WorkerEntrypoint {
  fetch(request) {
    const url=new URL(request.url);
    if(url.pathname==='/authorize')
      return new Response('Identity provider and user consent are not configured.',{
        status:503,headers:{'Cache-Control':'no-store','Content-Type':'text/plain'}
      });
    return server.fetch(request,this.env,this.ctx);
  }
  validateToken(resource,token) {
    return server.validateToken(resource,token,this.env);
  }
}
