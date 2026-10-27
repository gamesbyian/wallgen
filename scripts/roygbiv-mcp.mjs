#!/usr/bin/env node
/**
 * Local ROYGBIV MCP server. Only stdio is exposed; no public listener or
 * external model/host is involved. stdout is reserved for JSON-RPC.
 */
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, mkdtemp, stat } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  describeAgentCapabilities, composeAgentRecipe, editAgentRecipe,
  varyAgentRecipe, exploreAgentRecipes, inspectAgentRecipe
} from '../src/agent-api.js';

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const renderer = join(root, 'scripts/render-headless.mjs');
const MAX_CANDIDATES = 64;
const candidates = new Map();
let temporary;
const exportsDir = resolve(process.env.ROYGBIV_AGENT_OUTPUT_DIR ||
  join(homedir(), '.roygbiv-agent', 'exports'));

function json(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}
function failure(error) {
  return { isError: true, content: [{ type: 'text',
    text: error instanceof Error ? error.message : String(error) }] };
}
function safely(handler) {
  return async (args) => {
    try { return await handler(args); }
    catch (error) { return failure(error); }
  };
}
function put(recipe, parent = null) {
  const source = JSON.stringify(recipe);
  const id = 'design-' + createHash('sha256').update(source).digest('hex').slice(0,16);
  if (!candidates.has(id) && candidates.size >= MAX_CANDIDATES)
    candidates.delete(candidates.keys().next().value);
  candidates.set(id, recipe);
  return { id, parent, recipe, inspect: inspectAgentRecipe(recipe) };
}
function get(id) {
  const recipe = candidates.get(id);
  if (!recipe) throw new RangeError('Unknown candidate ID: ' + id + '. Start with roygbiv_compose.');
  return recipe;
}
async function scratch() {
  if (!temporary) temporary = await mkdtemp(join(tmpdir(), 'roygbiv-mcp-'));
  return temporary;
}
// Prevent concurrent model tool calls from launching many Chromium instances
// and exhausting a workstation. A failed render must not block later jobs.
let renderQueue = Promise.resolve();
function queueRender(recipe, width, height, outfile) {
  const job = renderQueue.then(() => render(recipe, width, height, outfile));
  renderQueue = job.then(() => undefined, () => undefined);
  return job;
}
async function render(recipe, width, height, outfile) {
  const scratchDir = await scratch();
  const hash = createHash('sha256').update(JSON.stringify(recipe)).digest('hex').slice(0,16);
  const recipeFile = join(scratchDir, hash + '.json');
  await writeFile(recipeFile, JSON.stringify(recipe));
  const { stdout } = await run(process.execPath, [
    renderer, '--recipe', recipeFile, '--width', String(width), '--height', String(height),
    '--out', outfile, '--backend', 'reference'
  ], { cwd: root, timeout: 180000, maxBuffer: 1024 * 1024, windowsHide: true });
  return JSON.parse(stdout.trim());
}
function serverFactory() {
  const server = new McpServer({ name: 'roygbiv', version: '0.1.0' });
  const settings = z.record(z.string(), z.unknown()).optional().describe(
    'Canonical ROYGBIV recipe setting names and values; use roygbiv_describe to discover them.'
  );
  const id = z.string().min(1).max(40).describe('Design ID from an earlier ROYGBIV tool result');

  server.registerTool('roygbiv_describe', {
    description: 'Discover ROYGBIV styles, canonical setting IDs, control ranges, categories, capabilities and limitations.',
    inputSchema: z.object({})
  }, safely(async () => json(describeAgentCapabilities())));

  server.registerTool('roygbiv_compose', {
    description: 'Create a fresh deterministic, editable wallpaper recipe. Translate user creative intent into real settings first.',
    inputSchema: z.object({
      style: z.enum(['studio','currents','fracture','confetti','deco','tapestry','signal','contour']).default('studio'),
      seed: z.string().min(1).max(90).default('agent-001'),
      settings,
      locks: z.array(z.string()).max(100).optional()
    })
  }, safely(async ({ style, seed, settings, locks }) =>
    json(put(composeAgentRecipe({ style, seed, settings, locks })))));

  server.registerTool('roygbiv_edit', {
    description: 'Precisely edit a design using canonical settings; locks are respected unless explicitly unlocked.',
    inputSchema: z.object({
      id, settings, lock: z.array(z.string()).max(100).optional(),
      unlock: z.array(z.string()).max(100).optional()
    })
  }, safely(async ({ id, settings, lock, unlock }) =>
    json(put(editAgentRecipe(get(id), { settings, lock, unlock }), id))));

  server.registerTool('roygbiv_vary', {
    description: 'Make one scoped deterministic variation of a candidate, preserving locks and unrelated settings.',
    inputSchema: z.object({
      id, category: z.string().optional(),
      tool: z.string().optional(), setting: z.string().optional(),
      mode: z.enum(['vary','reroll']).default('vary'),
      strength: z.enum(['gentle','moderate','wild']).default('moderate'),
      seed: z.string().min(1).max(90).default('agent-variation')
    })
  }, safely(async ({ id, ...options }) => {
    const result = varyAgentRecipe(get(id), options);
    return json({ ...put(result.recipe, id), modified: result.modified,
      scope: result.scope, name: result.name });
  }));

  server.registerTool('roygbiv_explore', {
    description: 'Generate up to 12 distinct deterministic child recipes by varying selected editor categories and their unlocked settings. Rendering is separate.',
    inputSchema: z.object({
      id, count: z.number().int().min(1).max(12).default(4),
      seed: z.string().min(1).max(90).default('agent-exploration'),
      categories: z.array(z.string()).min(1).max(7).optional(),
      strength: z.enum(['gentle','moderate','wild']).default('moderate')
    })
  }, safely(async ({ id, ...options }) => {
    const recipes = exploreAgentRecipes(get(id), options);
    return json({ candidates: recipes.map(({ recipe, modified }) => {
      const item = put(recipe, id);
      return { id: item.id, parent: id, inspect: item.inspect, modified };
    }) });
  }));

  server.registerTool('roygbiv_inspect', {
    description: 'Inspect a candidate and retrieve its complete restorable canonical recipe. Structural inspection does not assert pixel visibility or aesthetic quality.',
    inputSchema: z.object({ id })
  }, safely(async ({ id }) => json({ id, recipe: get(id), inspect: inspectAgentRecipe(get(id)) })));

  server.registerTool('roygbiv_preview', {
    description: 'Render actual ROYGBIV pixels from an existing candidate and return an image that the LLM can visually critique. Maximum width 600.',
    inputSchema: z.object({
      id, width: z.number().int().min(180).max(600).default(360)
    })
  }, safely(async ({ id, width }) => {
    const recipe = get(id);
    const height = Math.round(width * 13 / 6);
    const outfile = join(await scratch(), id + '-' + width + '.png');
    let info;
    // Candidate IDs are content-derived, and scratch files belong only to this
    // process. Reuse successful previews, including repeated agent critiques.
    const cached = await stat(outfile).then(s => s.size > 64).catch(() => false);
    if (!cached) info = await queueRender(recipe, width, height, outfile);
    else info = { file: outfile, width, height, seed: recipe.seed, cached: true };
    const data = (await readFile(outfile)).toString('base64');
    return { content: [
      { type: 'image', data, mimeType: 'image/png' },
      { type: 'text', text: JSON.stringify({ ...info, id, previewOnly: true,
        note: 'Inspect actual pixels. This render is not full-resolution wallpaper export.' }) }
    ] };
  }));

  server.registerTool('roygbiv_export', {
    description: 'Export a selected wallpaper at actual native Pixel 6 Pro resolution and write an editable JSON sidecar. Returns local absolute file paths, not public URLs.',
    inputSchema: z.object({ id })
  }, safely(async ({ id }) => {
    const recipe = get(id);
    await mkdir(exportsDir, { recursive: true, mode: 0o700 });
    const imagePath = join(exportsDir, id + '.png');
    const recipePath = join(exportsDir, id + '.json');
    const info = await queueRender(recipe, 3024, 6552, imagePath);
    await writeFile(recipePath, JSON.stringify(recipe, null, 2), { mode: 0o600 });
    return json({ ...info, id, recipePath, imagePath, localOnly: true,
      recipeEmbedded: true, note: 'These are local paths. No remote upload or public share URL was created.' });
  }));

  return server;
}

process.on('exit', () => {
  if (temporary) {
    try { rmSync(temporary, { recursive: true, force: true }); }
    catch { /* scratch cleanup is best-effort */ }
  }
});
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // The v2 SDK owns startup/lifetime; serveStdio is not a promise.
  void serveStdio(serverFactory);
}
export { serverFactory };
