import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {libraryBuiltins,safeLibraryResourcePath,loadLibraryBuiltins} from '../library-builtins.js';
test('only builtin Library assets with safe paths are mirrored as installed',()=>{
 const input=[
  {id:'builtin-1',name:'Soldat',kind:'model',url:'./assets/soldier.glb',thumbnail:'./assets/preview.png'},
  {id:'custom-42',name:'Personal',kind:'image',url:'./assets/personal.png'},
  {id:'builtin-bad',name:'Unsafe',kind:'model',url:'../private/passwords.txt'},
  {id:'builtin-script',name:'Rotation',kind:'script',url:'./assets/Rotation.wls'}
 ];
 const list=libraryBuiltins(input);
 assert.equal(list.length,2);assert.ok(list.every(a=>a.installed&&a.installation==='builtin-library'));
 assert.equal(list[0].downloadUrl,'https://warlike-library.pages.dev/assets/soldier.glb');
 assert.equal(list[0].imageUrl,'https://warlike-library.pages.dev/assets/preview.png');
 assert.equal(list[1].kind,'script');
});
test('Library link validation blocks remote URLs, traversal and unsupported extensions',()=>{
 assert.equal(safeLibraryResourcePath('https://bad.example/hack.glb'),null);
 assert.equal(safeLibraryResourcePath('./assets/../secret.glb'),null);
 assert.equal(safeLibraryResourcePath('./assets/a.exe'),null);
 assert.ok(safeLibraryResourcePath('./assets/kenney/prop.glb'));
});
test('Store reads the public Library manifest without credentials',async()=>{
 let request;const result=await loadLibraryBuiltins({fetcher:async (url,init)=>{request={url:String(url),init};return {ok:true,json:async()=>[{id:'builtin-1',name:'Sound',kind:'audio',url:'./assets/click_001.ogg'}]}}});
 assert.equal(result.length,1);assert.equal(request.url,'https://warlike-library.pages.dev/assets/catalog.json');
 assert.equal(request.init.credentials,'omit');
});
test('Store exposes preinstalled Library shelf from 2D and 3D catalogs',async()=>{
 for(const name of ['index.html','2d.html'])assert.match(await readFile(new URL('../'+name,import.meta.url),'utf8'),/library-installed\.html/);
 const page=await readFile(new URL('../library-installed.html',import.meta.url),'utf8');
 assert.match(page,/Déjà installé/);
 assert.match(page,/loadLibraryBuiltins/);
});
