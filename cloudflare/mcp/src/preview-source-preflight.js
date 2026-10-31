// Cheap, fail-closed public source check BEFORE any billed Browser Run launch
// or D1 quota consumption. Browser Run independently checks the same manifest
// again inside its restricted page to eliminate preflight/render TOCTOU trust.
export function trustedRendererSource(env){
  const value=env?.RENDER_SOURCE_URL;
  if(typeof value!=='string'||value.includes('REPLACE'))
    throw Error('Render source is not configured');
  let url;
  try{url=new URL(value);}catch{throw Error('Render source URL is invalid');}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||
     !url.pathname.endsWith('/'))
    throw Error('Render source must be a trusted HTTPS directory URL, with trailing slash and no parameters');
  const expectedCommit=env.RENDER_EXPECTED_SHA;
  if(typeof expectedCommit!=='string'||!/^[a-f0-9]{40}$/.test(expectedCommit))
    throw Error('Trusted renderer revision was not configured');
  return {root:url.toString(),expectedCommit};
}

export async function preflightTrustedRendererRevision(env,{fetcher=fetch}={}){
  const {root,expectedCommit}=trustedRendererSource(env);
  const url=new URL('roygbiv-render-version.json',root);
  let response;
  try{
    response=await fetcher(url.toString(),{
      method:'GET',cache:'no-store',credentials:'omit',redirect:'error'
    });
  }catch{throw Error('Trusted renderer revision manifest unavailable');}
  if(!response?.ok)
    throw Error('Trusted renderer revision manifest unavailable');
  let body;
  try{body=await response.text();}
  catch{throw Error('Trusted renderer revision manifest unreadable');}
  // The published manifest is ~54 bytes. Refuse anomalous HTML/error bodies.
  if(typeof body!=='string'||body.length>256)
    throw Error('Trusted renderer revision manifest invalid');
  let manifest;
  try{manifest=JSON.parse(body);}
  catch{throw Error('Trusted renderer revision manifest invalid');}
  if(manifest?.commit!==expectedCommit)
    throw Error('Trusted renderer revision mismatch; preview disabled until verified');
  return {root,expectedCommit};
}
