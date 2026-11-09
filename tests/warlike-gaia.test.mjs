import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BIOMES,normalizeConfig,generateHeightmap,scatterAssets,exportTerrainGLB,exportTerrainRecipe,heightmapPixels,previewPixels} from '../extensions/warlike-gaia.js';

test('WarLike Gaia supports eight selectable biomes and bounds terrain complexity',()=>{
 assert.equal(Object.keys(BIOMES).length,8);
 const cfg=normalizeConfig({biome:'mountains',resolution:9999,size:9999,height:9999,trees:9999});
 assert.equal(cfg.resolution,257);assert.equal(cfg.size,2048);assert.equal(cfg.height,320);assert.equal(cfg.trees,2500);
});
test('terrain seeded reproducibly and differs between seeds and biomes',()=>{
 const options={biome:'islands',seed:42,resolution:33,size:128,height:80,trees:30,rocks:15};
 const a=generateHeightmap(options),b=generateHeightmap(options),c=generateHeightmap({...options,seed:43}),d=generateHeightmap({...options,biome:'mountains'});
 assert.equal(a.heights.length,33*33);
 assert.deepEqual([...a.heights],[...b.heights]);
 assert.notDeepEqual([...a.heights],[...c.heights]);
 assert.notDeepEqual([...a.heights],[...d.heights]);
 assert.ok(a.heights.every(x=>x>=0&&x<=1&&Number.isFinite(x)));
 assert.deepEqual(scatterAssets(a),scatterAssets(b));
 assert.ok(scatterAssets(a).every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)&&Number.isFinite(x.z)));
});
test('GLB contains a genuine indexed colored triangle mesh, normals and safe embedded geometry',()=>{
 const t=generateHeightmap({seed:123,biome:'forest',resolution:33});
 const bytes=exportTerrainGLB(t),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'glTF');
 assert.equal(view.getUint32(4,true),2);assert.equal(view.getUint32(8,true),bytes.length);
 const len=view.getUint32(12,true),doc=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+len)).trim());
 assert.equal(doc.asset.version,'2.0');assert.equal(doc.meshes.length,1);assert.equal(doc.scenes[0].nodes[0],0);
 assert.deepEqual(doc.meshes[0].primitives[0].attributes,{POSITION:0,NORMAL:1,COLOR_0:2});
 assert.equal(doc.accessors[0].count,1089);
 assert.equal(doc.accessors[3].count,32*32*6);
 assert.equal(doc.accessors[3].componentType,5125);
 assert.equal(doc.extras.warlikeGaia.biome,'forest');
 assert.ok(doc.materials.length===1);
 assert.ok(doc.buffers[0].byteLength>1000);
 assert.equal(20+len+8+view.getUint32(20+len,true)+8,bytes.length);
});
test('heightmap and biome preview are correctly sized RGBA images',()=>{
 const terrain=generateHeightmap({resolution:17,seed:7});
 const gray=heightmapPixels(terrain),colored=previewPixels(terrain);
 assert.equal(gray.length,17*17*4);assert.equal(colored.length,gray.length);
 assert.ok(gray.every((v,i)=>i%4!==3||v===255));
 assert.equal(exportTerrainRecipe(terrain).schema,'warlike.gaia.terrain.v1');
});
test('public extension catalog exposes the standalone editor without unsafe automatic script execution',()=>{
 const items=JSON.parse(readFileSync(new URL('../extensions/catalog.json',import.meta.url),'utf8')).items;
 const item=items.find(i=>i.id==='warlike-gaia-terrain');
 assert.ok(item);assert.equal(item.status,'module');assert.equal(item.toolUrl,'./terrain-generator.html');
 const html=readFileSync(new URL('../terrain-generator.html',import.meta.url),'utf8');
 assert.match(html,/exportTerrainGLB/);assert.match(html,/exportTerrainRecipe/);assert.match(html,/heightmapPixels/);
 const shelf=readFileSync(new URL('../extensions.html',import.meta.url),'utf8');
 assert.match(shelf,/Ouvrir le générateur/);
});
