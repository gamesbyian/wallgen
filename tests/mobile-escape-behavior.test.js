import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('child Escape handling takes precedence over global mobile sheet dismissal',()=>{
  const editor=source('src/editor-layout.js');
  const mobile=source('src/mobile-studio.js');
  assert.match(editor,/if\(event\.key==='Escape'\)\{event\.preventDefault\(\);closeSearch\(\);return;\}/,
    'setting search already consumes Escape and restores its toggle focus');
  assert.match(mobile,/if\(event\.key!=='Escape'\|\|event\.defaultPrevented\)return;/,
    'global Escape dismissal must not run after a child consumed it');
  assert.match(mobile,/if\(event\.target\?\.closest\?\.\('dialog\[open\]'\)\)return;/,
    'native Activity log dialogs must dismiss without collapsing the underlying editor');
  assert.match(mobile,/closeSurfaces\(\);\s*\}\);/,
    'unhandled Escape must still close the mobile surface');
});
