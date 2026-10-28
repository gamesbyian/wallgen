import test from 'node:test';
import assert from 'node:assert/strict';
import {reservePreviewLaunch, LAUNCH_GAP_MS} from '../cloudflare/mcp/src/preview-lease.js';

function fakeEnv() {
  let last;
  const sql=[];
  return {sql,RECIPES:{prepare(statement) {
    sql.push(statement);
    let args;
    return {bind(...values){args=values;return this;},async first() {
      const [,now,limit]=args;
      if(last!==undefined && last>limit)return null;
      last=now;
      return {last_launch_at:now};
    }};
  }}};
}
test('Cloudflare free plan launch pacing is atomic and cross-user',async()=>{
  const env=fakeEnv(),t=Date.parse('2026-10-28T08:00:00Z');
  assert.equal(LAUNCH_GAP_MS,21000);
  assert.equal(await reservePreviewLaunch(env,{now:t}),t);
  await assert.rejects(()=>reservePreviewLaunch(env,{now:t+20000}),/21 seconds/);
  assert.equal(await reservePreviewLaunch(env,{now:t+21000}),t+21000);
  assert.ok(env.sql.every(sql=>sql.includes('ON CONFLICT')&&sql.includes('RETURNING')));
});
test('invalid launch clock rejected before D1',async()=>{
 const env=fakeEnv();
 await assert.rejects(()=>reservePreviewLaunch(env,{now:Infinity}),/Invalid/);
 assert.equal(env.sql.length,0);
});
