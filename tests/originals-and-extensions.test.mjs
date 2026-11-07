import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=new URL('../assets/free/warlike-originals/',import.meta.url);
const models=JSON.parse(readFileSync(new URL('models.json',base),'utf8'));
test('WarLike Originals catalog resolves genuine self-contained GLBs',()=>{
 assert.equal(models.length,8);
 for(const item of models){
  assert.match(item.url,/\.glb$/);assert.equal(item.license,'CC0-1.0');
  const file=new URL('../'+item.url,import.meta.url),raw=readFileSync(file);
  assert.equal(raw.toString('ascii',0,4),'glTF',item.name);
  assert.equal(raw.readUInt32LE(4),2,item.name);
  assert.equal(raw.readUInt32LE(8),raw.length,item.name);
  const jsonLength=raw.readUInt32LE(12),doc=JSON.parse(raw.toString('utf8',20,20+jsonLength).trim());
  assert.equal(doc.asset.version,'2.0');
  assert.ok(doc.meshes.length>0&&doc.meshes[0].primitives.length>0);
  assert.ok(doc.materials.length>0);
  assert.ok(doc.meshes[0].primitives.every(p=>Number.isInteger(p.material)&&Number.isInteger(p.indices)&&Number.isInteger(p.attributes.POSITION)));
  assert.ok((doc.images||[]).every(x=>!x.uri||x.uri.startsWith('data:')));
  assert.ok(existsSync(new URL('../'+item.thumbnailUrl,import.meta.url)),'Missing preview for '+item.id);
 }
});
test('extension files exist and downloadable file types are explicit',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../extensions/catalog.json',import.meta.url),'utf8'));
 assert.equal(manifest.schema,'warlike.extensions.catalog.v1');
 assert.ok(manifest.items.length>=6);
 for(const item of manifest.items){assert.match(item.file,/^\.\/extensions\/[a-z0-9-]+\.(js|json)$/);assert.ok(existsSync(new URL('../'+item.file,import.meta.url)),item.file)}
});
