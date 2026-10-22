import test from 'node:test';
import assert from 'node:assert/strict';
import {audit,inspectSetting,findGoals,sceneTools,relationshipAudit,
  DOMAINS,GOALS,GATES,FINDINGS,WORKFLOWS,report} from '../scripts/ia-semantic-audit.mjs';
import {sourceHomes,candidateHomes} from '../scripts/ia-structure-evaluate.mjs';

// Pure data and routing checks only. Not a usability study or an app-wide CI suite.
test('live schema has exactly one domain and candidate home per source setting',()=>{
  const a=audit();
  assert.deepEqual(a.errors,[]);
  assert.equal(a.inventory.sourceKeys,sourceHomes().length);
  assert.equal(a.inventory.domainKeys,a.inventory.sourceKeys);
  assert.equal(a.inventory.candidateKeys,candidateHomes().length);
  assert.equal(a.inventory.categories,7);
  assert.equal(a.inventory.tools,43);
  assert.equal(a.inventory.sourceKeys,95);
});
test('goals, prerequisites and evidence do not point at nonexistent keys',()=>{
  const all=new Set(sourceHomes().map(x=>x.key));
  for(const goal of GOALS)for(const key of goal.keys)assert.ok(all.has(key),goal.id+': '+key);
  for(const gate of GATES)for(const key of gate.keys)assert.ok(all.has(key),gate.needs+': '+key);
  for(const finding of FINDINGS){
    assert.match(finding.id,/^C\d\d$/);
    assert.ok(['P1','P2','P3'].includes(finding.priority));
    assert.ok(['observed-code','design-hypothesis'].includes(finding.type));
    assert.ok(finding.evidence);
    assert.ok(finding.verify);
    for(const key of finding.keys)assert.ok(all.has(key),finding.id+': '+key);
  }
  assert.equal(new Set(DOMAINS.map(x=>x.id)).size,DOMAINS.length);
  assert.equal(new Set(WORKFLOWS.map(x=>x.id)).size,WORKFLOWS.length);
});
test('semantic inspection separates navigation, visual impact and prerequisites',()=>{
  const detail=inspectSetting('scatteredSpacing');
  assert.equal(detail.domain,'objects');
  assert.ok(detail.related.some(x=>x.key==='scatteredOverlap'));
  assert.ok(detail.gates.some(x=>x.needs.includes('overlap=separate')&&x.reviewMismatch));
  assert.deepEqual(detail.current,['Path','Distribution']);
  assert.equal(inspectSetting('fakeKey'),null);
});
test('intent search includes newly implemented features and explicitly missing workflows',()=>{
  assert.equal(findGoals('make circles have more room')[0].id,'circle-packing');
  assert.equal(findGoals('make the stripes more wavy')[0].id,'wild-lines');
  assert.equal(findGoals('colour blindness preview')[0].id,'inspect-vision');
  assert.equal(findGoals('')[0],undefined);
  assert.ok(WORKFLOWS.some(w=>w.id==='direct-object-edit'&&w.status==='missing'));
  assert.ok(WORKFLOWS.some(w=>w.id==='vision'&&w.status==='available'));
});
test('mode explorer follows canonical tool applicability',()=>{
  const regions=sceneTools('regions','scattered');
  const tools=regions.flatMap(c=>c.tools.map(t=>t.id));
  assert.ok(tools.includes('scattered-size'));
  assert.ok(tools.includes('scattered-edges'));
  assert.ok(!tools.includes('region-detail'));
  assert.ok(!tools.includes('geometry'));
  const pathTools=sceneTools('paths').flatMap(c=>c.tools.map(t=>t.id));
  assert.ok(pathTools.includes('geometry'));
  assert.ok(!pathTools.includes('scattered-size'));
});
test('relationship output includes cross-category creative journeys',()=>{
  const relations=relationshipAudit();
  assert.ok(relations.find(x=>x.id==='luminous').currentCategories.length>=2);
  assert.ok(relations.find(x=>x.id==='wild-lines').currentCategories.length>=2);
  assert.match(report(),/Crossing|Creative goals|Creative goals bridging/);
});
