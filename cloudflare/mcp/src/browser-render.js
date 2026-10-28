import { launch } from '@cloudflare/playwright';
import { embedPngMetadata, extractPngRecipe } from '../../../src/png-metadata.js';

// Browser Run executes ROYGBIV's production Canvas renderer on a trusted
// deployment of the same code. A screenshot of the UI would be wrong.
function sourceUrl(env) {
  const value=env.RENDER_SOURCE_URL;
  if(typeof value!=='string'||value.includes('REPLACE'))throw Error('Render source is not configured');
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)
    throw Error('Render source must be an exact trusted HTTPS page without credentials');
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
  const browser=await launch(env.BROWSER);
  try {
    const page=await browser.newPage({viewport:{width:800,height:900}});
    await page.goto(sourceUrl(env),{waitUntil:'domcontentloaded',timeout:30000});
    const encoded=await page.evaluate(async ({recipe,width,height})=>{
      // These paths are same-origin relative to the configured trusted
      // deployment, never caller-generated import specifiers.
      const {drawWallpaper}=await import('/src/renderer.js');
      const {prepareTypefaces}=await import('/src/typography-fonts.js');
      await prepareTypefaces(recipe);
      const canvas=document.createElement('canvas');
      canvas.width=width;canvas.height=height;
      drawWallpaper(canvas,recipe);
      return canvas.toDataURL('image/png').split(',')[1];
    },{recipe,width,height});
    const encodedPng=embedPngMetadata(decodeBase64(encoded),{}, {recipe});
    const extracted=extractPngRecipe(encodedPng);
    if(JSON.stringify(extracted)!==JSON.stringify(recipe))
      throw Error('Hosted preview recipe roundtrip failed');
    return {bytes:encodedPng,width,height};
  } finally {
    await browser.close();
  }
}
