import {sendToLibrary,addedAssetIds} from './library-client.js';
export function spritePrefab(asset){return {name:asset.name,mode:'2d',components:{transform:{position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]},renderer:{visible:true,castShadow:false},collider:{enabled:asset.category!=='UI',shape:'box',isTrigger:false}}}}
export function installSpritePrefab(asset){return sendToLibrary(asset,{preset:spritePrefab(asset)})}
export function installed2dIds(){return addedAssetIds()}
