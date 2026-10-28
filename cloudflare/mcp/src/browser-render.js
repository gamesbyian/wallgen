import { launch } from '@cloudflare/playwright';
import { embedPngMetadata, extractPngRecipe } from '../../../src/png-metadata.js';

// Browser Run executes ROYGBIV's production Canvas renderer on a trusted
// deployment of the same code. A screenshot of the UI would be wrong.
function sourceUrl(env) {
  const value=env.RENDER_SOURCE_URL;
  if(typeof value!=='string'||value.includes('REPLACE'))throw Error('Render source is not configured');
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!url.pathname.endsWith('/'))
    throw Error('Render source must be a trusted HTTPS directory URL, with trailing slash and no parameters');
  return url.toString();
}
function decodeBase64(encoded) {
  const raw=atob(encoded);
  const buffer=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)buffer[i]=raw.charCodeAt(i);
  return buffer;
}
export async function renderPreview(env,recipe,width=300) {
  if(!env.BROWSER)throw Error('Cloudflare Browser Run binding is not configured');
  if(!Number.isInteger(width)||width<180||width>600)
    throw RangeError('Preview width must be between 180 and 600 pixels');
  const height=Math.round(width*13/6);
  const root=sourceUrl(env);
  // The static render host has no application scripts, styles or UI.
  // Loading the full editor here would run unrelated code before a private
  // recipe reaches the canvas, waste browser time and widen the trust surface.
  const hostUrl=new URL('render-host.html',root).href;
  const expectedCommit=env.RENDER_EXPECTED_SHA;
  if(typeof expectedCommit!=='string'||!/^[a-f0-9]{40}$/.test(expectedCommit))
    throw Error('Trusted renderer revision was not configured');
  // Network restrictions are enforced by Browser Run itself, before the
  // page or its scripts execute. Page.route below is a second, path-level
  // same-origin restriction, not the only containment boundary.
  let browser;
  try {
    browser=await launch(env.BROWSER,{
      guardrails:{allowedDomains:[new URL(root).hostname]}
    });
  } catch (error) {
    const message=String(error?.message||'');
    if (/429/.test(message) && /rate limit exceeded/i.test(message)) {
      throw Error('Cloudflare Browser Run rejected a new browser launch (HTTP 429 rate limit). The free plan permits one new browser approximately every 20 seconds; this may also reflect another account-level limit. Try again later. No image was rendered.');
    }
    if (/429/.test(message) && /browser time limit exceeded/i.test(message)) {
      throw Error('Cloudflare Browser Run daily browser-time allowance is exhausted. Browser access normally resets at 00:00 UTC on the free plan. No image was rendered.');
    }
    throw error;
  }
  try {
    const context=await browser.newContext({viewport:{width:800,height:900},serviceWorkers:'block'});
    const page=await context.newPage();
    // Recipe data enters the page context. Restrict its requests to GETs
    // for the configured static renderer origin, with no query or hash.
    const rootOrigin=new URL(root).origin;
    await page.route('**/*',route=>{
      const req=route.request();
      const url=new URL(req.url());
      if(req.method()==='GET' && url.origin===rootOrigin && !url.search && !url.hash)
        return route.continue();
      return route.abort();
    });
    const response=await page.goto(hostUrl,{waitUntil:'domcontentloaded',timeout:30000});
    if(!response?.ok() || page.url()!==hostUrl)
      throw Error('Trusted renderer page was unavailable or redirected');
    // A stuck page must not hold an unbounded browser session.
    let timeout;
    const encoded=await Promise.race([
      page.evaluate(async ({recipe,width,height,root,expectedCommit})=>{
        // Check the Pages deployment stamp *inside the same isolated browser*
        // before executing any renderer modules or touching private artwork.
        // A Pages update ahead of the worker fails closed until independently
        // matched and intentionally redeployed.
        const manifestResponse=await fetch(new URL('roygbiv-render-version.json',root),{
          cache:'no-store',credentials:'omit',redirect:'error'
        });
        if(!manifestResponse.ok)throw Error('Trusted renderer revision manifest unavailable');
        const manifest=await manifestResponse.json();
        if(manifest?.commit!==expectedCommit)
          throw Error('Trusted renderer revision mismatch; preview disabled until verified');
        // These paths are same-origin relative to our trusted root,
        // never caller-generated import specifiers.
        const {drawWallpaper}=await import(new URL('src/renderer.js',root).href);
        const {prepareTypefaces}=await import(new URL('src/typography-fonts.js',root).href);
        await prepareTypefaces(recipe);
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        drawWallpaper(canvas,recipe);
        return canvas.toDataURL('image/png').split(',')[1];
      },{recipe,width,height,root,expectedCommit}),
      new Promise((_,reject)=>{timeout=setTimeout(()=>reject(
        Error('Hosted preview exceeded its 45-second rendering limit')),45000);})
    ]).finally(()=>clearTimeout(timeout));
    const encodedPng=embedPngMetadata(decodeBase64(encoded),{}, {recipe,output:{width,height}});
    if(encodedPng.length>3*1024*1024)
      throw Error('Hosted preview PNG exceeded the 3 MiB limit');
    const extracted=extractPngRecipe(encodedPng);
    if(JSON.stringify(extracted)!==JSON.stringify(recipe))
      throw Error('Hosted preview recipe roundtrip failed');
    return {bytes:encodedPng,width,height};
  } finally {
    await browser.close();
  }
}
