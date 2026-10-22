import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareGeometryBackupEntry,serializeGeometryAsset,parseGeometryAsset,
  serializeGeometryLibrary,parseGeometryLibraryBackup,MAX_BACKUP_ASSETS
} from '../src/geometry-library-backup.js';

const path={type:'open-path',space:'wallpaper-600x1300',
  points:[[.1,.2],[.5,.45],[.9,.81]],anchors:[1],corners:[1]};
const donut={type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
  fillRule:'evenodd',components:[{outer:[[0,0],[100,0],[100,100],[0,100]],
    holes:[[[35,35],[35,65],[65,65],[65,35]]]}]};
const prep=async(id,geometry)=>prepareGeometryBackupEntry({
  id,kind:geometry.type==='open-path'?'path':'shape',name:id,geometry,
  createdAt:'2026-10-22T00:00:00Z',modifiedAt:'2026-10-22T00:00:00Z'
});

test('Single geometry exports retain full path and compound-region contours',async()=>{
  for(const [id,geometry] of [['curve',path],['donut',donut]]){
    const item=await prep(id,geometry);
    const serialized=await serializeGeometryAsset(item);
    assert.deepEqual(await parseGeometryAsset(serialized),item);
  }
});

test('Whole library exchange survives a clean-origin restore and repeat parse',async()=>{
  const a=await prep('curve',path),b=await prep('donut',donut);
  const json=await serializeGeometryLibrary([b,a],
    {createdAt:'2026-10-22T05:00:00Z'});
  assert.deepEqual((await parseGeometryLibraryBackup(json)).map(a=>a.id),['curve','donut']);
  assert.deepEqual(await parseGeometryLibraryBackup(json),[a,b]);
  const normalized=await serializeGeometryLibrary(await parseGeometryLibraryBackup(json),
    {createdAt:'2026-10-22T05:00:00Z'});
  assert.equal(normalized,json);
});

test('Tamper, duplicate, inflated and malformed archive input are rejected atomically',async()=>{
  const a=await prep('curve',path),b=await prep('donut',donut);
  const valid=JSON.parse(await serializeGeometryLibrary([a,b]));
  const tampered=structuredClone(valid);
  tampered.assets[0].geometry.points[1][0]=.6;
  const duplicate=structuredClone(valid);
  duplicate.assets[1].id=duplicate.assets[0].id;
  const extra=structuredClone(valid);
  extra.untrusted='injected';
  for(const input of [tampered,duplicate,extra,
    {...valid,version:55},
    {...valid,assets:[...valid.assets,{id:'not real'}]},
    {...valid,assets:Array.from({length:MAX_BACKUP_ASSETS+1},()=>a)}]){
    await assert.rejects(parseGeometryLibraryBackup(JSON.stringify(input)),
      /backup|geometry|asset|Duplicate|Unsupported|Malformed/i);
  }
  await assert.rejects(parseGeometryAsset(JSON.stringify(tampered.assets[0])),/integrity/);
  await assert.rejects(parseGeometryLibraryBackup('not JSON'),/JSON/);
  await assert.rejects(parseGeometryLibraryBackup(' '.repeat(16*1024*1024+1)),/limit/);
});

test('Asset source data is reduced to recognized metadata and cannot contain executable SVG',async()=>{
  const original=await prepareGeometryBackupEntry({
    id:'safe-source',geometry:donut,source:{kind:'imported',
      rawSVG:'<svg onload="fetch(/secret)">',remoteUrl:'https://example.com'}
  });
  const json=await serializeGeometryAsset(original);
  assert.equal(json.includes('rawSVG'),false);
  assert.equal(json.includes('remoteUrl'),false);
  assert.equal((await parseGeometryAsset(json)).source.kind,'imported');
});
