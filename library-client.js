import {packageGlb,imageResource} from './glb-package.js';
export const LIBRARY_ORIGIN='https://warlike-library.pages.dev';
export const STORE_ORIGIN='https://warlike-asset-stores.pages.dev';
const KEY='warlike.store.library-receipts.v1',MAX=25*1024*1024;
export function libraryReceipts(storage=globalThis.localStorage){try{const x=JSON.parse(storage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}}
export function addedAssetIds(storage=globalThis.localStorage){return new Set(Object.keys(libraryReceipts(storage)))}
export function rememberReceipt(assetId,receipt,storage=globalThis.localStorage){const rows=libraryReceipts(storage);rows[assetId]={resourceId:receipt.resourceId,sha256:receipt.sha256,addedAt:new Date().toISOString()};storage.setItem(KEY,JSON.stringify(rows));}
export function acceptedReply(event,{receiver,channel}){return event.origin===LIBRARY_ORIGIN&&event.source===receiver&&event.data?.channel===channel;}
export function assetURL(path,origin=location.origin){const url=new URL(path,origin+'/');if(url.origin!==origin||url.username||url.password||!url.pathname.startsWith('/assets/free/')||/%2f|%5c|%2e/i.test(url.pathname))throw Error('Source du store non autorisée.');return url.href;}
const base64=bytes=>{let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(raw)};
export async function prepareLibraryAsset(asset,{preset=null,fetcher=fetch,origin=location.origin}={}){
 if(!asset||typeof asset.id!=='string'||typeof asset.name!=='string')throw Error('Asset du catalogue requis.');
 const url=assetURL(asset.url||asset.spriteUrl,origin),response=await fetcher(url,{credentials:'same-origin'});
 if(!response.ok)throw Error('Asset indisponible : HTTP '+response.status);
 if(Number(response.headers.get('content-length'))>MAX)throw Error('Asset supérieur à 25 Mo.');
 let bytes=await response.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>MAX)throw Error('Taille du fichier invalide.');
 const filename=decodeURIComponent(new URL(url).pathname.split('/').at(-1)),ext=filename.split('.').at(-1).toLowerCase();
 if(!['glb','png','webp','jpg','jpeg','ogg','wav'].includes(ext))throw Error('Format du catalogue non pris en charge.');
 if(ext==='glb')bytes=await packageGlb(bytes,async uri=>{
  if(/^data:image\/(png|jpeg|webp);base64,/i.test(uri))return imageResource(await fetcher(uri));
  const texture=assetURL(new URL(uri,url).href,origin);return imageResource(await fetcher(texture,{credentials:'same-origin'}));
 });
 if(bytes.byteLength>MAX)throw Error('Le modèle et ses textures dépassent 25 Mo.');
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 return {schema:'warlike.store.asset.v1',version:1,asset:{id:asset.id,name:asset.name.slice(0,160),filename,author:String(asset.author||'Kenney').slice(0,100),license:String(asset.license||'Licence non précisée').slice(0,100),sourceUrl:asset.source||asset.sourceUrl||'',providerUrl:url,collection:asset.category||'Store',pack:asset.pack||'',width:asset.width||0,height:asset.height||0,thumbnail:asset.thumb||asset.thumbnailUrl||null,frames:asset.frames||null},binary:{encoding:'base64',data:base64(new Uint8Array(bytes)),byteLength:bytes.byteLength,sha256},preset};
}
export async function sendToLibrary(asset,{preset=null}={}){
 const channel=Array.from(crypto.getRandomValues(new Uint8Array(20)),b=>b.toString(16).padStart(2,'0')).join('');
 const receiver=window.open(LIBRARY_ORIGIN+'/store-import.html?storeTransfer='+channel,'_blank');
 if(!receiver)throw Error('La fenêtre Library est bloquée. Autorise son ouverture puis réessaie.');
 return new Promise((resolve,reject)=>{
  let payload=null,sent=false,finished=false,ready=false;
  const cleanup=()=>{finished=true;window.removeEventListener('message',onMessage);clearInterval(ping);clearTimeout(timeout)};
  const fail=e=>{cleanup();reject(e instanceof Error?e:Error(String(e)))};
  const send=()=>{if(ready&&payload&&!sent&&!finished){sent=true;receiver.postMessage({type:'warlike-store-asset-v1',channel,pack:payload},LIBRARY_ORIGIN)}};
  const onMessage=event=>{
   if(!acceptedReply(event,{receiver,channel})||finished)return;
   if(event.data.type==='warlike-library-store-ready-v1'){ready=true;send()}
   if(event.data.type==='warlike-library-store-saved-v1'){
    if(!sent||!payload)return;
    if(!event.data.ok)return fail(Error('Library : '+String(event.data.error||'Import refusé')));
    if(event.data.sha256!==payload.binary.sha256||typeof event.data.resourceId!=='string')return fail(Error('Accusé de réception Library invalide.'));
    try{rememberReceipt(asset.id,event.data)}catch{}
    cleanup();resolve({installed:true,resourceId:event.data.resourceId,sha256:event.data.sha256,prefabId:event.data.prefabId||null,warning:event.data.warning||null});
   }
  };
  window.addEventListener('message',onMessage);
  const ping=setInterval(()=>{if(receiver.closed)return fail(Error('La fenêtre Library a été fermée.'));if(!sent)receiver.postMessage({type:'warlike-store-ping-v1',channel},LIBRARY_ORIGIN)},700);
  const timeout=setTimeout(()=>fail(Error('Library ne répond pas. Vérifie son onglet puis réessaie.')),90000);
  prepareLibraryAsset(asset,{preset}).then(pack=>{if(finished)return;payload=pack;send()}).catch(fail);
 });
}
export async function downloadForLibrary(asset,{preset=null}={}){const pack=await prepareLibraryAsset(asset,{preset});const url=URL.createObjectURL(new Blob([JSON.stringify(pack)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=asset.id+'.wlasset.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
