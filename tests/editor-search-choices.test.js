import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOOL_LIST} from '../src/editor-schema.js';
import {findEditorSearchHit,findEditorSearchHits} from '../src/editor-tool-search.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {findPhotoIntent} from '../src/editor-photo-navigation.js';

test('ranked search exposes different actual controls, preserving first-hit semantics',()=>{
  const options={applies:tool=>toolAppliesToScene(tool,{structure:'paths'})};
  for(const query of ['shadow','texture']){
    const hits=findEditorSearchHits(query,TOOL_LIST,options);
    assert.ok(hits.length>=2,'Expected ambiguous query: '+query);
    assert.deepEqual(hits[0],findEditorSearchHit(query,TOOL_LIST,options));
    assert.ok(hits.every((hit,i)=>i===0||hit.score<=hits[i-1].score));
    assert.equal(new Set(hits.map(hit=>hit.tool.id+':'+hit.key)).size,hits.length);
    assert.ok(hits.every(hit=>hit.tool&&hit.tool.category));
  }
});
test('ranked search excludes inapplicable tools and returns empty for blank/nonmatches',()=>{
  const toolList=TOOL_LIST;
  const options={applies:tool=>toolAppliesToScene(tool,{structure:'regions',regionMode:'scattered'})};
  const hits=findEditorSearchHits('size',toolList,options);
  assert.ok(hits.length);
  assert.ok(hits.every(hit=>hit.tool.category!=='stripes'));
  assert.deepEqual(findEditorSearchHits('  ',toolList,options),[]);
  assert.deepEqual(findEditorSearchHits('qwerty-no-control',toolList,options),[]);
  assert.equal(findEditorSearchHit('qwerty-no-control',toolList,options),null);
});
test('multiple-choice UI has semantic listbox, keyboard navigation, click and escape',()=>{
  const js=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../editor-redesign.css',import.meta.url),'utf8');
  assert.match(js,/searchResults\.setAttribute\('role','listbox'\)/);
  assert.match(js,/option\.setAttribute\('role','option'\)/);
  assert.match(js,/aria-activedescendant/);
  assert.match(js,/\['ArrowDown','ArrowUp'\]/);
  assert.match(js,/searchResults\.addEventListener\('click'/);
  assert.match(js,/if\(event\.key==='Escape'\)/);
  assert.match(js,/chooseSearchResult\(matchedSearchHit\)/);
  assert.match(css,/\.editor-search-results\[hidden\]/);
  assert.match(css,/max-height:186px/);
});

test('specific artistic photo terms navigate to one existing Light pane without changing look',()=>{
  const examples={
    'film grain':'Film grain',
    'photo bloom':'Wide warm film diffusion',
    'film halation':'Film finishing',
    'warm fringe':'Wide warm film diffusion',
    'negative print':'Muted negative print',
    'colour negative':'Muted negative print',
    'old digicam':'Early digital compact',
    'high dynamic range':'Smartphone HDR',
    'black and white print':'Monochrome film',
    'photographic grain':'Film grain',
    'iphone portraits':'Smartphone HDR'
  };
  for(const [query,expected] of Object.entries(examples))
    assert.equal(findPhotoIntent(query)?.lookHint,expected,query);
  for(const vague of ['grain','glow','texture','light','background','shadows',''])
    assert.equal(findPhotoIntent(vague),null,'keep ordinary setting search: '+vague);
  const layout=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  assert.match(layout,/findPhotoIntent\(query\)/);
  assert.match(layout,/photoIntent\.lookHint/);
  assert.match(layout,/\[data-photo-pane="photo"\]/);
});
