import {rememberFontCoverage} from './font-glyph-coverage.js';
// 27 visually distinct OFL faces, vendored from one pinned Google Fonts
// commit with a verbatim license per family. Loaded only when a recipe needs
// the face; worker and document independently check the same SHA-256 bytes.
const choices=[
  ['bangers','Bangers','Poster'],
  ['abrilfatface','Abril Fatface','Editorial'],
  ['pacifico','Pacifico','Hand-lettered'],
  ['lobster','Lobster','Hand-lettered'],
  ['bebasneue','Bebas Neue','Poster'],
  ['righteous','Righteous','Retro'],
  ['pressstart2p','Press Start 2P','Arcade'],
  ['monoton','Monoton','Neon & display'],
  ['cinzel','Cinzel','Editorial'],
  ['audiowide','Audiowide','Futuristic'],
  ['lilitaone','Lilita One','Friendly'],
  ['bungee','Bungee','Poster'],
  ['bungeeshade','Bungee Shade','3D & outline'],
  ['shrikhand','Shrikhand','Retro'],
  ['rubikwetpaint','Rubik Wet Paint','Expressive'],
  ['sacramento','Sacramento','Script'],
  ['fugazone','Fugaz One','Poster'],
  ['rubikglitch','Rubik Glitch','Experimental'],
  ['blackopsone','Black Ops One','Stencil'],
  ['notable','Notable','Stencil'],
  ['orbitron','Orbitron','Futuristic'],
  ['nosifer','Nosifer','Horror'],
  ['fascinateinline','Fascinate Inline','Outline'],
  ['limelight','Limelight','Art Deco'],
  ['courgette','Courgette','Script'],
  ['changaone','Changa One','Friendly'],
  ['creepster','Creepster','Horror'],
];
export const BUNDLED_FONTS=Object.freeze(Object.fromEntries(choices.map(
  ([slug,label,group])=>['pack-'+slug,Object.freeze({slug,label,group})])));
export const isBundledFontId=id=>typeof id==='string'&&Object.hasOwn(BUNDLED_FONTS,id);
export const bundledFontFamily=id=>{
  if(!isBundledFontId(id))throw Error('Unknown bundled font');
  return 'ROYGBIV-Bundle-'+BUNDLED_FONTS[id].slug;
};
const ready=new Set(),inflight=new Map();
let manifestPromise;
const fontSet=()=>globalThis.document?.fonts||globalThis.fonts;
async function manifest(){
  if(!manifestPromise){
    const location=new URL('../assets/fonts/manifest.json',import.meta.url);
    manifestPromise=fetch(location).then(response=>{
      if(!response.ok)throw Error('Typeface manifest unavailable');
      return response.json();
    }).then(value=>{
      if(value.schema!==1||value.sourceCommit!=='e7db6ca603fd4862010383ff17ffd6cc4ffac1c0')
        throw Error('Unexpected bundled typeface manifest version');
      return value;
    }).catch(error=>{manifestPromise=null;throw error;});
  }
  return manifestPromise;
}
export function bundledFontsReady(recipe){
  return (recipe?.textOverlays||[]).filter(x=>x.enabled!==false&&x.text&&isBundledFontId(x.font))
    .every(x=>ready.has(x.font));
}
export async function prepareBundledFonts(recipe){
  const ids=[...new Set((recipe?.textOverlays||[]).filter(x=>x.enabled!==false&&x.text)
    .map(x=>x.font).filter(isBundledFontId))];
  for(const id of ids){
    if(ready.has(id))continue;
    if(inflight.has(id)){await inflight.get(id);continue;}
    const task=(async()=>{
      if(typeof FontFace!=='function'||!fontSet()?.add)
        throw Error('Bundled fonts require browser FontFace/FontFaceSet support');
      if(!globalThis.crypto?.subtle)throw Error('Font integrity checking unavailable');
      const slug=BUNDLED_FONTS[id].slug;
      const metadata=(await manifest()).entries?.[slug];
      if(!metadata||metadata.file!==slug+'.ttf'||!/^[a-f0-9]{64}$/.test(metadata.sha256))
        throw Error('Bundled font is missing from the pinned manifest: '+slug);
      const url=new URL('../assets/fonts/'+metadata.file,import.meta.url);
      const response=await fetch(url);
      if(!response.ok)throw Error('Bundled '+slug+' font unavailable; reconnect or retry.');
      const bytes=await response.arrayBuffer();
      if(bytes.byteLength!==metadata.bytes)throw Error('Incorrect '+slug+' font byte size');
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
        b=>b.toString(16).padStart(2,'0')).join('');
      if(digest!==metadata.sha256)throw Error('Bundled '+slug+' font integrity check failed');
      const face=new FontFace(bundledFontFamily(id),bytes,{style:'normal',weight:'700'});
      await face.load();
      fontSet().add(face);
      if(typeof document!=='undefined')rememberFontCoverage(id,bytes); // Already SHA-256-checked and natively decoded.
      ready.add(id);
    })();
    inflight.set(id,task);
    try{await task;}
    finally{inflight.delete(id);}
  }
}
