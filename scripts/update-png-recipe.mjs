#!/usr/bin/env node
// Archive-only operation: never invoke Canvas or a wallpaper renderer.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,parse,join} from 'node:path';
import {inspectPngMigration,migratePngMetadataOnly} from '../src/png-recipe-migration.js';
const usage=`Usage: node scripts/update-png-recipe.mjs --in old.png [--out updated.png] [--report report.json] [--dry-run]
Replaces ROYGBIV recipe metadata only; rejects unverified historical conversions.
Never changes PNG critical/IDAT chunks, non-recipe metadata, colour profiles or EXIF.
`;
const args=process.argv.slice(2),opts={};
for(let i=0;i<args.length;i++){
  if(args[i]==='--help'||args[i]==='-h'){process.stdout.write(usage);process.exit(0);}
  if(args[i]==='--dry-run'){opts.dry=true;continue;}
  if(!['--in','--out','--report'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))
    throw Error('Unknown/missing CLI argument '+args[i]+'\n'+usage);
  opts[args[i].slice(2)]=args[++i];
}
if(!opts.in)throw Error('--in is required\n'+usage);
const source=resolve(opts.in);
const filename=parse(source);
const output=resolve(opts.out||join(filename.dir,filename.name+'-recipe-updated.png'));
if(!opts.dry&&output===source)throw Error('Output must differ from original PNG');
const handle=await stat(source);
if(handle.size>150*1024*1024)throw Error('PNG exceeds 150 MB inspection limit');
const bytes=await readFile(source);
const report=inspectPngMigration(bytes);
if(opts.report)await writeFile(resolve(opts.report),JSON.stringify(report,null,2)+'\n');
if(!report.safe){process.stderr.write(JSON.stringify(report,null,2)+'\n');process.exitCode=2;}
else if(opts.dry)process.stdout.write(JSON.stringify(report,null,2)+'\n');
else {
  const {png,report:verified}=migratePngMetadataOnly(bytes);
  await writeFile(output,png,{flag:'wx'});
  process.stdout.write(JSON.stringify({file:output,bytes:png.length,...verified})+'\n');
}
