import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../terrain-generator.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../css/gaia-workspace.css',import.meta.url),'utf8');
test('Gaia presents world, view and tool areas together',()=>{
 for(const name of ['gaia-world-panel','gaia-view-panel','gaia-tools-panel','gaia-workspace'])assert.match(html,new RegExp(name));
 assert.match(css,/grid-template-columns:.*minmax/);
 assert.match(html,/gaia-workspace\.css/);
});
test('tile chooser and generation controls are always available in right panel',()=>{
 for(const id of ['gaiaTilesQuick','gaiaTilePicker','tileCount','makeTiles','exportTiles','exportWorld'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/tilesQuick\.append\(tileSelect,\$\('makeTiles'\),\$\('exportTiles'\),\$\('exportWorld'\)\)/);
 assert.match(html,/renderGaiaTilePicker\(\)/);
});
test('sculpt, layers and advanced tools have unique editable sections',()=>{
 for(const name of ['sculpt','layers','advanced']){
  assert.match(html,new RegExp('data-gaia-pane="'+name+'"'));
  assert.match(html,new RegExp('data-gaia-section="'+name+'"'));
 }
 for(const id of ['layers','tools','undo','redo','radius','strength','noiseOctaves','tileCount','preview']){
  const matches=[...html.matchAll(new RegExp('id="'+id+'"','g'))];
  assert.equal(matches.length,1,id+' is unique');
 }
 assert.match(css,/\[hidden\]\{display:none!important\}/);
});
test('preview of individual tiles does not edit the underlying base terrain',()=>{
 assert.match(html,/previewTileIndex!==null/);
 assert.match(html,/previewPixels\(tile\.terrain\)/);
 assert.match(html,/previewPixels\(current\)/);
});
