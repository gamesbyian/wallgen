import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html');
const css=read('studio-themes.css');
const original=read('styles.css');
const mobile=read('src/mobile-studio.js');
const swipe=read('src/mobile-swipes.js');
const swipeCSS=read('editor-redesign.css');
const grouping=read('src/editor-layout.js');
const groupingCSS=read('editor-redesign.css');
const compactCSS=read('mobile-compact.css');
const darkLogo=read('assets/roygbiv-logo-dark.svg');
const creamLogo=read('assets/roygbiv-logo-cream.svg');

test('Cream Studio defaults on but Original Dark remains selectable and untouched',()=>{
  assert.match(html,/option value="cream" selected/);
  assert.match(html,/option value="dark">Original Dark/);
  assert.match(html,/localStorage\.getItem\('roygbiv:studio-theme:v1'\) \|\| 'cream'/);
  assert.match(mobile,/setTheme\(remembered\)/);
  assert.match(mobile,/localStorage\.setItem\(THEME_KEY,theme\)/);
  assert.match(mobile,/document\.documentElement\.dataset\.theme=theme/);
  assert.match(original,/:root\{font-family:Inter/);
  assert.match(css,/html\[data-theme="cream"\]/);
});
test('mobile layout dedicates the viewport to a phone-shaped preview',()=>{
  assert.match(css,/@media \(max-width:790px\)/);
  assert.match(css,/height:calc\(100dvh - var\(--mobile-head\) - var\(--mobile-dock-height\)\)/);
  assert.match(css,/\.studio-stage\{height:100%;min-height:0!important/);
  assert.match(css,/\.wallpaper-frame canvas\{width:100%;height:100%;aspect-ratio:600\/1300/);
  assert.match(css,/\.mobile-dock\{height:var\(--mobile-dock-height\)/);
  assert.match(html,/name="viewport"/);
  assert.match(html,/interactive-widget=resizes-content/);
});
test('thumb dock connects to existing controls rather than duplicating model functionality',()=>{
  for(const id of ['mobileEdit','mobileExplore','mobileShuffle','mobileFavorite','mobileDownload','mobileMore']){
    assert.match(html,new RegExp('id="'+id+'"'));
    assert.match(mobile,new RegExp("'"+id+"'"));
  }
  for(const id of ['randomizeAll','favorite','download']){
    assert.match(mobile,new RegExp("'"+id+"'"));
  }
  assert.match(mobile,/moveUtilities\(mobile\.matches\)/);
  assert.match(mobile,/closeSurfaces\(\{restoreFocus:false\}\)/);
  assert.match(mobile,/event\.key==='Escape'/);
  assert.match(html,/id="mobileSheetBackdrop"/);
});
test('all original configuration and output surfaces remain in the DOM',()=>{
  for(const id of ['panel-design','panel-colour','panel-textures','panel-refine',
    'preview','metadataPanel','positionStatus','gallery','batch','showFavorites',
    'downloadRecipe','copyRecipe','copyLink','seedInput','applySeed','undo',
    'textureLayer2Panel','textureLayer3Panel','stripeShadowControls']){
    assert.match(html,new RegExp('id="'+id+'"'),id);
  }
  assert.match(mobile,/\.export-metadata/);
  assert.match(mobile,/\.composition-positioner/);
  assert.match(mobile,/\.details-bar/);
});
test('the two SVGs share geometry and differ in background and phone outline colour',()=>{
  assert.match(darkLogo,/fill="#050608"/);
  assert.match(creamLogo,/fill="#fff9ee"/);
  assert.match(darkLogo,/stroke="#fff"/);
  assert.match(creamLogo,/stroke="#11131a"/);
  const paths=s=>[...s.matchAll(/<path stroke="#[0-9a-fA-F]{6}" d="([^"]+)"\/>/g)].map(x=>x[1]);
  assert.equal(paths(darkLogo).length,7);
  assert.deepEqual(paths(darkLogo),paths(creamLogo));
  assert.match(darkLogo,/transform="translate\(0 -2\.4\)"/);
  for(const path of paths(darkLogo)){
    const n=[...path.matchAll(/\d+/g)].map(x=>Number(x[0]));
    assert.ok(n.every(v=>v>=8&&v<=111),'stripes stay short of square edges');
  }
});
test('raster generator produces matching actual PNG binaries at icon resolution',()=>{
  execFileSync(process.execPath,[new URL('../scripts/build-logo-raster.mjs',import.meta.url).pathname],{stdio:'pipe'});
  const dark=readFileSync(new URL('../assets/roygbiv-logo-dark.png',import.meta.url));
  const cream=readFileSync(new URL('../assets/roygbiv-logo-cream.png',import.meta.url));
  const sig=Buffer.from('89504e470d0a1a0a','hex');
  for(const bytes of [dark,cream]){
    assert.ok(bytes.subarray(0,8).equals(sig));
    assert.equal(bytes.readUInt32BE(16),512);
    assert.equal(bytes.readUInt32BE(20),512);
  }
  assert.ok(!dark.equals(cream));
});

test('mobile editor has direct named tools and optional sideways swipes',()=>{
  const schema=read('src/editor-schema.js');
  const layout=read('src/editor-layout.js');
  const newCSS=read('editor-redesign.css');
  assert.match(html,/id="mobileDismissHandle"/);
  assert.match(html,/src\/mobile-swipes\.js\?v=/);
  assert.doesNotMatch(html,/src\/mobile-card-groups\.js\?v=/);
  assert.match(swipe,/selectEditorTool/);
  assert.match(swipe,/Math\.abs\(dx\)<45/);
  assert.match(layout,/editor-tool-chooser/);
  assert.match(newCSS,/preview-safe|separate resized area/i);
  assert.match(newCSS,/overflow:hidden!important/);
  assert.match(schema,/WIZARD_STEPS/);
});
test('mobile edit reclaims the header and compact action dock, leaving only an expand arrow',()=>{
  assert.match(html,/id="mobileDockExpand"/);
  assert.match(html,/id="mobileActionDock"/);
  assert.match(compactCSS,/--mobile-head:0px/);
  assert.match(compactCSS,/--mobile-dock-height:0px/);
  assert.match(compactCSS,/--mobile-tray-height:clamp\(158px,19dvh,184px\)/);
  assert.match(compactCSS,/translateY\(-110%\)/);
  assert.match(compactCSS,/translateX\(110%\)/);
  assert.match(compactCSS,/\.mobile-dock-expand/);
  assert.match(mobile,/dockExpand\.addEventListener\('click',\(\)=>closeSurfaces/);
  assert.match(mobile,/dock\.setAttribute\('aria-hidden','true'\)/);
  assert.match(compactCSS,/min-height:25px!important/);
  assert.match(compactCSS,/\.randomize-symbol/);
  assert.match(compactCSS,/\.prime-toggle input/);
  assert.match(compactCSS,/\.settings-tab/);
  assert.match(html,/mobile-compact\.css\?v=/);
});

test('Prime-only checkbox changes mode without displaying an explanatory toast',()=>{
  const app=read('src/app.js');
  assert.doesNotMatch(app,/primeModeHint'\)\.hidden=!current\.primesOnly/);
  assert.match(html,/id="primeModeHint"[^>]*hidden/);
  assert.match(html,/name="primesOnly"/);
});
test('all settings have a single tool home and no nested mobile vertical scrolling',()=>{
  const schema=read('src/editor-schema.js');
  const layout=read('src/editor-layout.js');
  const css=read('editor-redesign.css');
  for(const name of ['Geometry','Patterns','Shadows','Outlines','Lighting','Character'])
    assert.ok(schema.includes("name:'"+name+"'"),name);
  assert.match(layout,/appendUnique\(card,fieldNode\(key\)\)/);
  assert.match(layout,/dataset\.randomSetting=key/);
  assert.match(css,/scroll-snap-type:none!important/);
  assert.match(css,/overflow:hidden!important/);
  assert.match(html,/editor-redesign\.css\?v=/);
});
test('preview controls reuse the existing nudge and Randomize inputs, zoom affects preview only',()=>{
  const tools=read('src/mobile-preview-tools.js');
  assert.match(tools,/prime\.setAttribute\('form','controls'\)/);
  assert.match(tools,/nudgeMarker\.after\(nudge\)/);
  assert.match(tools,/toolbarMarker\.after\(toolbar\)/);
  assert.match(tools,/stage\.style\.setProperty\('--mobile-preview-zoom'/);
  assert.match(tools,/Math\.min\(2\.5,next\)/);
  assert.doesNotMatch(tools,/changeRecipe|normalizeRecipe|downloadPNG/);
  assert.match(read('mobile-editor-rail.css'),/\.mobile-preview-rail-right/);
});
