import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');
const license=readFileSync(new URL('../LICENSE',import.meta.url),'utf8');

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

test('Light & Shadow is part of Colour, uses existing locks, and is explained clearly',()=>{
  const colourStart=html.indexOf('id="panel-colour"');
  const textureStart=html.indexOf('id="panel-textures"');
  assert.ok(colourStart>=0 && textureStart>colourStart);
  const colour=html.slice(colourStart,textureStart);
  for(const key of ['lightingMood','lightDirection','lightStrength','shadowStrength']){
    assert.match(colour,new RegExp('name="'+key+'"'));
    assert.match(app,new RegExp("'"+key+"'"));
  }
  assert.match(colour,/Light &amp; shadow/);
  assert.match(css,/\.lighting-subsection/);
  assert.match(readme,/Ambient light & shade \(Colour tab\)/);
});

test('public domain licence and documentation acknowledge ChatGPT and unrestricted use',()=>{
  assert.match(license,/made by its project creator with ChatGPT/i);
  assert.match(license,/claims no ownership/i);
  assert.match(license,/with or without attribution/i);
  assert.match(license,/The Unlicense/i);
  assert.match(license,/THE SOFTWARE IS PROVIDED "AS IS"/);
  assert.match(readme,/made by its project creator with \*\*ChatGPT\*\*/i);
  assert.match(readme,/\*\*claims no ownership/i);
  assert.match(readme,/\*\*for any purpose\*\*/i);
});

test('lock controls use two consistent line-art SVG states, not emoji',()=>{
  assert.match(app,/const LOCK_ICON=\{/);
  assert.match(app,/locked:'<svg viewBox="0 0 24 24"/);
  assert.match(app,/unlocked:'<svg viewBox="0 0 24 24"/);
  assert.match(app,/button\.innerHTML=locked\.has\(key\)\?LOCK_ICON\.locked:LOCK_ICON\.unlocked/);
  assert.doesNotMatch(app,/button\.textContent=locked\.has\(key\)\?'🔒'/);
  assert.match(css,/\.setting-lock svg\{display:block/);
  assert.match(html,/Use the lock beside each setting/);
});
test('texture relief and ambient canvas illumination are described accurately',()=>{
  assert.match(html,/Gently roughen|Distort the actual stripe contours/);
  assert.match(html,/Canvas shade/);
  assert.match(html,/No stripe drop shadows/);
  assert.match(readme,/No shadows are cast by stripe silhouettes/);
});
