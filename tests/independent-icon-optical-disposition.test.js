import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('assets/icons/roygbiv/manifest.json',root)));
const proof=JSON.parse(readFileSync(new URL('docs/ui-reference/actual-implementation/review-provenance.json',root)));
test('all eight independently reviewed icons remain uninstalled and not misattributed to a person',()=>{
 const candidates=manifest.icons.filter(i=>i.status==='candidate; not wired into UI');
 assert.equal(manifest.icons.length,68);
 assert.equal(candidates.length,8);
 for(const item of candidates){
  const r=item.independentOpticalReview;
  assert.ok(r,item.name+' no independent source visual decision');
  assert.equal(r.status,'conditional-pass-for-labelled-use');
  assert.match(r.reviewer,/AI independent/i);
  assert.equal(r.actualUserApproval,false);
  assert.equal(r.liveWiringAuthorized,false);
  assert.ok(r.minimumRecommendedSizePx>=20);
  assert.ok(r.requiredVisibleActionLabel.length>3);
  assert.ok(r.opticalDecision.length>35);
  assert.deepEqual(r.sizesSeen,[20,24,28]);
  assert.deepEqual(r.themesSeen,['cream','dark']);
  assert.deepEqual(r.statesSeen,['normal','selected','disabled','focus']);
  const screenshot='docs/ui-reference/actual-implementation/icons/'+item.name+'-states.png';
  assert.equal(r.exactPixelSheet,screenshot);
  const data=readFileSync(new URL(screenshot,root));
  assert.equal(createHash('sha256').update(data).digest('hex'),
    proof.sha256['icons/'+item.name+'-states.png'],'Source optical review bytes changed');
 }
 assert.equal(candidates.filter(x=>x.independentOpticalReview.minimumRecommendedSizePx>=24).length,5);
});
test('source registry integration is unchanged for all noncandidate live icons',()=>{
 const current=manifest.icons.filter(i=>i.independentOpticalReview);
 assert.equal(current.length,8);
 for(const item of manifest.icons.filter(i=>i.status!=='candidate; not wired into UI'))
  assert.equal(item.independentOpticalReview,undefined);
 const path=new URL('docs/ui-reference/INDEPENDENT-ICON-OPTICAL-DISPOSITION-2026-10-20.md',root);
 assert.ok(existsSync(path));
 const doc=readFileSync(path,'utf8');
 assert.match(doc,/not a claim that the human user/i);
 assert.match(doc,/24px\+/i);
});
