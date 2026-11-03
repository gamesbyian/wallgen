#!/usr/bin/env node
/**
 * One-time paired receipts for genuine Random-button source A/B.
 * No artificial response simulation or speed threshold: report both actual
 * first-provisional and final-presented times, alongside completed Worker
 * paint and discarded burst occupancy. A single run per source is indicative,
 * not strong evidence of a population latency shift on physical hardware.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const [basePath,candidatePath]=process.argv.slice(2);
assert(basePath&&candidatePath,'Provide baseline and current receipts');
const [base,newer]=await Promise.all([basePath,candidatePath].map(async f=>
  JSON.parse(await readFile(f,'utf8'))));
assert.deepEqual(base.profiles,newer.profiles,
  'Source recipes differ: the A/B comparison is invalid');
assert.equal(base.results.length,newer.results.length);
const take=r=>({
  firstVisibleMs:r.firstInteractiveFromFirstMs,
  finalFromFirstMs:r.finalFromFirstClickMs,
  finalAfterLastMs:r.finalAfterLastClickMs,
  workerPaintMs:r.settledWorkerPaintMs,
  obsoleteWorkerWaitMs:r.obsoleteWorkerWaitAfterLastClickMs,
  actualClickGapsMs:r.actualClickGaps
});
const pairs=base.results.map((older,i)=>{
  const now=newer.results[i];
  assert.equal(older.case,now.case);
  assert.equal(older.viewport,now.viewport);
  assert.equal(older.sourceSeed,now.sourceSeed);
  assert.equal(older.single.expectedSeed,now.single.expectedSeed);
  assert.equal(older.burst.expectedSeed,now.burst.expectedSeed);
  const metrics={};
  for(const kind of ['single','burst']){
    const before=take(older[kind]),after=take(now[kind]);
    const differences={};
    for(const [key,value] of Object.entries(before)){
      const next=after[key];
      if(typeof value==='number'&&typeof next==='number')
        differences[key]=next-value;
    }
    metrics[kind]={before,after,differences};
  }
  return {case:older.case,viewport:older.viewport,seed:older.sourceSeed,metrics};
});
await mkdir(join('artifacts','sand-random-cross-source'),{recursive:true});
const evidence={
  comparison:'Real app source at immutable pre-#1029 vs latest PR, same pinned Random seeds, Chromium mobile emulation, not physical Pixel',
  baselineSource:base.sourceLabel,candidateSource:newer.sourceLabel,
  profiles:base.profiles,pairs,
  caveat:'One unpaired OS-runner sample per variant per viewport/case; per-source launch and warmed state differ. Negative time delta is faster but not necessarily statistically repeatable. Both user-click-to-first-visible and last-click-to-final matter.'
};
await writeFile(join('artifacts','sand-random-cross-source','comparison.json'),
  JSON.stringify(evidence,null,2)+'\n');
console.log('ROYGBIV_REAL_RANDOM_CROSS_SOURCE_AB',JSON.stringify({
  sources:[base.sourceLabel,newer.sourceLabel],
  pairs:pairs.map(p=>({case:p.case,viewport:p.viewport,
    single:p.metrics.single.differences,
    burst:p.metrics.burst.differences}))
}));
