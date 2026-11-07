import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {prepareLibraryAsset,assetURL,acceptedReply,LIBRARY_ORIGIN,STORE_ORIGIN,rememberReceipt,addedAssetIds} from '../library-client.js';
import {glb,png} from './fixture.mjs';
const asset={id:'test-model',name:'Model',url:STORE_ORIGIN+'/assets/free/kenney/test/model.glb',author:'Kenney',license:'CC0-1.0',category:'Objets'};
test('provider transfers real GLB bytes with embedded texture dependencies, provenance and SHA',async()=>{
 const requests=[];const pack=await prepareLibraryAsset(asset,{origin:STORE_ORIGIN,fetcher:async url=>{requests.push(url);return new Response(url.endsWith('.png')?png:glb(true),{headers:{'content-type':url.endsWith('.png')?'image/png':'model/gltf-binary'}})}});
 assert.equal(pack.schema,'warlike.store.asset.v1');assert.equal(pack.asset.author,'Kenney');assert.equal(pack.asset.license,'CC0-1.0');assert.equal(pack.asset.providerUrl,asset.url);assert.match(pack.binary.sha256,/^[a-f0-9]{64}$/);
 const data=Buffer.from(pack.binary.data,'base64'),n=data.readUInt32LE(12),doc=JSON.parse(data.subarray(20,20+n).toString());assert.equal(doc.images[0].uri,undefined);assert.equal(doc.images[0].mimeType,'image/png');assert.ok(doc.images[0].bufferView>=0);assert.ok(requests.includes(STORE_ORIGIN+'/assets/free/textures/palette.png'));
});
test('provider rejects third-party asset URLs and mismatched Library replies',()=>{
 assert.throws(()=>assetURL('https://warlike-engine.pages.dev/assets/free/x.glb',STORE_ORIGIN));assert.throws(()=>assetURL('/private/file.glb',STORE_ORIGIN));
 const receiver={},channel='a'.repeat(40),event={source:receiver,origin:LIBRARY_ORIGIN,data:{channel}};assert.ok(acceptedReply(event,{receiver,channel}));assert.ok(!acceptedReply({...event,origin:'https://untrusted.invalid'},{receiver,channel}));assert.ok(!acceptedReply({...event,source:{}},{receiver,channel}));assert.ok(!acceptedReply(event,{receiver,channel:'b'.repeat(40)}));
});
test('only Library delivery receipts mark an asset as sent, without writing Engine state',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};assert.equal(addedAssetIds(storage).size,0);rememberReceipt(asset.id,{resourceId:'store-123',sha256:'a'.repeat(64)},storage);assert.ok(addedAssetIds(storage).has(asset.id));assert.equal(map.size,1);assert.ok(![...map.keys()].some(k=>/prefabs|engine|local-assets/.test(k)));
});
test('independent UI keeps five desktop columns and the approved search/filter toolbar',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('repeat(5,minmax(0,1fr))'));for(const id of ['search','authorFilter','genreFilter','utilityFilter','packFilter','sort'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('Ajouter à Library'));assert.ok(!html.includes('warlike-local-assets-v1'));assert.ok(!html.includes("indexedDB.open"));
 for(const file of readdirSync(new URL('../',import.meta.url)).filter(f=>f.endsWith('.js'))){const code=readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.ok(!/from ['"]\.\.\/js\//.test(code),file);}
});
