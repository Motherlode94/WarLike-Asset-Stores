// Original procedural low-poly starter assets for genre-focused WarLike games.
// Generates real, independent GLB meshes and SVG catalog thumbnails; CC0-1.0.
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'assets/free/warlike-genre-packs');
export const genrePacks=[
 {id:'tactical',title:'Guerre moderne / RTS',genres:['tactical','rts','battlefield','company'],color:'#667d66',items:[['Poste de commandement','building'],['Abri de terrain','building'],['Bloc de couverture','barrier'],['Tour de surveillance','tower'],['Caisses logistiques','crates'],['Camion de ravitaillement','vehicle'],['Antenne de communication','tower'],['Barricade tactique','barrier']]},
 {id:'strategy',title:'Stratégie / Tour par tour',genres:['rts','tactical','fourx'],color:'#b28d62',items:[['Hôtel de ville','building'],['Caserne','building'],['Mine de ressources','building'],['Tour défensive','tower'],['Entrepôt','building'],['Portail de forteresse','arch'],['Campement','building'],['Coffre de ressources','crates']]},
 {id:'simulation',title:'Simulation / Restaurant / Ville',genres:['simulation','rp','lifesim','openworld'],color:'#c78465',items:[['Stand de restauration','stall'],['Comptoir de caisse','counter'],['Table de préparation','counter'],['Grill de rue','counter'],['Étal de marché','stall'],['Abri bus','building'],['Distributeur automatique','machine'],['Banc public','bench']]},
 {id:'horror',title:'Horreur / Enquête',genres:['horror','adventure','survival'],color:'#796d8c',items:[['Porte de cave','door'],['Armoire abandonnée','machine'],['Lampe de couloir','lamp'],['Table d investigation','counter'],['Cercueil fermé','crates'],['Portail de cimetière','arch'],['Générateur vétuste','machine'],['Barrière abandonnée','barrier']]},
 {id:'survival',title:'Survie / Nature',genres:['survival','openworld','adventure'],color:'#65a075',items:[['Abri improvisé','building'],['Feu de camp','lamp'],['Réserve de bois','crates'],['Rocher exploitable','rock'],['Arbre feuillu','tree'],['Arbre sec','tree'],['Station de purification','machine'],['Atelier de survie','counter']]},
 {id:'rpg',title:'RPG / Fantaisie',genres:['rpg','adventure','fourx'],color:'#8a7ab4',items:[['Autel ancien','tower'],['Coffre de quête','crates'],['Porte runique','arch'],['Petite forge','stall'],['Tour de mage','tower'],['Pont de pierre','bridge'],['Étal alchimique','stall'],['Cristal magique','crystal']]},
 {id:'arcade',title:'Arcade / Plateforme',genres:['arcade','platformer','adventure'],color:'#ea9c65',items:[['Plateforme mobile','platform'],['Tremplin','platform'],['Porte de niveau','arch'],['Borne arcade','machine'],['Obstacle rotatif','barrier'],['Caisse rebondissante','crates'],['Checkpoint','tower'],['Récompense étoilée','crystal']]},
 {id:'racing',title:'Course / Transport',genres:['racing','openworld','simulation'],color:'#65a5c3',items:[['Voiture compacte','vehicle'],['Kart arcade','vehicle'],['Camionnette','vehicle'],['Bus stylisé','vehicle'],['Barrière de piste','barrier'],['Garage de réparation','building'],['Portique de départ','arch'],['Station carburant','machine']]},
 {id:'scifi',title:'Science-fiction / Colonie',genres:['scifi','fourx','survival','simulation'],color:'#66a8aa',items:[['Module habitat','building'],['Centre de contrôle','building'],['Panneau solaire','platform'],['Tour radar','tower'],['Rover explorateur','vehicle'],['Caisse spatiale','crates'],['Extracteur minier','machine'],['Portail de sas','arch']]},
 {id:'farm',title:'Agriculture / Construction',genres:['simulation','farm','construction','lifesim'],color:'#a9a168',items:[['Grange','building'],['Serre agricole','building'],['Tracteur compact','vehicle'],['Botte de foin','crates'],['Citerne à eau','machine'],['Clôture rurale','barrier'],['Établi chantier','counter'],['Tour de stockage','tower']]},
 {id:'detective',title:'Policier / Mystère',genres:['detective','adventure','rp'],color:'#6f86a9',items:[['Bureau enquête','counter'],['Armoire dossiers','machine'],['Lampe de bureau','lamp'],['Portique sécurité','arch'],['Banc salle attente','bench'],['Camionnette police fictive','vehicle'],['Terminal données','machine'],['Table preuves','counter']]}
];
const palettes={
 ground:[.16,.20,.25,1],black:[.13,.15,.2,1],metal:[.41,.46,.51,1],white:[.87,.85,.77,1],glass:[.39,.71,.85,1],orange:[.97,.57,.29,1],wood:[.49,.32,.23,1],leaves:[.28,.58,.35,1],red:[.76,.23,.24,1],yellow:[.96,.76,.29,1]
};
function hex(h){return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255,1]}
function components(kind,tint,variant){
 const body=['body',0,.55,0,1.8,1.1,1.4],roof=['dark',0,1.25,0,2.1,.19,1.65];
 const a=[];const b=(mat,x,y,z,w,h,d,yaw=0)=>a.push({mat,x,y,z,w,h,d,yaw});const tweak=(variant%4)*.12;
 switch(kind){
 case 'building':b('body',0,.55,0,1.8+tweak,1.1,1.4);b('dark',0,1.2,0,2.05+tweak,.22,1.6);b('glass',0,.7,.72,.56,.48,.06);b('wood',-.65,.38,.72,.33,.75,.05);break;
 case 'vehicle':b('body',0,.52,0,1.35,.47,2.2+tweak);b('glass',0,.93,-.16,1.05,.48,1.04);for(let x of [-.74,.74])for(let z of [-.67,.67])b('black',x,.25,z,.28,.45,.46);b('metal',0,.52,1.15,1.2,.24,.14);break;
 case 'tower':b('body',0,.85,0,.85,1.7+tweak,.85);b('dark',0,1.75+tweak,0,1.3,.25,1.3);b('glass',0,1.55, .45,.55,.25,.08);break;
 case 'arch':b('body',-.85,.98,0,.3,1.95,.45);b('body',.85,.98,0,.3,1.95,.45);b('dark',0,2.01,0,2.1,.25,.5);break;
 case 'barrier':b('body',0,.47,0,2.25,.85,.25);b('yellow',0,.77,.14,2.05,.12,.04);b('metal',-.89,.18,0,.2,.35,.55);b('metal',.89,.18,0,.2,.35,.55);break;
 case 'crates':b('wood',-.32,.4,0,.72,.8,.74);b('body',.49,.3,.13,.72,.6,.72);b('metal',.15,.88,0,.66,.26,.67);break;
 case 'stall':b('wood',0,.58,.12,2.2,.25,1.25);for(let x of [-.89,.89])b('metal',x,1.32,-.36,.12,2.4,.12);b('body',0,2.36,-.23,2.5,.2,1.55);b('orange',0,2.25,.54,2.5,.16,.13);break;
 case 'counter':b('wood',0,.71,0,2.1,.24,.95);for(let x of [-.8,.8])b('metal',x,.32,0,.16,.62,.74);b('body',0,.91,-.3,1.45,.11,.24);break;
 case 'machine':b('metal',0,.88,0,1.12,1.74,.86);b('glass',0,1.15,.47,.65,.5,.07);b('orange',0,.52,.47,.42,.17,.09);break;
 case 'bench':b('wood',0,.6,0,2.1,.18,.65);b('wood',0,1,.29,2.1,.72,.15);for(let x of [-.8,.8])b('metal',x,.31,0,.15,.55,.55);break;
 case 'lamp':b('metal',0,.9,0,.16,1.8,.16);b('yellow',0,1.89,0,.55,.45,.55);b('dark',0,2.15,0,.65,.12,.65);break;
 case 'door':b('wood',0,1,0,1.2,2,.2);b('metal',.38,1,.12,.12,.12,.1);b('dark',0,2.05,0,1.45,.12,.3);break;
 case 'tree':b('wood',0,.85,0,.35,1.7,.35);b('leaves',0,2.02,0,1.65,1.45,1.65);b('leaves',-.3,2.63,.15,1.1,.78,1.1);break;
 case 'rock':b('metal',0,.4,0,1.5,.8,1.28,.18);b('body',.25,.85,-.24,.85,.55,.88,.3);break;
 case 'bridge':b('wood',0,.42,0,2.5,.25,1.4);for(let x of [-1.15,1.15])b('metal',x,.2,0,.15,.45,1.5);break;
 case 'platform':b('body',0,.24,0,2.15,.4,1.45);b('metal',0,.47,0,1.9,.1,1.21);break;
 case 'crystal':b('body',0,.35,0,.9,.6,.9);b('glass',0,1.17,0,.62,1.1,.62,.78);break;
 default:b('body',0,.55,0,1,1,1);
 }
 return a;
}
function glbFor(kind,color,variant){
 const mats={body:hex(color),dark:palettes.black,glass:palettes.glass,wood:palettes.wood,metal:palettes.metal,orange:palettes.orange,yellow:palettes.yellow,leaves:palettes.leaves};
 const parts=components(kind,color,variant),positions=[],normals=[],meshes=[];
 // Six quad faces, triangulated; flattened per-face normals, no texture dependencies.
 const faces=[[[0,1,2],[0,2,3],[0,0,-1]],[[4,6,5],[4,7,6],[0,0,1]],[[0,4,5],[0,5,1],[0,-1,0]],[[3,2,6],[3,6,7],[0,1,0]],[[0,3,7],[0,7,4],[-1,0,0]],[[1,5,6],[1,6,2],[1,0,0]]];
 const materialIds=Object.keys(mats);
 for(const p of parts){
  let x=p.w/2,y=p.h/2,z=p.d/2;
  const points=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
  const verts=[],ns=[];
  for(const [t1,t2,n] of faces)for(const v of [...t1,...t2]){const q=points[v],co=Math.cos(p.yaw),si=Math.sin(p.yaw);verts.push(q[0]*co-q[2]*si+p.x,q[1]+p.y,q[0]*si+q[2]*co+p.z);ns.push(n[0]*co-n[2]*si,n[1],n[0]*si+n[2]*co)}
  meshes.push({verts,ns,material:materialIds.indexOf(p.mat)});
 }
 const bufferParts=[],bufferViews=[],accessors=[],meshDefs=[],nodes=[];
 let offset=0;
 function store(arr,target){const data=Buffer.alloc(arr.length*4);for(let i=0;i<arr.length;i++)data.writeFloatLE(arr[i],i*4);const ix=bufferViews.length;bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.length,target});bufferParts.push(data);offset+=data.length;return ix}
 for(const item of meshes){
  const pi=store(item.verts,34962),ni=store(item.ns,34962),count=item.verts.length/3;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<item.verts.length;i+=3)for(let j=0;j<3;j++){min[j]=Math.min(min[j],item.verts[i+j]);max[j]=Math.max(max[j],item.verts[i+j])}
  const ap=accessors.length;accessors.push({bufferView:pi,componentType:5126,count,type:'VEC3',min,max});const an=accessors.length;accessors.push({bufferView:ni,componentType:5126,count,type:'VEC3'});
  const mesh=meshDefs.length;meshDefs.push({primitives:[{attributes:{POSITION:ap,NORMAL:an},material:item.material,mode:4}]});nodes.push({mesh});
 }
 const json={asset:{version:'2.0',generator:'WarLike Genre Starter'},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes:meshDefs,materials:materialIds.map(k=>({name:k,pbrMetallicRoughness:{baseColorFactor:mats[k],metallicFactor:0,roughnessFactor:.85},doubleSided:true})),buffers:[{byteLength:offset}],bufferViews,accessors};
 const text=Buffer.from(JSON.stringify(json));const pad=(4-text.length%4)%4;const jsonBytes=Buffer.concat([text,Buffer.alloc(pad,32)]);const binary=Buffer.concat(bufferParts),length=12+8+jsonBytes.length+8+binary.length;
 const header=Buffer.alloc(12),a=Buffer.alloc(8),b=Buffer.alloc(8);header.write('glTF',0);header.writeUInt32LE(2,4);header.writeUInt32LE(length,8);a.writeUInt32LE(jsonBytes.length,0);a.write('JSON',4);b.writeUInt32LE(binary.length,0);b.write('BIN\0',4);return Buffer.concat([header,a,jsonBytes,b,binary]);
}
function thumbnail(name,kind,color){const safe=name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#202638"/><ellipse cx="240" cy="235" rx="135" ry="25" fill="#0d111e" opacity=".5"/><path d="M160 185 L240 135 L325 180 L245 229Z" fill="'+color+'" stroke="#d3dce5" stroke-width="5"/><path d="M160 185 L160 114 L240 67 L240 135Z" fill="'+color+'" opacity=".76"/><path d="M240 135 L240 67 L325 114 L325 180Z" fill="'+color+'" opacity=".95"/><text x="240" y="34" text-anchor="middle" fill="#f4f4ff" font-size="19" font-family="sans-serif" font-weight="bold">'+safe+'</text><text x="240" y="278" text-anchor="middle" fill="#bfc7da" font-size="15" font-family="sans-serif">WarLike · '+kind+' · aperçu schématique</text></svg>'}
export async function generateGenreAssets(){
 await mkdir(out,{recursive:true});const records=[];
 for(const pack of genrePacks){
  for(let i=0;i<pack.items.length;i++){
   const [name,kind]=pack.items[i],slug=pack.id+'-'+String(i+1).padStart(2,'0'),nameFile=slug+'.glb';
   const bytes=glbFor(kind,pack.color,i),thumb=slug+'.svg';
   await writeFile(path.join(out,nameFile),bytes);
   await writeFile(path.join(out,thumb),thumbnail(name,kind,pack.color));
   records.push({id:'warlike-genre-'+slug,name,category:kind==='vehicle'?'Vehicles':kind==='tree'?'Nature':kind==='building'||kind==='tower'?'Buildings':'Props',pack:'warlike-'+pack.id,packName:pack.title,genres:pack.genres,shape:'glb',url:'./assets/free/warlike-genre-packs/'+nameFile,thumbnailUrl:'./assets/free/warlike-genre-packs/'+thumb,license:'CC0-1.0',sourceUrl:'https://github.com/Motherlode94/WarLike-Asset-Stores',animationClips:[],bytes:bytes.length,triangles:components(kind,pack.color,i).length*12,notes:'Modèle 3D original low-poly statique, éléments non riggés.'});
  }
 }
 await writeFile(path.join(out,'models.json'),JSON.stringify(records,null,2)+'\n');return records;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const generated=await generateGenreAssets();console.log(generated.length+' original GLB models generated in '+out)}
