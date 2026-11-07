import test from 'node:test';
import assert from 'node:assert/strict';
import {assetVariantInfo,relatedAssetVariants,preferTexturedVariants} from '../asset-variants.js';
const asset=(suffix)=>({id:'quaternius-ultimatetexturedbuildings-1story'+suffix,author:'Quaternius',pack:'ultimatetexturedbuildings'});
test('distinguishes roof geometry, base meshes and authored material variants',()=>{
 const cases=[
  ['', 'Bâtiment standard','Version standard'],
  ['-base','Bâtiment standard','Version de base'],
  ['-gableroof','Toit à pignon','Version standard'],
  ['-gableroof-base','Toit à pignon','Version de base'],
  ['-gableroof-mat','Toit à pignon','Version avec matériaux'],
  ['-roundroof','Toit arrondi','Version standard'],
  ['-roundroof-mat','Toit arrondi','Version avec matériaux'],
  ['-sign','Avec enseigne','Version standard']
 ];
 for(const [suffix,shape,finish] of cases){
  const info=assetVariantInfo(asset(suffix));
  assert.equal(info.shape,shape);assert.equal(info.finish,finish);
  assert.equal(info.key,assetVariantInfo(asset('')).key);
 }
});
test('related variants stay within one asset family, author and original pack',()=>{
 const base=asset(''),related=[asset('-base'),asset('-gableroof'),asset('-roundroof-mat')];
 const unrelated={...asset('-sign'),pack:'different-pack'};
 assert.deepEqual(relatedAssetVariants(base,[base,...related,unrelated]).map(x=>x.id),related.map(x=>x.id));
 assert.equal(assetVariantInfo({id:'kenney-house'}),null);
});

test('catalog prioritizes textured assets without hiding untextured shapes or originals from searches',()=>{
 const models=[asset('-roundroof-base'),asset('-roundroof-mat'),asset('-sign-base'),asset('-sign-mat'),asset('-gableroof-base'),{id:'kenney-tree',author:'Kenney',pack:'trees'}];
 const preferred=preferTexturedVariants(models,models);
 assert.deepEqual(preferred.map(x=>x.id),[models[1].id,models[3].id,models[4].id,models[5].id]);
 assert.equal(models.length,6,'Original GLB variants remain available');
});
