import {mkdir,readdir,copyFile,link,rm,access} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'dist');
const assets=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'assets/free');
await access(path.join(assets,'kenney/models.json'));await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const e of await readdir(root,{withFileTypes:true}))if(e.isFile()&&(/\.(html|js)$/.test(e.name)||e.name==='_headers'))await copyFile(path.join(root,e.name),path.join(out,e.name));
async function copy(source,target){await mkdir(target,{recursive:true});for(const e of await readdir(source,{withFileTypes:true})){const a=path.join(source,e.name),b=path.join(target,e.name);if(e.isDirectory())await copy(a,b);else if(e.isFile()){try{await link(a,b)}catch{await copyFile(a,b)}}}}
await copy(assets,path.join(out,'assets/free'));
await copy(path.join(root,'extensions'),path.join(out,'extensions'));console.log('Independent Store built: own catalog and files, no Engine runtime imports.');
