import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { extractPngRecipe } from '../src/png-metadata.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const serverPath=join(root,'scripts/roygbiv-mcp.mjs');
const useRealRender=process.env.ROYGBIV_AGENT_RENDER_SMOKE==='1';
const doNativeExport=process.env.ROYGBIV_AGENT_NATIVE_SMOKE==='1';

test('real stdio MCP discovery, composition, locks, variation and image transport', {
  timeout: doNativeExport?240000:useRealRender?150000:30000
}, async () => {
  const child=spawn(process.execPath,[serverPath],{
    cwd:root, stdio:['pipe','pipe','pipe'], windowsHide:true,
    env:{...process.env}
  });
  let stderr='',serial=0;
  const pending=new Map();
  child.stderr.on('data',chunk=>{stderr+=String(chunk).slice(0,10000);});
  const lines=createInterface({input:child.stdout});
  lines.on('line',line=>{
    let message;
    try{message=JSON.parse(line);}catch{return;}
    if (!Object.hasOwn(message,'id'))return;
    const reply=pending.get(message.id);
    if (!reply)return;
    pending.delete(message.id);
    message.error?reply.reject(new Error(JSON.stringify(message.error))):reply.resolve(message.result);
  });
  const exited=new Promise(resolve=>child.once('exit',resolve));
  child.on('exit',()=>{
    for(const waiter of pending.values())
      waiter.reject(new Error('MCP server stopped before responding: '+stderr));
    pending.clear();
  });
  function request(method,params={}) {
    const id=++serial;
    const promise=new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
    return promise;
  }
  const call=(name,args={})=>request('tools/call',{name,arguments:args});
  const data=result=>{
    assert.notEqual(result.isError,true);
    return JSON.parse(result.content.find(item=>item.type==='text').text);
  };
  try {
    const hello=await request('initialize',{
      protocolVersion:'2026-07-28',capabilities:{},
      clientInfo:{name:'roygbiv-stdio-smoke',version:'1.0.0'}
    });
    assert.ok(hello.serverInfo.name.includes('roygbiv'));
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',
      method:'notifications/initialized',params:{}})+'\n');
    const advertised=await request('tools/list');
    for(const name of ['roygbiv_describe','roygbiv_compose','roygbiv_edit',
      'roygbiv_vary','roygbiv_explore','roygbiv_inspect','roygbiv_import',
      'roygbiv_preview','roygbiv_export'])
      assert.ok(advertised.tools.some(tool=>tool.name===name),name);
    const capability=data(await call('roygbiv_describe'));
    assert.ok(capability.categories.some(item=>item.id==='path'));
    const first=data(await call('roygbiv_compose',{
      style:'currents',seed:'stdio-agent',
      settings:{geometry:'wave',palette:'jewel',material:'linen'},
      locks:['palette']
    }));
    assert.equal(first.recipe.palette,'jewel');
    const variants=data(await call('roygbiv_explore',{
      id:first.id,count:3,seed:'stdio-batch',
      categories:['path','stripes','colour'],strength:'wild'
    }));
    assert.equal(variants.candidates.length,3);
    const v=variants.candidates[0];
    const inspect=data(await call('roygbiv_inspect',{id:v.id}));
    assert.deepEqual(inspect.recipe.lockedSettings,['palette']);
    assert.equal(inspect.recipe.palette,'jewel');
    const rejected=await call('roygbiv_edit',{
      id:v.id,settings:{palette:'pastel'}
    });
    assert.equal(rejected.isError,true);
    assert.match(rejected.content[0].text,/locked/);
    const edited=data(await call('roygbiv_edit',{
      id:v.id,settings:{palette:'pastel'},unlock:['palette']
    }));
    assert.equal(edited.recipe.palette,'pastel');

    if(useRealRender) {
      const preview=await call('roygbiv_preview',{id:edited.id,width:240});
      assert.ok(!preview.isError,preview.content?.[0]?.text);
      const img=preview.content.find(item=>item.type==='image');
      assert.equal(img.mimeType,'image/png');
      const bytes=Buffer.from(img.data,'base64');
      assert.equal(bytes.subarray(1,4).toString(),'PNG');
      assert.equal(bytes.readUInt32BE(16),240);
      assert.equal(bytes.readUInt32BE(20),520);
      assert.deepEqual(extractPngRecipe(bytes),edited.recipe);
      const second=await call('roygbiv_preview',{id:edited.id,width:240});
      assert.ok(!second.isError);
      assert.deepEqual(second.content.find(x=>x.type==='image').data,img.data);
      assert.equal(JSON.parse(second.content.find(x=>x.type==='text').text).cached,true);
    }
    if(doNativeExport) {
      const result=data(await call('roygbiv_export',{id:edited.id}));
      assert.equal(result.width,3024);
      assert.equal(result.height,6552);
      assert.deepEqual(extractPngRecipe(await readFile(result.imagePath)),edited.recipe);
      assert.deepEqual(JSON.parse(await readFile(result.recipePath,'utf8')),edited.recipe);
    }
  } finally {
    child.kill();
    await exited;
    lines.close();
  }
});
