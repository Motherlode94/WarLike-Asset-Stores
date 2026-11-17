import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(readFileSync(join(root,file),'utf8'));
const catalog=read('extensions/catalog.json');
const gameplayIds=[
 'warlike-interaction-lab','warlike-fps-operation','warlike-tactical-command',
 'warlike-tower-defense-planner','warlike-detective-case','warlike-horror-power-grid',
 'warlike-supermarket-business','warlike-construction-operations',
 'warlike-rpg-dungeon-relay','warlike-turnbased-operations',
 'warlike-farming-greenhouse','warlike-garage-pitstop'
];
const otherIds=['studio-genre-vocal-chains','node-cinematic-looks','monteur-cinematic-motions','misc-modern-music-course'];
const eventTypes=new Set(['start','interact','enter','exit','keyDown','interval','signal']);
const actions=new Set(['setVariable','addVariable','message','winGame','emitSignal','setCollision','setVisibility']);
const safeKey=/^[a-zA-Z][a-zA-Z0-9_:-]{0,59}$/;

test('new extensions resolve to actual local files and do not duplicate catalog ids',()=>{
 assert.equal(new Set(catalog.items.map(x=>x.id)).size,catalog.items.length);
 for(const id of [...gameplayIds,...otherIds]){
  const item=catalog.items.find(x=>x.id===id);
  assert.ok(item,id);
  assert.ok(item.file.startsWith('./extensions/'));
  assert.ok(existsSync(join(root,item.file)),item.file);
  assert.equal(item.version,'1.0.0');
 }
});

test('twelve Engine packs contain 72 compatible, unique and bounded WarNode recipes',()=>{
 let total=0;
 for(const id of gameplayIds){
  const entry=catalog.items.find(x=>x.id===id);
  assert.equal(entry.app,'Engine');
  assert.equal(entry.status,'blueprint');
  const pack=read(entry.file);
  assert.equal(pack.apiVersion,'1.0');
  assert.equal(pack.id,id);
  assert.ok(pack.recipes.length>=5&&pack.recipes.length<=20,id);
  assert.deepEqual(pack.modes,entry.modes);
  assert.equal(new Set(pack.recipes.map(x=>x.id)).size,pack.recipes.length);
  total+=pack.recipes.length;
  for(const recipe of pack.recipes){
   assert.match(recipe.id,/^[a-z][a-z0-9-]{2,63}$/);
   assert.ok(recipe.name&&recipe.description);
   const s=recipe.sequence;
   assert.ok(eventTypes.has(s.event),recipe.id+' '+s.event);
   assert.ok(Number.isFinite(s.radius)&&s.radius<=500);
   assert.ok((s.branches||[]).length<=4);
   for(const steps of [s.instructions,...(s.branches||[]).map(b=>b.instructions),...(s.elseInstructions?[s.elseInstructions]:[])]){
    assert.ok(Array.isArray(steps)&&steps.length<=24);
    for(const a of steps){
     assert.ok(actions.has(a.type),id+'/'+recipe.id+' '+a.type);
     if(a.key!==undefined)assert.match(a.key,safeKey);
     if(a.value!==undefined)assert.ok(['string','number','boolean'].includes(typeof a.value));
    }
   }
   for(const branch of s.branches||[]){
    assert.ok(branch.conditions.length<=8);
    for(const c of branch.conditions){
     assert.equal(c.type,'variable');
     assert.match(c.key,safeKey);
     assert.ok(['==','!=','>','<','>=','<='].includes(c.operator));
    }
   }
  }
 }
 assert.equal(total,72);
});

test('Studio, Node, Monteur and MISC extensions use their established schema families',()=>{
 const schemas={
 'studio-genre-vocal-chains':'warlike.studio.track-chains.v1',
 'node-cinematic-looks':'warlike.node.presets.v1',
 'monteur-cinematic-motions':'warlike.monteur.motion-pack.v1',
 'misc-modern-music-course':'warlike.misc.practice-plan.v1'
 };
 for(const [id,schema] of Object.entries(schemas)){
  const entry=catalog.items.find(x=>x.id===id),data=read(entry.file);
  assert.equal(entry.status,'preset');
  assert.equal(data.schema,schema);
  assert.ok((data.presets||data.instruments).length>=3);
 }
});
