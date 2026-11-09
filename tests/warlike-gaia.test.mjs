import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BIOMES,TERRAIN_LAYERS,applyTerrainBrush,ensureTerrainLayers,colorForTerrainPoint,normalizeConfig,generateHeightmap,scatterAssets,exportTerrainGLB,exportTerrainRecipe,heightmapPixels,previewPixels} from '../extensions/warlike-gaia.js';

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
 assert.equal(20+len+8+view.getUint32(20+len,true),bytes.length);
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

test('terrain raise/lower/smooth/flatten brushes affect local heights only',()=>{
 const t=generateHeightmap({resolution:33,seed:101});
 const before=t.heights.slice(),center=16*33+16;
 assert.ok(applyTerrainBrush(t,{mode:'raise',u:.5,v:.5,radius:.15,strength:1})>0);
 assert.ok(t.heights[center]>before[center]);
 assert.equal(t.heights[0],before[0]);
 const raised=t.heights[center];
 applyTerrainBrush(t,{mode:'lower',u:.5,v:.5,radius:.15,strength:1});
 assert.ok(t.heights[center]<raised);
 applyTerrainBrush(t,{mode:'flatten',u:.5,v:.5,radius:.15,strength:1,target:.8});
 assert.ok(t.heights[center]>.7);
 applyTerrainBrush(t,{mode:'smooth',u:.5,v:.5,radius:.18,strength:1});
 assert.ok(t.heights.every(h=>h>=0&&h<=1));
});
test('terrain layer brush paints normalized colors, preserves reproducible exports',()=>{
 const t=generateHeightmap({resolution:17,seed:12});
 assert.equal(TERRAIN_LAYERS.length,5);
 const weights=ensureTerrainLayers(t),center=8*17+8;
 const before=colorForTerrainPoint(t,center);
 assert.ok(applyTerrainBrush(t,{mode:'paint',layer:'snow',u:.5,v:.5,radius:.2,strength:1})>0);
 const sum=Array.from(weights.slice(center*5,center*5+5)).reduce((a,b)=>a+b,0);
 assert.ok(Math.abs(sum-1)<1e-5);
 assert.notDeepEqual(colorForTerrainPoint(t,center),before);
 assert.equal(applyTerrainBrush(t,{mode:'paint',layer:'snow',u:-1,v:.5}),0);
 assert.throws(()=>applyTerrainBrush(t,{mode:'paint',layer:'unknown',u:.5,v:.5}),/inconnue/);
 const doc=exportTerrainRecipe(t);
 assert.equal(doc.version,2);
 assert.equal(doc.layerWeights.length,t.heights.length*5);
 assert.equal(doc.heightValues.length,t.heights.length);
 const bytes=exportTerrainGLB(t),jsonSize=new DataView(bytes.buffer).getUint32(12,true);
 const gltf=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+jsonSize)).trim());
 assert.ok(gltf.meshes[0].primitives[0].attributes.COLOR_0>=0);
});
test('terrain studio exposes interactive brushes, layers and undo/redo',()=>{
 const html=readFileSync(new URL('../terrain-generator.html',import.meta.url),'utf8');
 for(const expected of ['data-tool="raise"','data-tool="lower"','data-tool="smooth"','data-tool="flatten"','data-tool="paint"','id="layers"','id="undo"','id="redo"','pointerdown','pointermove'])assert.ok(html.includes(expected),expected);
});
