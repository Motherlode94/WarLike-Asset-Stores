// WarLike Gaia: original procedural terrain generator, no external runtime.
export const BIOMES=Object.freeze({
 plains:{name:'Plaines',frequency:3.1,roughness:.22,water:.26},
 mountains:{name:'Montagnes',frequency:4.5,roughness:1,water:.25},
 islands:{name:'Archipel',frequency:3.6,roughness:.72,water:.48},
 desert:{name:'Désert',frequency:3.5,roughness:.33,water:.19},
 canyon:{name:'Canyon',frequency:4.8,roughness:.83,water:.22},
 forest:{name:'Forêt',frequency:3.4,roughness:.49,water:.32},
 tundra:{name:'Toundra',frequency:3.7,roughness:.55,water:.31},
 marsh:{name:'Marécage',frequency:4,roughness:.19,water:.52}
});
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
function hash(ix,iy,seed){let n=Math.imul(ix,374761393)^Math.imul(iy,668265263)^Math.imul(seed,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy;const smooth=t=>t*t*(3-2*t),a=smooth(tx),b=smooth(ty);const lerp=(u,v,t)=>u+(v-u)*t;return lerp(lerp(hash(ix,iy,seed),hash(ix+1,iy,seed),a),lerp(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),a),b)}
function fractal(x,y,seed,octaves=5){let sum=0,weight=0,amp=1;for(let i=0;i<octaves;i++){sum+=noise(x*(2**i),y*(2**i),seed+i*1013)*amp;weight+=amp;amp*=.5}return sum/weight}
export function normalizeConfig(input={}){
 const biome=BIOMES[input.biome]?input.biome:'forest';
 const bounded=(v,def,min,max)=>Number.isFinite(Number(v))?clamp(Number(v),min,max):def;
 let resolution=Math.round(bounded(input.resolution,65,17,257));
 // Heightmap topology is 2^n + 1 so the terrain can be split into tiles later.
 resolution=[17,33,65,129,257].reduce((best,v)=>Math.abs(v-resolution)<Math.abs(best-resolution)?v:best,65);
 return {seed:Math.floor(bounded(input.seed,2026,0,2147483647)),biome,resolution,size:Math.round(bounded(input.size,256,32,2048)),height:Math.round(bounded(input.height,58,1,320)),water:bounded(input.water,BIOMES[biome].water,0,.85),trees:Math.round(bounded(input.trees,120,0,2500)),rocks:Math.round(bounded(input.rocks,35,0,900))};
}
export function generateHeightmap(input={}){
 const cfg=normalizeConfig(input),{resolution:n,seed,biome}=cfg,preset=BIOMES[biome];const values=new Float32Array(n*n);
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){
  const u=x/(n-1),v=z/(n-1),freq=preset.frequency;
  let h=fractal(u*freq+12.7,v*freq+3.9,seed,6),ridge=1-Math.abs(2*fractal(u*freq*.71+22,v*freq*.71+40,seed+1337,5)-1);
  if(biome==='mountains')h=.2+Math.pow(ridge,2.6)*.78+(h-.5)*.18;
  else if(biome==='canyon')h=.17+Math.abs(Math.sin((u*.8+v*.26)*12+(h-.5)*3.5))*.65+(h-.5)*.25;
  else h=.28+(h-.5)*(1.6*preset.roughness)+(ridge-.5)*.18;
  if(biome==='islands'){const dx=(u-.5)*2,dy=(v-.5)*2;const falloff=clamp(1-Math.pow(Math.hypot(dx,dy),1.25));h=h*falloff+.06}
  if(biome==='marsh')h=.45+(h-.5)*.42;
  values[z*n+x]=clamp(h);
 }
 return {config:cfg,heights:values};
}

export const TERRAIN_LAYERS=Object.freeze([
 {id:'grass',name:'Herbe',color:[.24,.53,.27,1]},
 {id:'soil',name:'Terre',color:[.43,.31,.23,1]},
 {id:'sand',name:'Sable',color:[.85,.72,.46,1]},
 {id:'rock',name:'Roche',color:[.48,.51,.52,1]},
 {id:'snow',name:'Neige',color:[.92,.94,.96,1]}
]);
const layerCount=TERRAIN_LAYERS.length;
export function ensureTerrainLayers(terrain){
 const total=terrain.config.resolution**2;
 if(terrain.layers instanceof Float32Array&&terrain.layers.length===total*layerCount)return terrain.layers;
 const weights=new Float32Array(total*layerCount);
 for(let i=0;i<total;i++){
  const h=terrain.heights[i],biome=terrain.config.biome,water=terrain.config.water;
  const target=h<water+.04?'sand':biome==='desert'||biome==='canyon'?'sand':biome==='tundra'||h>.8?'snow':h>.65?'rock':biome==='marsh'?'soil':'grass';
  weights[i*layerCount+TERRAIN_LAYERS.findIndex(layer=>layer.id===target)]=1;
 }
 terrain.layers=weights;return weights;
}
export function applyTerrainBrush(terrain,opts={}){
 const n=terrain.config.resolution,u=Number(opts.u),v=Number(opts.v);
 if(!Number.isFinite(u)||!Number.isFinite(v)||u<0||u>1||v<0||v>1) return 0;
 const radius=clamp(Number(opts.radius)||.075,.004,.5),strength=clamp(Number(opts.strength)||.3,.001,1);
 const mode=opts.mode||'raise';
 const layer=mode==='paint'?TERRAIN_LAYERS.findIndex(l=>l.id===opts.layer):-1;
 if(mode==='paint'&&layer<0)throw Error('Couche de terrain inconnue');
 if(!['raise','lower','smooth','flatten','paint'].includes(mode))throw Error('Pinceau inconnu');
 const heights=terrain.heights,weights=mode==='paint'?ensureTerrainLayers(terrain):null;
 const original=mode==='smooth'?heights.slice():null;
 const target=Number.isFinite(Number(opts.target))?clamp(Number(opts.target)):heights[Math.round(v*(n-1))*n+Math.round(u*(n-1))];
 const minx=Math.max(0,Math.floor((u-radius)*(n-1))),maxx=Math.min(n-1,Math.ceil((u+radius)*(n-1)));
 const miny=Math.max(0,Math.floor((v-radius)*(n-1))),maxy=Math.min(n-1,Math.ceil((v+radius)*(n-1)));
 let changed=0;
 for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++){
  const distance=Math.hypot(x/(n-1)-u,y/(n-1)-v);
  if(distance>radius)continue;
  const falloff=(1-distance/radius)**2,power=clamp(strength*falloff),i=y*n+x;
  if(mode==='paint'){
   const offset=i*layerCount;
   for(let k=0;k<layerCount;k++)weights[offset+k]*=1-power;
   weights[offset+layer]+=power;
   // Preserve normalised layer weights after repeated brush strokes.
   let sum=0;for(let k=0;k<layerCount;k++)sum+=weights[offset+k];
   if(sum>0)for(let k=0;k<layerCount;k++)weights[offset+k]/=sum;
  }else{
   const h=heights[i];let next=h;
   if(mode==='raise')next=h+power*.065;
   if(mode==='lower')next=h-power*.065;
   if(mode==='flatten')next=h+(target-h)*power;
   if(mode==='smooth'){
    let sum=0,count=0;
    for(let sy=Math.max(0,y-1);sy<=Math.min(n-1,y+1);sy++)for(let sx=Math.max(0,x-1);sx<=Math.min(n-1,x+1);sx++){sum+=original[sy*n+sx];count++}
    next=h+(sum/count-h)*power;
   }
   heights[i]=clamp(next);
  }
  changed++;
 }
 return changed;
}
export function colorForTerrainPoint(terrain,i){
 const weights=terrain.layers;
 if(!(weights instanceof Float32Array)||weights.length!==terrain.heights.length*layerCount)return terrainColor(terrain.heights[i],terrain.config.water,terrain.config.biome);
 const rgba=[0,0,0,1];
 for(let k=0;k<layerCount;k++)for(let channel=0;channel<3;channel++)rgba[channel]+=weights[i*layerCount+k]*TERRAIN_LAYERS[k].color[channel];
 return rgba;
}

export function scatterAssets(terrain){
 const {config:c,heights}=terrain,{resolution:n,size,seed}=c;const out=[];
 const sample=(u,v)=>{const x=Math.min(n-1,Math.max(0,Math.round(u*(n-1)))),z=Math.min(n-1,Math.max(0,Math.round(v*(n-1))));return heights[z*n+x]};
 const attempts=[['tree',c.trees],['rock',c.rocks]];
 for(const [kind,count] of attempts){let accepted=0;for(let i=0;i<count*8&&accepted<count;i++){
  const u=hash(i+337,kind==='tree'?17:29,seed),v=hash(i+521,kind==='tree'?41:67,seed+977),h=sample(u,v);
  if(h<c.water+.035||(kind==='tree'&&h>.78))continue;
  const scale=.65+hash(i,99,seed)*.9;
  out.push({type:kind,x:(u-.5)*size,y:h*c.height,z:(v-.5)*size,scale:Number(scale.toFixed(3))});accepted++;
 }}
 return out;
}
function terrainColor(h,water,biome){
 if(h<water+.018)return [.70,.64,.42,1];
 if(biome==='desert')return h>.7?[.72,.52,.32,1]:[.85,.72,.45,1];
 if(biome==='tundra')return h>.58?[.91,.94,.94,1]:[.53,.64,.67,1];
 if(biome==='canyon')return h>.67?[.69,.32,.2,1]:[.77,.46,.27,1];
 if(h>.79)return [.82,.84,.86,1];
 if(h>.66)return [.5,.52,.47,1];
 if(biome==='marsh')return [.28,.46,.35,1];
 return h>.46?[.25,.49,.31,1]:[.40,.57,.33,1];
}
function normals(positions,n){const result=new Float32Array(positions.length);
 const get=(x,z)=>{const i=(z*n+x)*3;return [positions[i],positions[i+1],positions[i+2]]};
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const l=get(Math.max(0,x-1),z),r=get(Math.min(n-1,x+1),z),d=get(x,Math.max(0,z-1)),u=get(x,Math.min(n-1,z+1));const vx=[r[0]-l[0],r[1]-l[1],r[2]-l[2]],vz=[u[0]-d[0],u[1]-d[1],u[2]-d[2]];
 // cross(dz,dx) gives the upward-facing normal on the X/Z terrain plane.
 const nx=vz[1]*vx[2]-vz[2]*vx[1],ny=vz[2]*vx[0]-vz[0]*vx[2],nz=vz[0]*vx[1]-vz[1]*vx[0],mag=Math.hypot(nx,ny,nz)||1,i=(z*n+x)*3;
 result[i]=nx/mag;result[i+1]=ny/mag;result[i+2]=nz/mag;
 }
 return result;
}
const align4=n=>(n+3)&~3;
function glbChunk(json,binary){
 const text=JSON.stringify(json),enc=new TextEncoder().encode(text),jsonLen=align4(enc.length),binLen=align4(binary.length);
 const file=new Uint8Array(12+8+jsonLen+8+binLen),view=new DataView(file.buffer);file.set([103,108,84,70]);view.setUint32(4,2,true);view.setUint32(8,file.length,true);view.setUint32(12,jsonLen,true);file.set([74,83,79,78],16);file.fill(32,20,20+jsonLen);file.set(enc,20);
 const offset=20+jsonLen;view.setUint32(offset,binLen,true);file.set([66,73,78,0],offset+4);file.set(binary,offset+8);
 return file;
}
export function exportTerrainGLB(terrain){
 const {config:c,heights}=terrain,n=c.resolution,total=n*n;
 if(!(heights instanceof Float32Array)||heights.length!==total)throw Error('Terrain invalide');
 const vertices=new Float32Array(total*3),colors=new Float32Array(total*4),indices=new Uint32Array((n-1)*(n-1)*6);
 let low=Infinity,high=-Infinity;
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const i=z*n+x,h=heights[i],y=h*c.height;vertices.set([(x/(n-1)-.5)*c.size,y,(z/(n-1)-.5)*c.size],i*3);colors.set(colorForTerrainPoint(terrain,i),i*4);low=Math.min(low,y);high=Math.max(high,y)}
 let at=0;for(let z=0;z<n-1;z++)for(let x=0;x<n-1;x++){const a=z*n+x,b=a+1,d=a+n,e=d+1;indices.set([a,d,b,b,d,e],at);at+=6}
 const normal=normals(vertices,n),sections=[vertices,normal,colors,indices],data=[],views=[],accessors=[];let size=0;
 for(let i=0;i<sections.length;i++){const s=sections[i],raw=new Uint8Array(s.buffer,s.byteOffset,s.byteLength),padded=align4(raw.length),buffer=new Uint8Array(padded);buffer.set(raw);data.push(buffer);views.push({buffer:0,byteOffset:size,byteLength:raw.length,target:i===3?34963:34962});size+=padded}
 accessors.push({bufferView:0,componentType:5126,count:total,type:'VEC3',min:[-c.size/2,low,-c.size/2],max:[c.size/2,high,c.size/2]},{bufferView:1,componentType:5126,count:total,type:'VEC3'},{bufferView:2,componentType:5126,count:total,type:'VEC4'},{bufferView:3,componentType:5125,count:indices.length,type:'SCALAR'});
 const json={asset:{version:'2.0',generator:'WarLike Gaia 0.1'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'Terrain '+c.biome,mesh:0}],meshes:[{name:'Terrain',primitives:[{attributes:{POSITION:0,NORMAL:1,COLOR_0:2},indices:3,material:0,mode:4}]}],materials:[{name:'Biome',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:1},doubleSided:true}],buffers:[{byteLength:size}],bufferViews:views,accessors,extras:{warlikeGaia:{...c,waterHeight:c.water*c.height,scatter:scatterAssets(terrain)}}};
 const binary=new Uint8Array(size);let cursor=0;for(const block of data){binary.set(block,cursor);cursor+=block.length}
 return glbChunk(json,binary);
}
export function heightmapPixels(terrain){const {config,heights}=terrain,pixels=new Uint8ClampedArray(config.resolution*config.resolution*4);for(let i=0;i<heights.length;i++){const g=Math.round(heights[i]*255);pixels.set([g,g,g,255],i*4)}return pixels}
export function previewPixels(terrain){const {config:c,heights}=terrain,pixels=new Uint8ClampedArray(c.resolution*c.resolution*4);for(let i=0;i<heights.length;i++){const h=heights[i],color=h<c.water?[.15,.38,.66,1]:colorForTerrainPoint(terrain,i);pixels.set(color.map((v,j)=>j===3?255:Math.round(v*255)),i*4)}return pixels}
export function exportTerrainRecipe(terrain){
 const layers=ensureTerrainLayers(terrain);
 return {schema:'warlike.gaia.terrain.v1',version:2,config:terrain.config,waterHeight:terrain.config.water*terrain.config.height,objects:scatterAssets(terrain),terrainLayers:TERRAIN_LAYERS.map(layer=>({id:layer.id,name:layer.name,color:layer.color})),heightValues:Array.from(terrain.heights),layerWeights:Array.from(layers,v=>Math.round(v*10000)/10000),notes:'Relief et couches de couleurs modifiables exportés comme données. Collisions, eau dynamique et instanciation restent à intégrer dans Engine.'};
}
