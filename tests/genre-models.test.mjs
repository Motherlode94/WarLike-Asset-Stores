import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateGenreAssets,genrePacks} from '../scripts/generate-genre-models.mjs';
const root=new URL('../assets/free/warlike-genre-packs/',import.meta.url);

test('eleven real genre packs produce 88 independent GLBs and 88 PNG sprites',async()=>{
 const models=await generateGenreAssets();
 assert.equal(genrePacks.length,11);
 assert.equal(models.length,88);
 const sprites=JSON.parse(await readFile(new URL('sprites.json',root),'utf8'));
 assert.equal(sprites.length,88);
 assert.equal(new Set(models.map(m=>m.id)).size,88);
 for(const item of models){
  const filename=item.url.split('/').at(-1),raw=await readFile(new URL(filename,root));
  assert.equal(raw.toString('ascii',0,4),'glTF',item.id);
  assert.equal(raw.readUInt32LE(4),2,item.id);
  assert.equal(raw.readUInt32LE(8),raw.length,item.id);
  const len=raw.readUInt32LE(12),doc=JSON.parse(raw.toString('utf8',20,20+len).trim());
  assert.equal(doc.asset.version,'2.0');
  assert.ok(doc.meshes.length>=1);
  assert.ok(doc.meshes.every(mesh=>mesh.primitives[0].attributes.POSITION>=0));
  assert.ok(doc.materials.length>=2);
  assert.equal(item.license,'CC0-1.0');
  assert.ok((await readFile(new URL(item.thumbnailUrl.split('/').at(-1),root),'utf8')).startsWith('<svg'));
 }
 for(const item of sprites){
  const raw=await readFile(new URL(item.spriteUrl.split('/').at(-1),root));
  assert.equal(raw.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(raw.readUInt32BE(16),64);
  assert.equal(raw.readUInt32BE(20),64);
 }
});

test('store indexes generated GLBs and 2D sprites through the independent Library pipeline',async()=>{
 const catalog=await readFile(new URL('../catalog-bundled.js',import.meta.url),'utf8');
 const twoD=await readFile(new URL('../2d.html',import.meta.url),'utf8');
 const build=await readFile(new URL('../scripts/build-store.mjs',import.meta.url),'utf8');
 assert.match(catalog,/warlike-genre-packs\/models\.json/);
 assert.match(twoD,/warlike-genre-packs\/sprites\.json/);
 assert.match(build,/generateGenreAssets\(\)/);
 assert.match(twoD,/repeat\(7,minmax\(0,1fr\)\)/);
});
