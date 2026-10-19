import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeAtlasReport} from '../scripts/ui-atlas-report.mjs';
test('offline atlas report includes traceable deduplicated clipped-action diagnostics',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'atlas-report-test-'));
 try{
  await writeAtlasReport(dir,{cases:[{
   id:'pixel-6-pro/100/tool-path-geometry',
   file:'pixel-6-pro/100/geometry.png',profile:'pixel-6-pro',
   zoomPercent:100,kind:'tool',
   inspection:{scanned:11,ignoredScroll:3,totalFindings:1,findings:[{
    element:'#drawApply',label:'Use path',type:'clipped-action',
    missingPixels:21,visibleFraction:.56
   }]}
  }],errors:[],inapplicable:[],missingExpected:[]});
  const report=readFileSync(join(dir,'index.html'),'utf8');
  for(const required of ['diagnosticSummary','diagnosticGroups','ignoredScroll',
     'Source control','Visible label','Worst clip','example']){
    assert.ok(report.includes(required),'Missing diagnostic UI token '+required);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
