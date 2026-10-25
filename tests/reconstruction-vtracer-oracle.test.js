import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
  readVectorBenchmarkArgs,runVectorBenchmark
} from '../scripts/benchmark-reconstruction-vtracer.mjs';

test('CLI is explicitly configured and rejects undocumented flags',()=>{
  assert.deepEqual(readVectorBenchmarkArgs([
    '--dir','/tmp/source','--out-dir','/tmp/output','--only','05-hairpin'
  ]),{dir:'/tmp/source',outDir:'/tmp/output',
    vtracer:'vtracer',only:'05-hairpin'});
  assert.throws(()=>readVectorBenchmarkArgs(['--sneaky','1']),/Unknown/);
});

test('VTracer runner stays opt-in, source-immutable and truth-blind',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'wallgen-vtracer-'));
  try{
    const base=join(temp,'r0'),out=join(temp,'oracle');
    await mkdir(base);
    const source=Buffer.from('89504e470d0a1a0a1122334455667788','hex');
    await writeFile(join(base,'05-hairpin.no-metadata.png'),source);
    await writeFile(join(base,'manifest.json'),JSON.stringify({
      schema:'roygbiv-reconstruction-r0/v1',
      items:[{id:'05-hairpin',metadataFree:'05-hairpin.no-metadata.png',
        recipeFile:'05-hairpin.recipe.json'}]
    }));
    // Deliberately NO truth sidecar exists; tracing must never read it.
    const commands=[];let closed=0;
    const stub=async(bin,args)=>{
      commands.push({bin,args});
      if(args[0]==='--version')return {stdout:'vtracer 1.0.0-alpha.4'};
      await writeFile(args[1],'<svg xmlns="http://www.w3.org/2000/svg">'+
        '<path d="M 1 1 L 3 3 Z"/></svg>');
      return {stdout:''};
    };
    const raster=async()=>({score:async()=>({
      rgbInkError:.054, optical:Buffer.from('mock-png').toString('base64')
    }),close:async()=>{closed++;}});
    const result=await runVectorBenchmark({
      dir:base,outDir:out,only:'05-hairpin',vtracer:'fake-vtracer'
    },{run:stub,rasterize:raster});
    assert.equal(result.status,'measured-pixels-not-human-reviewed');
    assert.equal(result.results[0].pathCount,1);
    assert.equal(result.results[0].rgbInkError,.054);
    assert.equal(result.results[0].sourceSha256.length,64);
    assert.equal(closed,1);
    assert.deepEqual(await readFile(join(base,'05-hairpin.no-metadata.png')),source);
    assert.equal(commands.length,2);
    assert.deepEqual(commands[1].args.slice(2),
      ['--hierarchical','cutout','--mode','spline','--simplify','1']);
    const gallery=await readFile(join(out,'index.html'),'utf8');
    assert.match(gallery,/\.\.\/r0\/05-hairpin\.no-metadata\.png/);
    await assert.rejects(()=>access(join(base,'05-hairpin.recipe.json')));
    await assert.rejects(()=>runVectorBenchmark({
      dir:base,outDir:out,vtracer:'fake-vtracer'
    },{run:stub,rasterize:raster}),/Existing VTracer report/);
  }finally{await rm(temp,{recursive:true,force:true});}
});

test('VTracer binary version is pinned before spawning conversions',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'wallgen-vtracer-version-'));
  try{
    const base=join(temp,'r0');
    await mkdir(base);
    await writeFile(join(base,'manifest.json'),JSON.stringify({
      schema:'roygbiv-reconstruction-external/v1',
      items:[{id:'sample',metadataFree:'sample.png'}]
    }));
    await assert.rejects(()=>runVectorBenchmark({
      dir:base,outDir:join(temp,'oracle'),vtracer:'fake'
    },{run:async()=>({stdout:'vtracer 0.6.5'})}),/Expected pinned VTracer/);
  }finally{await rm(temp,{recursive:true,force:true});}
});
