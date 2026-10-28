import { normalizeRecipe } from '../../../src/model.js';
import { importAgentRecipe, editAgentRecipe, varyAgentRecipe, exploreAgentRecipes, inspectAgentRecipe } from '../../../src/agent-api.js';

export const MAX_RECIPE_BYTES = 131072;
const encoder = new TextEncoder();
export function ownerKey(userId) {
  if (typeof userId !== 'string' || userId.length < 1 || userId.length > 256)
    throw new Error('Authenticated user identity required');
  return Array.from(new Uint8Array(encoder.encode(userId))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function safeId(id) {
  if (!/^design-[a-f0-9]{16}$/.test(id)) throw new Error('Invalid candidate ID');
  return id;
}
async function digest(recipe) {
  const bytes=encoder.encode(JSON.stringify(recipe));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return 'design-'+Array.from(new Uint8Array(hash)).slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function boundedRecipe(value) {
  const raw=JSON.stringify(value);
  if (typeof raw !== 'string' || encoder.encode(raw).byteLength>MAX_RECIPE_BYTES)
    throw new Error('Recipe exceeds 128 KiB or is invalid');
  return importAgentRecipe(value);
}
export async function saveRecipe(env,userId,recipe) {
  const current=boundedRecipe(recipe);
  const id=await digest(current);
  const owner=ownerKey(userId);
  const key='users/'+owner+'/recipes/'+id+'.json';
  await env.PRIVATE_ARTIFACTS.put(key,JSON.stringify(current),{
    httpMetadata:{contentType:'application/json'},
    customMetadata:{type:'recipe',owner}
  });
  // D1 is a metadata index only; never use a global id lookup without owner.
  await env.RECIPES.prepare('INSERT INTO designs (owner, id, object_key, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(owner,id) DO UPDATE SET object_key=excluded.object_key')
    .bind(owner,id,key,Date.now()).run();
  return {id,recipe:current};
}
export async function loadRecipe(env,userId,id) {
  safeId(id);
  const owner=ownerKey(userId);
  const row=await env.RECIPES.prepare('SELECT object_key FROM designs WHERE owner = ? AND id = ?')
    .bind(owner,id).first();
  if (!row) throw new Error('Candidate not found');
  if (row.object_key!== 'users/'+owner+'/recipes/'+id+'.json') throw new Error('Invalid candidate storage path');
  const object=await env.PRIVATE_ARTIFACTS.get(row.object_key);
  if (!object) throw new Error('Candidate expired or unavailable');
  return boundedRecipe(await object.json());
}
export async function editStored(env,userId,id,options) {
  const recipe=editAgentRecipe(await loadRecipe(env,userId,id),options);
  return saveRecipe(env,userId,recipe);
}
export async function varyStored(env,userId,id,options) {
  const result=varyAgentRecipe(await loadRecipe(env,userId,id),options);
  return {...await saveRecipe(env,userId,result.recipe),modified:result.modified};
}
export async function exploreStored(env,userId,id,options) {
  const variants=exploreAgentRecipes(await loadRecipe(env,userId,id),options);
  const outputs=[];
  for (const variant of variants) {
    const stored=await saveRecipe(env,userId,variant.recipe);
    outputs.push({id:stored.id,modified:variant.modified,inspect:inspectAgentRecipe(stored.recipe)});
  }
  return outputs;
}

/**
 * A bounded cron sweep of expired private design records.
 * Expiry is server-owned; callers cannot nominate arbitrary object keys.
 * D1 is the authority. R2 deletes use the exact owner-scoped key.
 */
export async function purgeExpiredRecipes(env,{now=Date.now(),ttlDays=30,limit=100}={}){
  if(!Number.isFinite(now)||ttlDays<1||ttlDays>365||!Number.isInteger(limit)||limit<1||limit>500)
    throw new RangeError('Invalid retention policy');
  const cutoff=now-ttlDays*86400000;
  const {results=[]}=await env.RECIPES.prepare(
    'SELECT owner,id,object_key FROM designs WHERE created_at < ? ORDER BY created_at ASC LIMIT ?'
  ).bind(cutoff,limit).all();
  let deleted=0;
  for(const row of results){
    if(typeof row.owner!=='string'||!/^design-[a-f0-9]{16}$/.test(row.id)||
       row.object_key!=='users/'+row.owner+'/recipes/'+row.id+'.json')continue;
    // Conditional metadata deletion first avoids deleting a newly refreshed
    // row after a concurrent save; only remove R2 once that exact row is gone.
    const out=await env.RECIPES.prepare(
      'DELETE FROM designs WHERE owner = ? AND id = ? AND object_key = ? AND created_at < ?'
    ).bind(row.owner,row.id,row.object_key,cutoff).run();
    if((out.meta?.changes??0)===1){
      await env.PRIVATE_ARTIFACTS.delete(row.object_key);
      deleted++;
    }
  }
  return {deleted,cutoff};
}
