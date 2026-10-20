#!/usr/bin/env node
/**
 * Verify that all 24 CI implementation-plate PNGs are real, complete and
 * attributable to the exact source checkout, not to a guessed PR branch tip.
 * This is evidence integrity only. It cannot approve visual design fidelity.
 */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';

const output=resolve(process.argv.find(x=>x.startsWith('--out='))?.slice(6)||
  'artifacts/visual-agent1');
const manifest=JSON.parse(readFileSync(join(output,'manifest.json'),'utf8'));
const provenance=manifest.sourceProvenance;
assert.ok(provenance,'Missing tested-source provenance');
const isSha=value=>typeof value==='string'&&/^[0-9a-f]{40}$/i.test(value);
if(process.env.GITHUB_SHA){
  assert.ok(isSha(process.env.GITHUB_SHA),'GitHub checked-out source SHA invalid');
  assert.equal(provenance.checkedOutCommit,process.env.GITHUB_SHA,
    'Screenshot checkout SHA disagrees with tested Actions checkout');
}
if(process.env.GITHUB_EVENT_NAME==='pull_request'){
  assert.ok(isSha(process.env.SOURCE_PR_HEAD_SHA),'PR head SHA unavailable');
  assert.ok(isSha(process.env.SOURCE_PR_BASE_SHA),'PR base SHA unavailable');
  assert.equal(provenance.pullRequestHeadCommit,process.env.SOURCE_PR_HEAD_SHA);
  assert.equal(provenance.pullRequestBaseCommit,process.env.SOURCE_PR_BASE_SHA);
  assert.match(provenance.runUrl||'',/^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+$/);
}
assert.deepEqual(manifest.errors,[],'Failing Chromium evidence must not be promoted');
const canonical=['studio','geometry','draw','explore','more','material',
  'colour','diagonal','compact','focus','history','search'];
const plates=manifest.implementationPlates;
assert.equal(plates.length,canonical.length*2,'Incomplete 24-panel live implementation atlas');
const expected=new Set(['cream','dark'].flatMap(theme=>canonical.map(screen=>theme+'/'+screen)));
const pngSignature=Buffer.from('89504e470d0a1a0a','hex');
for(const plate of plates){
  const key=plate.theme+'/'+plate.screen;
  assert.ok(expected.delete(key),'Unexpected or repeated implementation plate '+key);
  assert.equal(plate.sourceCommit,provenance.checkedOutCommit||
    'local checkout (see script invocation)');
  assert.equal(plate.headCommit,provenance.pullRequestHeadCommit);
  assert.equal(plate.baseCommit,provenance.pullRequestBaseCommit);
  assert.equal(plate.runUrl,provenance.runUrl);
  assert.ok(plate.image.startsWith('implemented-plates/'),'Plate escaped canonical artifact directory');
  assert.ok(plate.source.startsWith('screens/phone-412x892/'),
    'Plate not captured from 412×892 original Chromium screen');
  const imageFile=join(output,plate.image),sourceFile=join(output,plate.source);
  assert.ok(existsSync(imageFile),'Missing actual implementation PNG '+plate.image);
  assert.ok(existsSync(sourceFile),'Missing original source-screen PNG '+plate.source);
  const bytes=readFileSync(imageFile),source=readFileSync(sourceFile);
  assert.ok(bytes.subarray(0,8).equals(pngSignature),'Not a real PNG: '+plate.image);
  assert.equal(bytes.readUInt32BE(16),412,'Unexpected viewport pixel width');
  assert.equal(bytes.readUInt32BE(20),892,'Unexpected viewport pixel height');
  assert.ok(bytes.equals(source),'Staged plate no longer byte-exact to tested browser source');
  assert.equal(plate.review,'evidence only; human optical approval outstanding');
}
assert.equal(expected.size,0,'Missing canonical state(s): '+[...expected].join(', '));
console.log('SOURCE EVIDENCE VERIFIED: 24/24 byte-exact real 412x892 PNG plates; '+
  'checkout '+(provenance.checkedOutCommit||'local')+
  '; PR head '+(provenance.pullRequestHeadCommit||'n/a')+
  '; run '+(provenance.runUrl||'local')+
  '. Human optical approval remains outstanding.');
