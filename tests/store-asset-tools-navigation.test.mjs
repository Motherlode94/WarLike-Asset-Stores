import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all three asset tool destinations are accessible from the single Store hub',()=>{
 const hub=page('asset-tools.html');
 for(const route of ['asset-qa.html','3d-departments.html?section=animations','extensions.html'])assert.ok(hub.includes('href="./'+route+'"'),route);
});
test('Store homepage exposes Tools and Extensions departments without direct QA duplication',()=>{
 const home=page('index.html');
 assert.equal([...home.matchAll(/href="\.\/asset-tools\.html"/g)].length,2);
 assert.equal([...home.matchAll(/href="\.\/asset-qa\.html"/g)].length,0);
 assert.equal([...home.matchAll(/href="\.\/extensions\.html"/g)].length,1);
});
test('Store asset QA, animation departments, and extensions have common back navigation',()=>{
 for(const p of ['asset-qa.html','3d-departments.html','extensions.html'])assert.ok(page(p).includes('href="./asset-tools.html"'),p);
});
