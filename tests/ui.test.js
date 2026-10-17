import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');

test('settings use four accessible mutually exclusive tab panels',()=>{
  const names=['design','colour','textures','refine'];
  assert.match(html,/class="settings-tabs" role="tablist"/);
  assert.equal((html.match(/role="tab"/g)||[]).length,4);
  assert.equal((html.match(/role="tabpanel"/g)||[]).length,4);
  for(const name of names){
    assert.match(html,new RegExp('id="tab-'+name+'"[^>]*aria-controls="panel-'+name+'"'));
    assert.match(html,new RegExp('id="panel-'+name+'"[^>]*role="tabpanel"'));
    assert.match(html,new RegExp('id="panel-'+name+'"[^>]*aria-labelledby="tab-'+name+'"'));
  }
  assert.equal((html.match(/role="tabpanel"[^>]*hidden/g)||[]).length,3);
  assert.match(css,/\.settings-panel\[hidden\]\s*\{display:none!important\}/);
  assert.match(app,/ArrowRight/);
  assert.match(app,/ArrowLeft/);
  assert.match(app,/sessionStorage\.setItem\('wallgen:settings-tab:v1'/);
});

test('Explore Variations belongs to the preview workspace, not the full-width layout',()=>{
  const open=html.indexOf('<main class="workspace">');
  const gallery=html.indexOf('<section class="gallery-section"');
  const close=html.indexOf('</main>');
  assert.ok(open>=0&&gallery>open&&close>gallery,'gallery must be within main');
  assert.ok(css.includes('.workspace>.gallery-section'));
  assert.ok(css.includes('.workspace>.gallery-section .gallery-grid'));
});

test('compact primes-only randomizer sits above the design tab and stays lockable',()=>{
  const button=html.indexOf('id="randomizeAll"');
  const primes=html.indexOf('name="primesOnly"');
  const nav=html.indexOf('class="settings-tabs"');
  const design=html.indexOf('id="panel-design"');
  assert.ok(button>0&&primes>button&&nav>primes&&design>nav);
  assert.equal((html.match(/id="randomizeAll"/g)||[]).length,1);
  assert.match(html,/id="primeModeHint"/);
  assert.match(app,/randomizeAllRecipe\(\{primesOnly:current\.primesOnly\}\)/);
  assert.match(app,/const FIELDS = \['primesOnly'/);
  assert.match(css,/\.randomize-bar\.randomize-toolbar/);
});
