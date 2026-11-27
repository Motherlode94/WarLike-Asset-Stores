import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('VFX shelf never imports Animation, Compositing, Montage or Video categories',()=>{
 const html=read('vfx.html');
 assert.match(html,/const categories=new Set\(\['VFX'\]\)/);
 assert.doesNotMatch(html,/new Set\(\['Compositing','Animation'/);
 assert.match(html,/Aucun module VFX natif disponible/);
});
test('Animation shelf reads only Animation extensions',()=>{
 const html=read('animation.html');
 assert.match(html,/const categories=new Set\(\['Animation'\]\)/);
 assert.match(html,/aria-current="page">Animation/);
});
test('department navigation and extensions taxonomy distinguish VFX and Animation',()=>{
 for(const path of ['index.html','extensions.html','2d.html','media.html','asset-tools.html','prefabs.html']){
  const html=read(path);
  assert.match(html,/href="\.\/vfx\.html"/,path);
  assert.match(html,/href="\.\/animation\.html"/,path);
 }
 const catalog=JSON.parse(read('extensions/catalog.json'));
 const groups=new Set(catalog.items.map(x=>x.category));
 assert.ok(groups.has('Animation'));
 assert.ok(groups.has('Compositing'));
 assert.ok(!groups.has('VFX'),'Do not claim native VFX inventory when none is provided');
});
