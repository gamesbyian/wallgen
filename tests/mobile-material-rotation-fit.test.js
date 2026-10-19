import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('compact phone rotation shortcut minimum fits the real 26px row',()=>{
 const css=read('editor-redesign.css');
 const pattern=/@media\(max-width:499px\)\{\s*body\.mobile-studio[\s\S]*?\.texture-rotation-field\s+\.rotation-controls button\s*\{\s*min-height:26px!important;\s*max-height:26px!important;/;
 assert.match(css,pattern);
 const inspect=read('scripts/ui-atlas-inspect.mjs');
 assert.match(inspect,/if\(meta.kind==='tool'&&\/\^finish\[123\]\$\/.test\(meta.tool\)\)/);
 assert.doesNotMatch(inspect,/if\(!mobile&&meta.kind==='tool'&&\/\^finish/);
});
