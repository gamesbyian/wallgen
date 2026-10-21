#!/usr/bin/env node
/** Promote previously inspected, genuine Chromium screenshot pixels.
 * Reject source revision, changed bytes, missing/altered screen or candidate. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';

const input=resolve('visual-input');
const output=resolve('docs/ui-reference/actual-implementation');
const canonical=['studio','geometry','draw','explore','more','material',
 'colour','diagonal','compact','focus','history','search'];
const candidates=['pan','anchor-points','smooth-path','extend-path','weave',
 'focus-slider','metadata','restore-variation'];
const platePaths=['cream','dark'].flatMap(theme=>
 canonical.map(screen=>'implemented-plates/'+theme+'-'+screen+'.png'));
const paths=[...platePaths,...candidates.map(id=>'icons/'+id+'-states.png')].sort();
assert.equal(paths.length,32);
const manifest=JSON.parse(await readFile(join(input,'manifest.json'),'utf8'));
const source=manifest.sourceProvenance;
assert.deepEqual(manifest.errors,[],'Browser capture was not green');
assert.equal(source.runId,'39527554784');
assert.equal(source.checkedOutCommit,'89b09ea54da1368335785038bfd05eeed717eb8f');
assert.equal(source.pullRequestHeadCommit,'91595db469e02868bb1b986bbabeceb7c6859342');
assert.equal(source.runUrl,'https://github.com/gamesbyian/wallgen/actions/runs/39527554784');
assert.equal(manifest.implementationPlates.length,24);
const changes=execFileSync('git',[
 'diff','--name-only','d55bfe383c0fd72b080ea399e12e28f1d5bbfdf8','HEAD',
 '--','index.html','src/','assets/icons/','assets/roygbiv-logo.svg',
 'styles.css','studio-themes.css','mobile-compact.css','mobile-five-nav.css',
 'mobile-more-groups.css','mobile-editor-rail.css','editor-redesign.css',
 'editor-setting-rows.css','editor-material-status.css','detail-controls.css',
 'image-path.css','draw-path.css','ui-audit-fixes.css'
],{encoding:'utf8'}).trim();
assert.equal(changes,'','Presentation source changed since the independently inspected run');
const map=new Map(manifest.implementationPlates.map(p=>
 ['implemented-plates/'+p.theme+'-'+p.screen+'.png',p]));
const signature=Buffer.from('89504e470d0a1a0a','hex');
const aggregate=createHash('sha256');
const individual={};
for(const path of paths){
 const bytes=await readFile(join(input,path));
 aggregate.update(path);aggregate.update(Buffer.from([0]));
 aggregate.update(bytes);aggregate.update(Buffer.from([0]));
 assert.ok(bytes.subarray(0,8).equals(signature),'Not actual PNG: '+path);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(path.startsWith('implemented-plates/')){
  const plate=map.get(path);
  assert.ok(plate,'Not a canonical source plate: '+path);
  assert.equal(plate.sourceCommit,source.checkedOutCommit);
  assert.equal(plate.image,path);
  assert.equal(width,412);assert.equal(height,892);
  const live=await readFile(join(input,plate.source));
  assert.ok(bytes.equals(live),'Promotion source is not byte-identical to running Chromium: '+path);
 }else{
  assert.equal(width,1280);assert.equal(height,900);
 }
 const target=join(output,path);
 await mkdir(dirname(target),{recursive:true});
 await copyFile(join(input,path),target);
 individual[path]=createHash('sha256').update(bytes).digest('hex');
}
assert.equal(aggregate.digest('hex'),
 '41ce3b1dbffd1d2b15fb8dafb50f9f3548c472cf1e4989cc09bbf7a14d2521ed',
 'Independently inspected screenshots changed; refuse promotion');
const table=canonical.map(screen=>
 '| '+screen+' | !['+screen+' cream](actual-implementation/implemented-plates/cream-'+screen+
 '.png) | !['+screen+' dark](actual-implementation/implemented-plates/dark-'+screen+
 '.png) | [Original '+screen+' schematic]('+screen+'.svg) |').join('\n');
const advice={
 pan:'Label View frame Pan and never composition nudge',
 'anchor-points':'Label Edit anchors; 20px node handles are small',
 'smooth-path':'Label Interpret / Resmooth; never claim a drawing pencil',
 'extend-path':'Dense at 20px; prefer 24px+ or adjacent text',
 weave:'Add text for crossings/over/under; colour alone is insufficient',
 'focus-slider':'Explicit Focus label; do not replace the default All inspector',
 metadata:'Corrected page outlines on dark surfaces; label Metadata',
 'restore-variation':'Label Restore; avoid conflating History and Undo'
};
let companion='# Actual implementation companion (source screenshots)\n\n'+
'**All images are byte-exact screenshots of the actual app**, not approved-reference redraws. '+
'Independent AI optical inspection was conducted before promotion. The original twelve '+
'SVG wireframes remain unchanged. Source was [Chromium run 39527554784]'+
'(https://github.com/gamesbyian/wallgen/actions/runs/39527554784), tested checkout '+
'sha '+source.checkedOutCommit+'. No presentation files changed between source approval '+
'and this commit. See review-provenance.json for the 32 SHA-256 values.\n\n'+
'## 12 source states in both themes at 412 x 892\n\n'+
'| Source state | Cream | Dark | Original schematic |\n'+
'| :--- | :---: | :---: | :--- |\n'+table+'\n\n'+
'## Eight independent SVG candidate screenshots (still unwired)\n\n';
for(const id of candidates)
 companion+='### '+id+'\n\n!['+id+' source candidate states]'+
 '(actual-implementation/icons/'+id+'-states.png)\n\n'+advice[id]+'.\n\n';
companion+='## Boundaries\n\n'+
'Optical evidence means these exact screenshots were inspected as real pixels. '+
'It does **not** claim human preferences, a physical Android test, or native '+
'assistive-technology speech. Candidate vectors remain unwired until individually mapped '+
'to their exact existing controls and their size/label restrictions are satisfied. '+
'Uncommon responsive/conditional states remain in the live CI artifact and source audit; '+
'do not confuse these 24 named 412px plates with exhaustive app certification.\n';
await writeFile(resolve('docs/ui-reference/ACTUAL-IMPLEMENTATION-COMPANION.md'),companion);
await writeFile(join(output,'review-provenance.json'),JSON.stringify({
 source,originalRun:source.runUrl,sha256:individual,
 aggregateSha256:'41ce3b1dbffd1d2b15fb8dafb50f9f3548c472cf1e4989cc09bbf7a14d2521ed',
 count:paths.length,
 independentAiOpticalReview:true,humanUserApproval:false,physicalDevice:false
},null,2)+'\n');
console.log('SOURCE_PLATES_PROMOTED',paths.length,'24 Chromium plates and 8 SVG candidate screenshots');
