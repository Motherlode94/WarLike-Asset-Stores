import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('catalog card contrast sheet loads after unified theme tokens',()=>{
 const html=read('index.html');
 assert.ok(html.indexOf('warlike-palette-v2.css')<html.indexOf('storefront-card-contrast.css'));
 const css=read('storefront-card-contrast.css');
 for(const token of ['--wl-surface','--wl-fg','--wl-fg-muted','--wl-accent','--wl-accent-contrast'])assert.ok(css.includes(token),token);
 assert.match(css,/#cards \.card \.content/);
 assert.match(css,/\.btn\.primary/);
 assert.doesNotMatch(css,/img\s*\{|canvas\s*\{/);
});
