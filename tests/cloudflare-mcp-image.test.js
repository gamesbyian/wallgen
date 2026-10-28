import test from 'node:test';
import assert from 'node:assert/strict';
import { pngImageResult } from '../cloudflare/mcp/src/mcp-image.js';

const png=Uint8Array.from([137,80,78,71,13,10,26,10,
  ...Array.from({length:72},(_,i)=>i%256)]);
test('hosted image result actually contains MCP image/png and separate metadata',()=>{
  const detail={id:'design-1234567890abcdef',width:360,height:780,previewOnly:true};
  const result=pngImageResult(png,detail);
  assert.equal(result.content.length,2);
  assert.deepEqual(result.content.map(part=>part.type),['image','text']);
  assert.equal(result.content[0].mimeType,'image/png');
  assert.deepEqual(Buffer.from(result.content[0].data,'base64'),Buffer.from(png));
  assert.deepEqual(JSON.parse(result.content[1].text),detail);
});
test('invalid signatures, oversized and empty image payloads refuse',()=>{
  assert.throws(()=>pngImageResult(new Uint8Array(80),{}),/bounded PNG/);
  assert.throws(()=>pngImageResult(new Uint8Array(),{}),/bounded PNG/);
  assert.throws(()=>pngImageResult(new Uint8Array(3*1024*1024+1),{}),/bounded PNG/);
});
