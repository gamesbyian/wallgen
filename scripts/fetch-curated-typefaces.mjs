#!/usr/bin/env node
// Exact-source font asset materialization. One-time authoring command,
// not an app runtime dependency. Each file and full OFL license is retained.
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
export const GOOGLE_FONTS_COMMIT='e7db6ca603fd4862010383ff17ffd6cc4ffac1c0';
export const FAMILY_SOURCES=Object.freeze([
  ['bangers','Bangers-Regular.ttf'],
  ['abrilfatface','AbrilFatface-Regular.ttf'],
  ['pacifico','Pacifico-Regular.ttf'],
  ['lobster','Lobster-Regular.ttf'],
  ['bebasneue','BebasNeue-Regular.ttf'],
  ['righteous','Righteous-Regular.ttf'],
  ['pressstart2p','PressStart2P-Regular.ttf'],
  ['monoton','Monoton-Regular.ttf'],
  ['cinzel','Cinzel[wght].ttf'],
  ['audiowide','Audiowide-Regular.ttf'],
  ['lilitaone','LilitaOne-Regular.ttf'],
  ['bungee','Bungee-Regular.ttf'],
  ['bungeeshade','BungeeShade-Regular.ttf'],
  ['shrikhand','Shrikhand-Regular.ttf'],
  ['rubikwetpaint','RubikWetPaint-Regular.ttf'],
  ['sacramento','Sacramento-Regular.ttf'],
  ['fugazone','FugazOne-Regular.ttf'],
  ['rubikglitch','RubikGlitch-Regular.ttf'],
  ['blackopsone','BlackOpsOne-Regular.ttf'],
  ['notable','Notable-Regular.ttf'],
  ['orbitron','Orbitron[wght].ttf'],
  ['nosifer','Nosifer-Regular.ttf'],
  ['fascinateinline','FascinateInline-Regular.ttf'],
  ['limelight','Limelight-Regular.ttf'],
  ['courgette','Courgette-Regular.ttf'],
  ['changaone','ChangaOne-Regular.ttf'],
  ['creepster','Creepster-Regular.ttf'],
]);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const url=(slug,file)=>'https://raw.githubusercontent.com/google/fonts/'+
  GOOGLE_FONTS_COMMIT+'/ofl/'+slug+'/'+file;
async function readPinned(slug,file){
  const response=await fetch(url(slug,file),{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Pinned Google Fonts '+slug+'/'+file+': HTTP '+response.status);
  return Buffer.from(await response.arrayBuffer());
}
function signature(buffer){
  return buffer.readUInt32BE(0)===0x00010000||buffer.readUInt32BE(0)===0x4f54544f;
}
const target=join(root,'assets','fonts');
await mkdir(join(target,'licenses'),{recursive:true});
const manifest={schema:1,source:'google/fonts',sourceCommit:GOOGLE_FONTS_COMMIT,license:'OFL-1.1',
  entries:{}};
for(const [slug,file] of FAMILY_SOURCES){
  const [font,licence]=await Promise.all([
    readPinned(slug,file),readPinned(slug,'OFL.txt')
  ]);
  if(!signature(font)||font.length<1024||font.length>2*1024*1024)
    throw Error('Font did not pass bounded native sfnt/OTF header check: '+slug);
  const text=licence.toString('utf8');
  if(!/^Copyright /i.test(text)||!text.includes('SIL OPEN FONT LICENSE')||
    !text.includes('Version 1.1'))
    throw Error('License not verified as OFL 1.1: '+slug);
  const hash=createHash('sha256').update(font).digest('hex');
  const name=slug+'.ttf';
  await writeFile(join(target,name),font);
  await writeFile(join(target,'licenses',slug+'-OFL.txt'),licence);
  manifest.entries[slug]={file:name,bytes:font.length,sha256:hash,
    license:'licenses/'+slug+'-OFL.txt',upstream:'ofl/'+slug+'/'+file};
  console.log(slug+' verified: '+font.length+' bytes, SHA-256 '+hash.slice(0,16));
}
await writeFile(join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('CURATED PACK READY: '+Object.keys(manifest.entries).length+' licensed bundled fonts');
