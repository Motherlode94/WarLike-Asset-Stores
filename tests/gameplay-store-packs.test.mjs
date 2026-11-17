import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const json=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const catalog=json('extensions/catalog.json');
const names=['warlike-platformer-2d','warlike-horror-escape','warlike-farm-production','warlike-rts-logistics'];
const allowedEvents=new Set(['start','interact','enter','exit','triggerEnter2d','triggerStay2d','triggerExit2d','collisionEnter2d','collisionStay2d','collisionExit2d']);
const allowedActions=new Set(['setVariable','addVariable','message','winGame']);
test('catalog entries are unique, downloadable and disclose installation state',()=>{
 assert.equal(catalog.schema,'warlike.extensions.catalog.v1');
 assert.equal(new Set(catalog.items.map(x=>x.id)).size,catalog.items.length);
 for(const item of catalog.items){
  assert.ok(['module','preset','blueprint'].includes(item.status),item.id);
  assert.ok(item.file.startsWith('./extensions/')&&!item.file.includes('..'),item.id);
  assert.ok(existsSync(join(root,item.file)),item.id+' has missing download');
 }
});
test('four new first-party gameplay packs contain complete validated-format recipes',()=>{
 for(const id of names){
  const entry=catalog.items.find(i=>i.id===id);assert.ok(entry,id);
  assert.equal(entry.status,'blueprint');
  assert.ok(entry.modes?.length);
  const pack=json(entry.file.slice(2));
  assert.equal(pack.id,id);assert.equal(pack.apiVersion,'1.0');
  assert.ok(pack.recipes.length>=4);
  assert.deepEqual([...new Set(pack.recipes.map(r=>r.id))],pack.recipes.map(r=>r.id));
  for(const recipe of pack.recipes){
   assert.ok(recipe.name&&recipe.description,recipe.id);
   const seq=recipe.sequence;
   assert.ok(allowedEvents.has(seq.event),recipe.id+' event');
   assert.ok(Array.isArray(seq.instructions),recipe.id+' instructions');
   const actions=[...seq.instructions,...(seq.branches||[]).flatMap(b=>b.instructions),...(seq.elseInstructions||[])];
   assert.ok(actions.length>0,recipe.id+' empty sequence');
   for(const a of actions)assert.ok(allowedActions.has(a.type),recipe.id+' unsupported '+a.type);
   for(const branch of seq.branches||[]){
    assert.ok(Array.isArray(branch.conditions)&&branch.conditions.length>0,recipe.id+' missing condition');
    for(const condition of branch.conditions)assert.equal(condition.type,'variable');
   }
  }
 }
});
test('Store filters expose mode / category / installation without claiming JavaScript modules are installed',()=>{
 const page=readFileSync(join(root,'extensions.html'),'utf8');
 for(const key of ['id="compatibility"','id="availability"','id="reset"','x.modes','x.status===availability'])assert.ok(page.includes(key),key);
 assert.ok(page.includes("install.disabled=x.status==='module'"));
 assert.ok(page.includes("x.status==='blueprint'?'Ouvrir Engine'"));
});
