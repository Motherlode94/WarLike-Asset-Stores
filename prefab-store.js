// Store presets are neutral Library configurations; only Library installs into Engine.
import {sendToLibrary,addedAssetIds} from './library-client.js';
export function prefabFromBundledAsset(asset,options={}){
 if(!asset?.bundled)throw Error('Asset du catalogue requis.');
 const scale=Number.isFinite(options.scale)?Math.min(4,Math.max(.25,options.scale)):1;
 return {name:asset.name,mode:'3d',components:{transform:{position:[0,0,0],rotation:[0,0,0],scale:[scale,scale,scale]},renderer:{visible:true,castShadow:true},collider:{enabled:typeof options.collision==='boolean'?options.collision:asset.category!=='Nature',shape:'box',isTrigger:false}}};
}
export function installBundledPrefab(asset,_storage,options={}){return sendToLibrary(asset,{preset:prefabFromBundledAsset(asset,options)})}
export function installedPrefabIds(){return addedAssetIds()}
