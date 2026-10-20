import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const live=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('the 399px to 400px control/media transition and short 412px portrait are real browser screens',()=>{
  for(const [id,width] of [['edge-399x740',399],['edge-400x740',400],['short-phone-412x740',412]]){
    assert.match(live,new RegExp("id:'"+id+"',width:"+width+",height:740"));
    const profile=live.split('\n').find(line=>line.includes("id:'"+id+"'"));
    assert.ok(profile?.includes("'saved-populated'"),id+' must test real saved artwork');
    assert.ok(profile?.includes("'material'"),id+' must test real source rotation controls');
  }
  assert.match(live,/short-phone-412x740'.*'explore-populated'/);
});
test('both sides of phone rotation breakpoint must have six unblocked 24px minimum targets',()=>{
  assert.match(live,/profile\.width<=412&&name==='material'/);
  assert.match(live,/cells\.length!==6\|\|cells\.some/);
  assert.match(live,/!cell\.centerTarget\|\|cell\.width<24\|\|cell\.height<24/);
  assert.match(live,/cell\.right>frame\.right\+1/);
});
