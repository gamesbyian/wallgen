import test from 'node:test';
import assert from 'node:assert/strict';
import {acquirePreviewLease,releasePreviewLease,LEASE_MS} from '../cloudflare/mcp/src/preview-lease.js';

function dbMock(){
  let current=null;
  const sqls=[];
  return {sqls,env:{RECIPES:{prepare(sql){
    sqls.push(sql);let values;
    return {bind(...v){values=v;return this},async first(){
      const [key,token,now,cutoff]=values;
      if(!current || current.acquiredAt<cutoff){
        current={key,token,acquiredAt:now};return {token};
      }
      return null;
    },async run(){
      const [key,token]=values;
      if(current?.key===key&&current.token===token){current=null;return {meta:{changes:1}};}
      return {meta:{changes:0}};
    }};
  }}}}};
}
test('database-wide single browser lease rejects overlapping owner requests without charges',async()=>{
  const {env,sqls}=dbMock();
  const a=await acquirePreviewLease(env,{now:1000000});
  assert.equal(a.expiresAt,1000000+LEASE_MS);
  await assert.rejects(()=>acquirePreviewLease(env,{now:1000001}),/already rendering/);
  assert.match(sqls[0],/ON CONFLICT\(lease_key\) DO UPDATE/);
  assert.match(sqls[0],/RETURNING token/);
  assert.equal((await releasePreviewLease(env,a)).meta.changes,1);
  const b=await acquirePreviewLease(env,{now:1000002});
  assert.notEqual(a.token,b.token);
  await releasePreviewLease(env,b);
});
test('expired leases can be stolen, but stale holders cannot delete successor',async()=>{
  const {env}=dbMock();
  const old=await acquirePreviewLease(env,{now:1000000});
  const next=await acquirePreviewLease(env,{now:1000000+LEASE_MS+1});
  assert.equal((await releasePreviewLease(env,old)).meta.changes,0);
  await assert.rejects(()=>acquirePreviewLease(env,{now:1000000+LEASE_MS+2}),/already rendering/);
  assert.equal((await releasePreviewLease(env,next)).meta.changes,1);
});
test('invalid lease input refuses; no token leakage',async()=>{
  const {env}=dbMock();
  await assert.rejects(()=>acquirePreviewLease(env,{now:NaN}),/Invalid/);
  await assert.rejects(()=>releasePreviewLease(env,{}),/Invalid/);
});
