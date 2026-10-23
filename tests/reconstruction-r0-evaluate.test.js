import test from 'node:test';
import assert from 'node:assert/strict';
import {readBaselineArgs,RECONSTRUCTION_R0_CASES} from '../scripts/review-reconstruction.mjs';
import {readReconstructionEvalArgs} from '../scripts/evaluate-reconstruction-r0.mjs';

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
