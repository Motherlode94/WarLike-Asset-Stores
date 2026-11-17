import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const json=relative=>JSON.parse(readFileSync(join(root,relative),'utf8'));
const catalog=json('extensions/catalog.json');
const ids=[
 'warlike-interaction-lab','warlike-fps-operation','warlike-tactical-command',
 'warlike-tower-defense-planner','warlike-detective-case','warlike-horror-power-grid',
 'warlike-supermarket-business','warlike-construction-operations',
 'warlike-rpg-dungeon-relay','warlike-turnbased-operations',
 'warlike-farming-greenhouse','warlike-garage-pitstop'
];
test('each gameplay pack ships an actual editable V2 project with all six original sequences',()=>{
 for(const id of ids){
  const entry=catalog.items.find(e=>e.id===id);
  assert.ok(entry,id);
  assert.match(entry.sceneFile,/^\.\/extensions\/scenes\/[a-z0-9-]+\.project-v2\.json$/);
  assert.ok(existsSync(join(root,entry.sceneFile)),id+' scene not found');
  const pack=json(entry.file),project=json(entry.sceneFile);
  assert.equal(project.schema,'warlike.project.v2');
  assert.ok(pack.modes.includes(project.mode));
  assert.ok(Array.isArray(project.assets)&&Array.isArray(project.scenes));
  assert.equal(project.scenes.length,1);
  const [scene]=project.scenes;
  assert.equal(scene.schema,'warlike.scene.v2');
  assert.equal(project.settings.startSceneId,scene.id);
  assert.equal(scene.objects.length,pack.recipes.length+2,id);
  assert.equal(new Set(scene.objects.map(o=>o.id)).size,scene.objects.length);
  assert.equal(new Set(scene.objects.map(o=>o.sourceEntityId)).size,scene.objects.length);
  for(const object of scene.objects){
   assert.equal(object.components.filter(c=>c.type==='Transform').length,1);
   const transform=object.components.find(c=>c.type==='Transform');
   for(const key of ['position','rotation','scale']){
    assert.equal(transform[key].length,3);
    assert.ok(transform[key].every(Number.isFinite));
   }
   assert.ok(transform.scale.every(v=>v!==0));
   assert.ok(object.components.some(c=>c.type==='LegacyEntity'));
  }
  assert.ok(scene.objects.some(o=>o.components.find(c=>c.type==='LegacyEntity')?.data.type==='player'));
  assert.ok(scene.objects.some(o=>o.components.find(c=>c.type==='LegacyEntity')?.data.collision3d));
  for(let i=0;i<pack.recipes.length;i++){
   const recipe=pack.recipes[i],object=scene.objects[i+2];
   const legacy=object.components.find(c=>c.type==='LegacyEntity')?.data;
   assert.equal(object.name,recipe.name);
   assert.deepEqual(legacy.sequence,recipe.sequence,id+': '+recipe.id+' legacy');
   assert.deepEqual(object.components.find(c=>c.type==='sequence')?.data,recipe.sequence,id+': '+recipe.id+' graph');
   assert.ok(legacy.interactable?.enabled,id+' '+recipe.id+' interactable');
  }
 }
});
test('Store explicitly offers project V2 companion downloads, not fabricated automatic installation',()=>{
 const html=readFileSync(join(root,'extensions.html'),'utf8');
 assert.ok(html.includes('x.sceneFile'));
 assert.ok(html.includes('⬡ Scène exemple V2'));
 assert.ok(html.includes('sameOrigin(x.sceneFile)'));
});
