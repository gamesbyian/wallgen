import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {iconMarkup,iconSrc} from '../src/ui-icons.js';

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "assets/icons/roygbiv");
const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
const names = manifest.icons.map((entry) => entry.name);

test("integrated ROYGBIV icons are a complete, unique SVG collection", () => {
  assert.equal(manifest.status, "integrated");
  assert.equal(names.length, 68);
  assert.equal(new Set(names).size, names.length, "duplicate icon names");
  const files = readdirSync(dir).filter((name) => name.endsWith(".svg")).sort();
  assert.deepEqual(files, names.map((name) => name + ".svg").sort());
  for (const entry of manifest.icons) {
    assert.match(entry.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(entry.title && entry.category);
  }
});

test("icons are accessible, self-contained and gradient-free", () => {
  for (const name of names) {
    const source = readFileSync(join(dir, name + ".svg"), "utf8");
    assert.match(source, /^<svg\s[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, name);
    assert.match(source, /viewBox="0 0 (32 32|120 120)"/, name);
    assert.match(source, /role="img"/, name);
    assert.match(source, /<title(?:\s[^>]*)?>[\s\S]+?<\/title>/, name);
    assert.match(source.trim(), /<\/svg>$/, name);
    assert.doesNotMatch(source, /<script\b|<foreignObject\b|(?:linear|radial)Gradient\b|<filter\b|url\s*\(/i, name);
    if (name !== "app-icon") {
      assert.match(source, /stroke="currentColor"/, name);
      assert.match(source, /stroke-linecap="round"/, name);
      assert.match(source, /viewBox="0 0 32 32"/, name);
    }
  }
});

test("the original approved poster is archived byte-for-byte", () => {
  const references = join(root, "assets/icons/references");
  const original = readFileSync(join(references, "roygbiv-icon-system-approved.png"));
  const blobHash = createHash("sha1").update("blob " + original.length + "\0").update(original).digest("hex");
  assert.equal(blobHash, "f8a27e238575906cfca4dfcce55b0bfda588cc29");
  const vector = readFileSync(join(references, "roygbiv-icon-system-approved.svg"), "utf8");
  assert.match(vector, /^<svg\s/);
  assert.match(vector, /<\/svg>\s*$/);
  assert.doesNotMatch(vector, /(?:linear|radial)Gradient|<script\b|<foreignObject\b/i);
});

test("standalone review preview references every icon", () => {
  const html = readFileSync(join(dir, "review.html"), "utf8");
  for (const name of names) {
    assert.ok(html.includes('src="./' + name + '.svg"'), "preview missing " + name);
  }
});


test('runtime SVGs preserve theme inheritance and the entire canonical icon inventory',()=>{
  for(const name of names){
    const markup=iconMarkup(name);
    assert.ok(markup.includes('data-roygbiv-icon="'+name+'"'));
    assert.ok(markup.includes('stroke="currentColor"'));
    assert.ok(!markup.includes('<img'));
    assert.ok(iconSrc(name).endsWith('/'+name+'.svg'));
  }
  assert.throws(()=>iconMarkup('../../foo'),RangeError);
});
