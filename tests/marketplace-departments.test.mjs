import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const content=path=>readFileSync(fileURLToPath(new URL('../'+path,import.meta.url)),'utf8');
const departments=['index.html','2d.html','media.html','vfx.html','asset-tools.html','prefabs.html','extensions.html'];
test('all marketplace departments link to an accessible VFX and extensions shelf',()=>{
 for(const page of departments){const html=content(page);
  assert.match(html,/href="\.\/vfx\.html"/,page+' missing VFX navigation');
  assert.match(html,/href="\.\/extensions\.html"/,page+' missing extensions navigation');
 }
});
test('existing 2D audio prefab and extension data paths remain intact',()=>{
 assert.match(content('2d.html'),/id="grid"/);
 assert.match(content('media.html'),/data-type="audio"/);
 assert.match(content('prefabs.html'),/installBundledPrefab/);
 assert.match(content('extensions.html'),/extensions\/catalog\.json/);
});
test('VFX shelf links to actual extension catalogue and states module limitations',()=>{
 const html=content('vfx.html');
 assert.match(html,/fetch\('\.\/extensions\/catalog\.json'/);
 assert.match(html,/Module à intégrer/);
 assert.doesNotMatch(html,/fake-rating|fake-discount|unity-assetstore-cdn/);
});
