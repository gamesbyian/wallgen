import { McpServer, createMcpHandler } from '@modelcontextprotocol/server';
import { env as workerEnv } from 'cloudflare:workers';
import { OAuthResourceServer, insufficientScope } from '@cloudflare/workers-oauth-provider';
import * as z from 'zod/v4';
import { describeAgentCapabilities, composeAgentRecipe, inspectAgentRecipe } from '../../../src/agent-api.js';
import { saveRecipe, loadRecipe, editStored, varyStored, exploreStored, purgeExpiredRecipes } from './storage.js';
import { renderPreview } from './browser-render.js';

const asResult=value=>({content:[{type:'text',text:JSON.stringify(value)}]});
const guarded=fn=>async args=>{
  try{return asResult(await fn(args));}
  catch(err){return {isError:true,content:[{type:'text',text:err.message||'Request failed'}]};}
};
const requireIdentity=props=>{
  if(!props?.userId || typeof props.userId!=='string')throw Error('Verified identity required');
  return props.userId;
};
export function createServer(env,props,scopes) {
  const userId=requireIdentity(props);
  const mcp=new McpServer({name:'roygbiv-hosted',version:'0.1.0'});
  const id=z.string().regex(/^design-[a-f0-9]{16}$/);
  const settings=z.record(z.string(),z.unknown()).optional();
  const check=(scope,fn)=>guarded(async args=>{
    if(!scopes.includes(scope))throw Error('Insufficient scope: '+scope);
    return fn(args);
  });
  mcp.registerTool('roygbiv_describe',{description:'Discover supported ROYGBIV canonical wallpaper controls',inputSchema:z.object({})},check('wallpaper:read',()=>describeAgentCapabilities()));
  mcp.registerTool('roygbiv_compose',{description:'Create a private canonical ROYGBIV design',inputSchema:z.object({
    style:z.string().default('studio'),seed:z.string().max(90).default('agent-001'),
    settings,locks:z.array(z.string()).optional()
  })},check('wallpaper:create',async args=> {
    const result=await saveRecipe(env,userId,composeAgentRecipe(args));
    return {id:result.id,inspect:inspectAgentRecipe(result.recipe)};
  }));
  mcp.registerTool('roygbiv_import',{description:'Import a complete canonical v2 recipe into your private storage',inputSchema:z.object({
    recipe:z.record(z.string(),z.unknown())
  })},check('wallpaper:create',async({recipe})=>{
    const saved=await saveRecipe(env,userId,recipe);
    return {id:saved.id,inspect:inspectAgentRecipe(saved.recipe)};
  }));
  mcp.registerTool('roygbiv_inspect',{description:'Retrieve your own editable design and scene summary',inputSchema:z.object({id})},check('wallpaper:read',async({id})=>{
    const recipe=await loadRecipe(env,userId,id);
    return {id,recipe,inspect:inspectAgentRecipe(recipe)};
  }));
  mcp.registerTool('roygbiv_edit',{description:'Change canonical controls on a privately owned design',inputSchema:z.object({
    id,settings,lock:z.array(z.string()).optional(),unlock:z.array(z.string()).optional()
  })},check('wallpaper:create',async({id,...options})=>{
    const saved=await editStored(env,userId,id,options);return {id:saved.id,inspect:inspectAgentRecipe(saved.recipe)};
  }));
  mcp.registerTool('roygbiv_vary',{description:'Scoped deterministic design variation',inputSchema:z.object({
    id,category:z.string().optional(),tool:z.string().optional(),setting:z.string().optional(),
    mode:z.enum(['vary','reroll']).optional(),strength:z.enum(['gentle','moderate','wild']).optional(),
    seed:z.string().max(90).optional()
  })},check('wallpaper:create',async({id,...options})=>varyStored(env,userId,id,options)));
  mcp.registerTool('roygbiv_explore',{description:'Create up to twelve privately stored design alternatives',inputSchema:z.object({
    id,count:z.number().int().min(1).max(12).optional(),seed:z.string().max(90).optional(),
    categories:z.array(z.string()).max(7).optional(),strength:z.enum(['gentle','moderate','wild']).optional()
  })},check('wallpaper:create',async({id,...options})=>({candidates:await exploreStored(env,userId,id,options)})));
  // Preview is opt-in per deployment, only after a trusted static ROYGBIV
  // source URL is configured and a real Browser Run binding is available.
  // Native export is intentionally not advertised without verified quotas.
  if(env.RENDER_SOURCE_URL && !env.RENDER_SOURCE_URL.includes('REPLACE') && env.BROWSER) {
    mcp.registerTool('roygbiv_preview',{
      description:'Render true ROYGBIV pixels through Cloudflare Browser Run for a private design; inspect the resulting image.',
      inputSchema:z.object({id,width:z.number().int().min(180).max(600).default(300)})
    },async({id,width})=>{
      try{
        if(!scopes.includes('wallpaper:create'))throw Error('Insufficient scope: wallpaper:create');
        const recipe=await loadRecipe(env,userId,id);
        const result=await renderPreview(env,recipe,width);
        // Build base64 in safe chunks, avoiding giant argument lists.
        let binary='';
        for(const b of result.bytes)binary+=String.fromCharCode(b);
        return {content:[
          {type:'image',data:btoa(binary),mimeType:'image/png'},
          {type:'text',text:JSON.stringify({id,width:result.width,height:result.height,
            authenticRenderer:true,previewOnly:true})}
        ]};
      }catch(e){return {isError:true,content:[{type:'text',text:e.message}]};}
    });
  }
  return mcp;
}
export function createResourceHandler(env,props,scopes) {
  return createMcpHandler(()=>createServer(env,props,scopes),{responseMode:'json'});
}
const app={
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/health')return Response.json({service:'roygbiv-mcp',status:'auth-required',rendering:'not-configured'});
    return new Response('Not found',{status:404});
  }
};
const oauthResource = new OAuthResourceServer({
  resourceMetadata:{
    resource:workerEnv.MCP_SERVER_URL || 'https://invalid.example/mcp',
    authorization_servers:[workerEnv.AUTH_SERVER_URL || 'https://invalid.example']
  },
  requiredScopes:['wallpaper:read'],
  validateToken:env=>env.AUTH_SERVER.validateToken,
  handler:{
    async fetch(request,env,ctx){
      if(new URL(request.url).pathname!=='/mcp')return app.fetch(request,env,ctx);
      const scopes=ctx.auth?.scope||[];
      if(!scopes.includes('wallpaper:read'))return insufficientScope(ctx.auth,['wallpaper:read']);
      if(request.method==='POST' && !scopes.includes('wallpaper:create')) {
        // Step-up only for mutation tools. Preserve read-only tools and
        // MCP initialize/list calls under the read scope.
        const body=await request.clone().json().catch(()=>null);
        const writeTools=new Set(['roygbiv_compose','roygbiv_import','roygbiv_edit',
          'roygbiv_vary','roygbiv_explore','roygbiv_preview']);
        if(body?.method==='tools/call'&&writeTools.has(body.params?.name))
          return insufficientScope(ctx.auth,['wallpaper:read','wallpaper:create']);
      }
      const url=new URL(request.url);
      if(request.headers.get('origin') && request.headers.get('origin')!==url.origin)
        return new Response('Forbidden origin',{status:403});
      const handler=createResourceHandler(env,ctx.props,scopes);
      return handler.fetch(request);
    }
  }
});

export default {
  fetch(request,env,ctx){return oauthResource.fetch(request,env,ctx);},
  async scheduled(event,env,ctx) {
    // Iterate in bounded batches only. Additional expired designs are picked
    // up by the next scheduled execution, never one unbounded invocation.
    ctx.waitUntil(purgeExpiredRecipes(env,{ttlDays:30,limit:100}));
  }
};
