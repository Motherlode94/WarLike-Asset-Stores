// Only built-in public resources are listed: personal IndexedDB files are private to Library.
export const LIBRARY_BASE='https://warlike-library.pages.dev/';
const KNOWN_KINDS=new Set(['model','image','audio','video','script','document','animation']);
export function safeLibraryResourcePath(path){
 if(typeof path!=='string'||path.includes('..')||path.includes('\\')||!/^\.\/assets\/(?:[a-z0-9_.-]+\/)*[a-z0-9_. -]+\.(glb|gltf|svg|png|jpg|jpeg|webp|ogg|wav|js|wls|ts|cs|py|cpp|h|md|txt|json)$/i.test(path))return null;
 return new URL(path,LIBRARY_BASE).href;
}
export function libraryBuiltins(items){
 if(!Array.isArray(items))throw Error('Le catalogue public Library est invalide.');
 return items.filter(a=>a&&typeof a.id==='string'&&a.id.startsWith('builtin-')&&typeof a.name==='string'&&KNOWN_KINDS.has(a.kind))
  .map(a=>({...a,downloadUrl:safeLibraryResourcePath(a.url),imageUrl:safeLibraryResourcePath(a.thumbnail),installed:true,installation:'builtin-library'}))
  .filter(a=>a.downloadUrl);
}
export async function loadLibraryBuiltins({fetcher=fetch}={}){
 const response=await fetcher(new URL('assets/catalog.json',LIBRARY_BASE),{mode:'cors',credentials:'omit'});
 if(!response.ok)throw Error('Library HTTP '+response.status);
 return libraryBuiltins(await response.json());
}
