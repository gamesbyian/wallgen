import { OAuthAuthorizationServer, AuthorizationError } from '@cloudflare/workers-oauth-provider';
import { env, WorkerEntrypoint } from 'cloudflare:workers';
import { htmlEscape, permittedGitHubIdentity, configurationReady } from './safety.js';

// Never instantiate an OAuth issuer for an unknown domain. Wrangler provides
// these exact HTTPS origins only after explicit operator configuration.
const authorizationServer = new OAuthAuthorizationServer({
  issuer: env.AUTH_SERVER_URL,
  resources: [env.MCP_SERVER_URL],
  scopesSupported: ['wallpaper:read','wallpaper:create','wallpaper:export','offline_access'],
  clientIdMetadataDocumentEnabled: true
});

function consentHtml(details,handle) {
  const scopes=details.scope.map(scope=>
    '<label><input type="checkbox" name="scope" value="'+htmlEscape(scope)+'" checked> '+
    htmlEscape(scope)+'</label>').join('');
  return '<!doctype html><html lang="en"><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Authorize ROYGBIV</title><body><main style="font:16px system-ui;max-width:36rem;margin:3rem auto;padding:1rem">'+
    '<h1>Authorize ROYGBIV</h1><p><strong>'+htmlEscape(details.clientName)+
    '</strong> requests access to your private ROYGBIV designs.</p>'+
    '<p>Credentials will be sent to <strong>'+htmlEscape(details.redirectHost)+'</strong>.</p>'+
    (details.redirectIsLoopback?'<p>This client redirects to an application on your device.</p>':'')+
    (details.clientDomain?'<p>Client domain: '+htmlEscape(details.clientDomain)+'</p>':'')+
    '<form method="post"><input type="hidden" name="handle" value="'+htmlEscape(handle)+'">'+
    '<fieldset><legend>Requested permissions</legend>'+scopes+'</fieldset>'+
    '<button name="decision" value="approve">Continue with GitHub</button> '+
    '<button name="decision" value="deny">Deny</button></form>'+
    '<p>Sign-in is restricted to approved GitHub users.</p></main></body></html>';
}
async function pkceChallenge(verifier){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function authorize(request,workerEnv){
  const oauth=authorizationServer.getOAuthApi(workerEnv);
  if(request.method==='GET'){
    const authRequest=await oauth.parseAuthRequest(request);
    const details=await oauth.describeConsent(authRequest);
    const consent=await oauth.beginConsent(authRequest);
    consent.headers.set('Content-Type','text/html; charset=utf-8');
    consent.headers.set('Cache-Control','no-store');
    return new Response(consentHtml(details,consent.handle),{headers:consent.headers});
  }
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  const form=await request.formData();
  const handle=String(form.get('handle')||'');
  if(form.get('decision')!=='approve'){
    const denied=await oauth.denyConsent(request,handle);
    return new Response(null,{status:302,headers:denied.headers});
  }
  const approved=await oauth.approveConsent(request,handle,{
    scope:form.getAll('scope').map(String)
  });
  const verifier=crypto.randomUUID()+crypto.randomUUID();
  const {state,headers}=await oauth.beginUpstream(approved.request,{
    data:{verifier},headers:approved.headers
  });
  const github=new URL('https://github.com/login/oauth/authorize');
  github.searchParams.set('client_id',workerEnv.GITHUB_CLIENT_ID);
  github.searchParams.set('redirect_uri',new URL('/callback',request.url).toString());
  github.searchParams.set('scope','read:user');
  github.searchParams.set('state',state);
  github.searchParams.set('code_challenge',await pkceChallenge(verifier));
  github.searchParams.set('code_challenge_method','S256');
  headers.set('Location',github.toString());
  return new Response(null,{status:302,headers});
}
async function callback(request,workerEnv){
  const oauth=authorizationServer.getOAuthApi(workerEnv);
  const {request:original,data,headers}=await oauth.finishUpstream(request);
  const code=new URL(request.url).searchParams.get('code');
  if(!code || typeof data?.verifier!=='string')return new Response('Invalid sign-in callback',{status:400});
  const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{
    method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},
    body:JSON.stringify({client_id:workerEnv.GITHUB_CLIENT_ID,
      client_secret:workerEnv.GITHUB_CLIENT_SECRET,code,code_verifier:data.verifier})
  });
  if(!tokenResponse.ok)return new Response('GitHub sign-in failed',{status:502});
  const token=await tokenResponse.json();
  if(typeof token.access_token!=='string'||!token.access_token)
    return new Response('GitHub did not issue a token',{status:403});
  const userResponse=await fetch('https://api.github.com/user',{
    headers:{Authorization:'Bearer '+token.access_token,
      'User-Agent':'roygbiv-mcp-auth','Accept':'application/vnd.github+json'}
  });
  if(!userResponse.ok)return new Response('GitHub identity check failed',{status:502});
  const user=await userResponse.json();
  if(!permittedGitHubIdentity(user,workerEnv.ALLOWED_GITHUB_IDS))
    return new Response('This GitHub account is not authorized for ROYGBIV.',{
      status:403,headers:{'Cache-Control':'no-store'}
    });
  // Store no upstream GitHub access token. Only the stable verified numeric ID
  // travels in resource-bound ROYGBIV token props.
  const {redirectTo}=await oauth.completeAuthorization({
    request:original,userId:'github:'+user.id,metadata:{},
    scope:original.scope,props:{userId:'github:'+user.id}
  });
  headers.set('Location',redirectTo);
  headers.set('Cache-Control','no-store');
  return new Response(null,{status:302,headers});
}
export default class AuthServer extends WorkerEntrypoint {
  async fetch(request) {
    if(!configurationReady(this.env))
      return new Response('ROYGBIV OAuth is not configured.',{status:503});
    const {pathname}=new URL(request.url);
    try{
      if(pathname==='/authorize')return await authorize(request,this.env);
      if(pathname==='/callback')return await callback(request,this.env);
      return authorizationServer.fetch(request,this.env,this.ctx);
    }catch(error){
      if(!(error instanceof AuthorizationError))throw error;
      if(error.redirectTo)return Response.redirect(error.redirectTo,302);
      return new Response(error.description,{status:400});
    }
  }
  validateToken(resource,token){
    if(!configurationReady(this.env))return null;
    return authorizationServer.validateToken(resource,token,this.env);
  }
}
