import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('page ships the viewport and navigation containment fix',()=>{
 assert.ok(read('index.html').includes('storefront-layout-fix.css'));
 const style=read('storefront-layout-fix.css');
 assert.match(style,/@media\(max-width:/);
 assert.match(style,/overflow/);
});
