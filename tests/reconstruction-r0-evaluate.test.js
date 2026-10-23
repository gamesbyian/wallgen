import test from 'node:test';
import assert from 'node:assert/strict';
import {readBaselineArgs,RECONSTRUCTION_R0_CASES} from '../scripts/review-reconstruction.mjs';
import {readReconstructionEvalArgs,classifyReconstructionManifest} from '../scripts/evaluate-reconstruction-r0.mjs';

test('focused R0 generation targets known source studies without resetting browser arg',()=>{
 const opts=readBaselineArgs(['--only','01-vertical-straight,11-scattered-circles',
   '--out-dir','artifacts/r0-target','--browser','/usr/bin/chromium']);
 assert.equal(opts.only,'01-vertical-straight,11-scattered-circles');
 assert.equal(opts.outDir,'artifacts/r0-target');
 assert.equal(opts.browser,'/usr/bin/chromium');
 assert.ok(RECONSTRUCTION_R0_CASES.some(x=>x.id==='11-scattered-circles'));
});
test('production evaluator CLI is opt-in and read-only by default',()=>{
 assert.deepEqual(readReconstructionEvalArgs([]),{dir:'artifacts/reconstruction-r0'});
 assert.deepEqual(readReconstructionEvalArgs(['--dir','artifacts/foo','--browser','/bin/chromium']),
 {dir:'artifacts/foo',browser:'/bin/chromium'});
 assert.equal(readReconstructionEvalArgs(['--help']).help,true);
 assert.throws(()=>readReconstructionEvalArgs(['--dir']),/incomplete/);
 assert.throws(()=>readReconstructionEvalArgs(['--unsafe-upload']),/Unknown/);
});


test('optional alternative preview output requires an explicit opt-in flag',()=>{
 assert.deepEqual(readReconstructionEvalArgs(['--alternatives']),
   {dir:'artifacts/reconstruction-r0',alternatives:true});
 assert.deepEqual(readReconstructionEvalArgs(['--dir','artifacts/a','--alternatives']),
   {dir:'artifacts/a',alternatives:true});
 assert.throws(()=>readReconstructionEvalArgs(['--variants']),/Unknown/);
});


test('independently authored external graphics have no invented canonical ground truth',()=>{
 const external={
   schema:'roygbiv-reconstruction-external/v1',items:[
     {id:'owner-svg-ribbons',metadataFree:'owner-svg-ribbons.png'},
     {id:'owner-pigment-orbits',metadataFree:'owner-pigment-orbits.png'}
   ]};
 assert.equal(classifyReconstructionManifest(external).external,true);
 assert.equal(classifyReconstructionManifest({
   schema:'roygbiv-reconstruction-r0/v1',items:[
     {id:'real-current-r0',metadataFree:'real-current-r0.no-metadata.png',
       recipeFile:'real-current-r0.recipe.json'}
   ]}).external,false);
 assert.throws(()=>classifyReconstructionManifest({...external,items:[
   {...external.items[0],recipeFile:'invented.recipe.json'}
 ]}),/cannot claim/);
 assert.throws(()=>classifyReconstructionManifest({...external,items:[
   {...external.items[0],seed:'alleged-seed'}
 ]}),/cannot claim/);
 assert.throws(()=>classifyReconstructionManifest({...external,items:[
   ...external.items,external.items[0]
 ]}),/duplicate/);
 assert.throws(()=>classifyReconstructionManifest({...external,items:[
   {id:'escape',metadataFree:'../something.png'}
 ]}),/Invalid/);
 assert.throws(()=>classifyReconstructionManifest({
   ...external,items:Array.from({length:5},(_,i)=>({
     id:'five-'+i,metadataFree:'five-'+i+'.png'
   }))
 }),/count/);
 assert.throws(()=>classifyReconstructionManifest({...external,
   schema:'unknown-evidence'}),/Unsupported/);
});
