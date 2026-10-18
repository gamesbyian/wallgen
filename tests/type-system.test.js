import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('type-system.css');
test('approved Fredoka and Rubik weights load in the existing app',()=>{
 assert.match(html,/Fredoka:wght@500;600;700&amp;family=Rubik:wght@300;500/);
 assert.match(html,/type-system\.css\?v=/);
 assert.match(css,/--font-ui:'Rubik'/);
 assert.match(css,/--font-display:'Fredoka'/);
});
test('Fredoka renders uppercase and Rubik retains functional control labels',()=>{
 assert.match(css,/h1,h2,h3,\.brand-title,[^{}]+\{[^{}]*text-transform:uppercase/s);
 assert.doesNotMatch(css,/\.settings-tab[^{}]*text-transform:uppercase/);
 assert.doesNotMatch(css,/\.editor-tool-tab[^{}]*text-transform:uppercase/);
});
