import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReconstructionJourneyArgs} from '../scripts/check-reconstruction-journey.mjs';

test('actual browser reconstruction journey is opt-in and cannot target remote servers',()=>{
 const url='http://127.0.0.1:8712';
 const args=['--url',url,'--source','artifacts/r0-wave.png',
   '--out-dir','artifacts/r0-journey'];
 assert.deepEqual(parseReconstructionJourneyArgs(args),{
   url,source:'artifacts/r0-wave.png','out-dir':'artifacts/r0-journey'});
 assert.equal(parseReconstructionJourneyArgs(['--help']).help,true);
 assert.throws(()=>parseReconstructionJourneyArgs([]),/Required/);
 assert.throws(()=>parseReconstructionJourneyArgs(
   ['--url','https://github.com',...args.slice(2)]),/local development HTTP/);
 assert.throws(()=>parseReconstructionJourneyArgs([...args,'--upload']),/Unknown/);
 assert.throws(()=>parseReconstructionJourneyArgs([...args,'--browser']),/Unknown/);
});
