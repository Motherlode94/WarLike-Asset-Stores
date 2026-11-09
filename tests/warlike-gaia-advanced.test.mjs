import test from 'node:test';
import assert from 'node:assert/strict';
import {generateHeightmap} from '../extensions/warlike-gaia.js';
import {advancedNoise,applyAdvancedNoise,erodeThermal,erodeHydraulic,generateTerrainTiles,sampleTerrainHeight,terrainCollisionDescriptor,exportWorldRecipe} from '../extensions/warlike-gaia-advanced.js';
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
test('advanced noise supports deterministic octave, ridge and warp controls',()=>{
 const options={seed:404,frequency:5,octaves:6,gain:.58,warp:.9,ridge:.75};
 assert.equal(advancedNoise(.38,.77,options),advancedNoise(.38,.77,options));
 assert.notEqual(advancedNoise(.38,.77,options),advancedNoise(.38,.77,{...options,seed:405}));
 const source=generateHeightmap({seed:42,resolution:33}),modified=applyAdvancedNoise(source,{...options,amount:.8});
 assert.notDeepEqual([...source.heights],[...modified.heights]);
 assert.ok(modified.heights.every(h=>Number.isFinite(h)&&h>=0&&h<=1));
 assert.deepEqual([...source.heights],[...generateHeightmap({seed:42,resolution:33}).heights]);
});
test('erosion changes terrain predictably without destroying original',()=>{
 const source=generateHeightmap({seed:9,biome:'mountains',resolution:33});
 const thermal=erodeThermal(source,{iterations:16}),hydraulic=erodeHydraulic(source,{iterations:16});
 assert.notDeepEqual([...source.heights],[...thermal.heights]);
 assert.notDeepEqual([...source.heights],[...hydraulic.heights]);
 assert.deepEqual([...thermal.heights],[...erodeThermal(source,{iterations:16}).heights]);
 assert.deepEqual([...hydraulic.heights],[...erodeHydraulic(source,{iterations:16}).heights]);
 assert.ok(thermal.heights.every(h=>h>=0&&h<=1&&Number.isFinite(h)));
 assert.ok(hydraulic.heights.every(h=>h>=0&&h<=1&&Number.isFinite(h)));
 assert.ok(Math.abs(mean(thermal.heights)-mean(source.heights))<.01);
});
test('adjacent tiles have identical samples on touching borders',()=>{
 const world=generateTerrainTiles({seed:12,resolution:33,size:128,biome:'forest'},{tiles:3});
 assert.equal(world.tiles.length,9);
 assert.equal(world.worldResolution,97);
 const n=world.config.resolution;
 for(let z=0;z<3;z++)for(let x=0;x<3;x++){
  const a=world.tiles[z*3+x];
  if(x<2){const b=world.tiles[z*3+x+1];for(let i=0;i<n;i++)assert.equal(a.terrain.heights[i*n+n-1],b.terrain.heights[i*n]);}
  if(z<2){const b=world.tiles[(z+1)*3+x];for(let i=0;i<n;i++)assert.equal(a.terrain.heights[(n-1)*n+i],b.terrain.heights[i]);}
 }
});
test('heightfield collision descriptor resolves slopes and tile offsets',()=>{
 const world=generateTerrainTiles({seed:25,resolution:17,size:64},{tiles:2});
 const left=world.tiles[0],right=world.tiles[1];
 const a=terrainCollisionDescriptor(left.terrain,{offsetX:left.offsetX,offsetZ:left.offsetZ});
 const b=terrainCollisionDescriptor(right.terrain,{offsetX:right.offsetX,offsetZ:right.offsetZ});
 assert.equal(a.schema,'warlike.terrain.heightfield.v1');
 assert.equal(sampleTerrainHeight(a,10000,0),null);
 const seamX=left.offsetX+left.terrain.config.size/2;
 const sharedZ=left.offsetZ;
 assert.ok(Math.abs(sampleTerrainHeight(a,seamX,sharedZ)-sampleTerrainHeight(b,seamX,sharedZ))<1e-5);
 const recipe=exportWorldRecipe(world);assert.equal(recipe.tiles.length,4);
 assert.equal(recipe.tiles[0].collision.heights.length,17*17);
});
test('Gaia interface exposes erosion and export of adjacent tiles',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../terrain-generator.html',import.meta.url),'utf8');
 for(const id of ['applyNoise','thermal','hydraulic','makeTiles','exportTiles','exportWorld'])assert.ok(html.includes('id="'+id+'"'));
});
