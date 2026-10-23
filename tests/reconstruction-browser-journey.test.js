import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReconstructionJourneyArgs} from '../scripts/check-reconstruction-journey.mjs';
import {describeReconstructionChoice} from '../src/image-path-ui.js';

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


test('portrait recipe status stays compact while its accessible detail preserves all uncertainty and locks',()=>{
  const candidate={kind:'wave',label:'Editable flowing wave · fitted',error:.040538,
    uncertainty:'Phase, source seed and image-specific ribbon edge geometry are not recovered.',
    lockedChanges:['spread','stripeWidth']};
  const info=describeReconstructionChoice(candidate);
  assert.ok(info.summary.length<70,'visible text must fit two short portrait lines');
  assert.match(info.summary,/0\.041/);
  assert.match(info.summary,/lower is better/);
  assert.doesNotMatch(info.summary,/Phase/);
  assert.match(info.explanation,/Phase, source seed/);
  assert.match(info.explanation,/spread, stripeWidth/);
  assert.match(info.explanation,/not the source image.s original recipe/);
  assert.match(describeReconstructionChoice(null).summary,/No reliable/);
});
