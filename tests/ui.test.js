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

test('balanced primes-only randomizer sits above the design tab without a lock',()=>{
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
  assert.match(html,/For optional shadows cast by the stripes themselves, see Design/);
  assert.match(readme,/Canvas ambience does not cast shadows from the stripe silhouettes/);
});

test('Primes only has no lock and shares the full settings width with Randomize',()=>{
  assert.match(app,/if\(key==='primesOnly'\|\|key==='textureLayer2Enabled'/);
  assert.match(css,/\.sidebar \.randomize-bar\.randomize-toolbar\{display:grid;grid-template-columns:minmax\(0,1\.08fr\) minmax\(0,1fr\)/);
  const bar=html.slice(html.indexOf('class="randomize-bar'),html.indexOf('id="primeModeHint"'));
  assert.equal((bar.match(/name="primesOnly"/g)||[]).length,1);
  assert.equal((bar.match(/class="setting-lock"/g)||[]).length,0);
});
test('all four tabs stay on a single horizontal row even in the phone layout',()=>{
  assert.match(css,/\.sidebar \.settings-tabs\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/@media\(max-width:790px\)\{[\s\S]*?\.sidebar \.settings-tabs\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
  assert.match(css,/@media\(max-width:420px\)\{[\s\S]*?\.sidebar \.settings-tab>span\{display:none\}/);
});
test('stripe shadows are an optional Design-only control, while canvas lighting stays in Colour',()=>{
  const design=html.slice(html.indexOf('id="panel-design"'),html.indexOf('id="panel-colour"'));
  const colour=html.slice(html.indexOf('id="panel-colour"'),html.indexOf('id="panel-textures"'));
  for(const field of ['stripeShadowEnabled','stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection']){
    assert.match(design,new RegExp('name="'+field+'"'));
    assert.doesNotMatch(colour,new RegExp('name="'+field+'"'));
  }
  assert.match(design,/id="stripeShadowControls" hidden/);
  assert.match(app,/function syncStripeShadowUI\(\)/);
  assert.match(app,/stripeShadowControls'\)\.hidden=!enabled/);
  assert.match(colour,/name="lightingMood"/);
});

test('R.O.Y.G.B.I.V. displays as a two-line masthead beside a larger seven-stripe logo',()=>{
  const header=html.slice(html.indexOf('<header class="masthead">'),html.indexOf('</header>'));
  assert.match(header,/aria-label="R\.O\.Y\.G\.B\.I\.V\. home"/);
  assert.match(header,/<h1 class="brand-title">R\.O\.Y\.G\.B\.I\.V<span class="brand-dot">\.<\/span><\/h1>/);
  assert.match(header,/<p class="brand-subtitle">Rainbow-Only\. You Generate Based on Individual Variables\.<\/p>/);
  assert.match(header,/<img class="brand-logo" src="assets\/roygbiv-logo.svg" width="64" height="64" alt="" aria-hidden="true">/);
  assert.match(css,/\.brand \.brand-logo\{display:block;flex:0 0 auto;width:64px;height:64px/);
  assert.match(html,/rel="icon" type="image\/svg\+xml" href="assets\/roygbiv-logo.svg"/);
  assert.match(css,/\.brand-copy\{display:flex;flex-direction:column/);
  assert.match(css,/\.brand-subtitle\{display:block/);
  assert.match(css,/@media\(max-width:520px\)\{/);
});

test('R.O.Y.G.B.I.V. branding is consistent in public-facing output',()=>{
  assert.match(html,/<title>R\.O\.Y\.G\.B\.I\.V\./);
  assert.match(html,/<footer><span>R\.O\.Y\.G\.B\.I\.V\. \/ V1\.0/);
  assert.match(html,/name="software"[^>]*value="R\.O\.Y\.G\.B\.I\.V\. · Made with ChatGPT"/);
  assert.match(app,/roygbiv-\$\{safeFilename\(current\.seed\)\}/);
  assert.match(readme,/# R\.O\.Y\.G\.B\.I\.V\./);
  assert.match(readme,/Rainbow-Only\. You Generate Based on Individual Variables\./);
  assert.match(license,/R\.O\.Y\.G\.B\.I\.V\. — PUBLIC-DOMAIN DEDICATION/);
});

test('semantic masthead guarantees two lines and strong type hierarchy even with old styles',()=>{
  const header=html.slice(html.indexOf('<header class="masthead">'),html.indexOf('</header>'));
  assert.match(header,/<div class="brand-copy">\s*<h1 class="brand-title">/);
  assert.match(header,/<\/h1>\s*<p class="brand-subtitle">/);
  assert.match(header,/<\/p>\s*<\/div>/);
  assert.match(css,/\.brand \.brand-title\{display:block;margin:0;padding:0;font-size:clamp\(22px,2\.35vw,30px\)/);
  assert.match(css,/\.brand \.brand-subtitle\{display:block;margin:0;padding:0;font-size:clamp\(9px,\.9vw,11px\)/);
  assert.match(html,/href="styles\.css\?v=20261016-geometry3"/);
  assert.match(html,/src="src\/app\.js\?v=20261016-geometry3"/);
});
test('locks occupy dedicated layout columns and never overlap numeric slider values',()=>{
  assert.match(css,/\.settings-panel \.lockable-setting:not\(\.texture-rotation-field\)\{\s*display:grid;grid-template-columns:minmax\(0,1fr\) 28px/);
  assert.match(css,/\.settings-panel \.lockable-setting > \.setting-lock\{\s*position:static!important/);
  assert.match(css,/\.settings-panel \.lockable-setting > \.setting-lock\{[\s\S]*?grid-column:2;grid-row:1/);
  assert.match(css,/\.settings-panel \.lockable-setting\.texture-rotation-field > \.rotation-controls\{\s*grid-column:1\/-1;grid-row:2/);
  assert.match(css,/\.settings-panel \.lockable-setting \.slider-number\{min-width:0\}/);
});
test('unlocked line-art padlock shackle swings away from the locked shackle',()=>{
  const locked=app.match(/locked:'(<svg[^']+?)',/);
  const unlocked=app.match(/unlocked:'(<svg[^']+?)',/);
  assert.ok(locked?.[1]&&unlocked?.[1]);
  assert.match(locked[1],/<path d="M8 10V7a4 4 0 0 1 8 0v3"\/>/);
  assert.match(unlocked[1],/<path d="M8 10V7a4 4 0 0 1 8 0v3" transform="rotate\(-48 8 10\)"\/>/);
  assert.doesNotMatch(locked[1],/transform="rotate/);
  assert.match(app,/aria-pressed/);
});

test('chevron geometry and independent shape controls are present in Design',()=>{
  const design=html.slice(html.indexOf('id="panel-design"'),html.indexOf('id="panel-colour"'));
  assert.match(design,/<option value="chevron">Chevron/);
  assert.match(design,/Stripe pattern <select name="motif"/);
  assert.doesNotMatch(design,/Stripe construction/);
  for(const field of ['shapeFrequency','shapeDepth','lineStyle']){
    assert.match(design,new RegExp('name="'+field+'"'));
    assert.match(app,new RegExp("'"+field+"'"));
  }
  assert.match(design,/<option value="dotted">Dotted line<\/option>/);
  assert.match(design,/<option value="dashed">Dashed line<\/option>/);
  assert.match(design,/separately from the stripe pattern/);
});
