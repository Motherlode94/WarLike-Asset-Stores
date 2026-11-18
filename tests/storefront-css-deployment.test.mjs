import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=path=>readFileSync(fileURLToPath(new URL('../'+path,import.meta.url)),'utf8');
test('production build copies root-level marketplace CSS files',()=>{
 const build=read('scripts/build-store.mjs');
 assert.match(build,/html\|js\|css/);
 for(const path of ['storefront-marketplace.css','marketplace-departments.css']){
  assert.equal(existsSync(fileURLToPath(new URL('../'+path,import.meta.url))),true,path);
 }
});
test('real collection cards are styled as a responsive grid with contained text',()=>{
 const homepage=read('index.html'),css=read('storefront-marketplace.css');
 assert.match(homepage,/href="\.\/storefront-marketplace\.css\?v=1"/);
 assert.match(homepage,/className='market-rail'/);
 assert.match(css,/\.market-rail\{display:grid/);
 assert.match(css,/\.market-item-body\{padding:/);
 assert.match(css,/\.market-name\{[^}]*overflow:hidden/);
 assert.match(css,/\.market-item img\{[^}]*object-fit:contain/);
});
test('department stylesheets are linked from all department pages',()=>{
 for(const file of ['2d.html','media.html','asset-tools.html','prefabs.html','extensions.html','vfx.html']){
  assert.match(read(file),/marketplace-departments\.css/,file);
 }
});
