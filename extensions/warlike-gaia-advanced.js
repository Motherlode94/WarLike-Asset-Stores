// WarLike Gaia advanced procedural terrain: deterministic erosion, octave noise and tile seams.
import {generateHeightmap,normalizeConfig,exportTerrainGLB,exportTerrainRecipe} from './warlike-gaia.js';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const idx=(n,x,z)=>z*n+x;
const copy=t=>({config:{...t.config},heights:new Float32Array(t.heights),...(t.layers?{layers:new Float32Array(t.layers)}:{})});
function rand(seed,x,z){let v=(Math.imul(seed+101,1664525)+Math.imul(x,374761393)+Math.imul(z,668265263))|0;v=Math.imul(v^(v>>>15),2246822519);return((v^(v>>>13))>>>0)/4294967295}
function smoothstep(t){return t*t*(3-2*t)}
function valueNoise(x,z,seed){const ix=Math.floor(x),iz=Math.floor(z),u=smoothstep(x-ix),v=smoothstep(z-iz),a=rand(seed,ix,iz),b=rand(seed,ix+1,iz),c=rand(seed,ix,iz+1),d=rand(seed,ix+1,iz+1);return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v}
export function advancedNoise(x,z,{seed=2026,frequency=3,octaves=5,lacunarity=2,gain=.5,warp=0,ridge=0}={}){
 const bounded=(v,f,min,max)=>Number.isFinite(Number(v))?clamp(Number(v),min,max):f;
 const o=Math.round(bounded(octaves,5,1,8)),freq=bounded(frequency,3,.01,50),lac=bounded(lacunarity,2,1.1,4),g=bounded(gain,.5,.1,.9),w=bounded(warp,0,0,2),r=bounded(ridge,0,0,1);
 let nx=x,nz=z;
 if(w){nx+=(valueNoise(x*1.3,z*1.3,seed+51)-.5)*w;nz+=(valueNoise(x*1.3,z*1.3,seed+93)-.5)*w}
 let sum=0,amp=1,total=0,f=freq;
 for(let i=0;i<o;i++){const q=valueNoise(nx*f,nz*f,seed+i*1013),v=q*(1-r)+(1-Math.abs(q*2-1))*r;sum+=v*amp;total+=amp;amp*=g;f*=lac}
 return sum/total;
}
export function applyAdvancedNoise(terrain,options={}){
 const t=copy(terrain),n=t.config.resolution;
 const amount=clamp(Number(options.amount)||.25,0,1);
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const i=idx(n,x,z),q=advancedNoise(x/(n-1),z/(n-1),{...options,seed:options.seed??t.config.seed});t.heights[i]=clamp(t.heights[i]*(1-amount)+q*amount)}
 return t;
}
// Mass-conservative local thermal erosion: material moves downhill, never teleports.
export function erodeThermal(terrain,{iterations=20,talus=.015,strength=.22}={}){
 const out=copy(terrain),n=out.config.resolution,steps=Math.round(clamp(Number(iterations)||20,1,150)),threshold=clamp(Number(talus)||.015,.0001,.3),power=clamp(Number(strength)||.22,.001,.5);
 for(let k=0;k<steps;k++){
  const delta=new Float32Array(n*n);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
   const i=idx(n,x,z),h=out.heights[i],neighbors=[];
   for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,zz=z+dz;if(xx<0||zz<0||xx>=n||zz>=n)continue;const j=idx(n,xx,zz),diff=h-out.heights[j]-threshold;if(diff>0)neighbors.push([j,diff])}
   const potential=neighbors.reduce((s,v)=>s+v[1],0);if(!potential)continue;
   const moved=Math.min(power*potential/(neighbors.length+1),h*.5);delta[i]-=moved;
   for(const [j,d] of neighbors)delta[j]+=moved*d/potential;
  }
  for(let i=0;i<delta.length;i++)out.heights[i]=clamp(out.heights[i]+delta[i]);
 }
 return out;
}
// Simple droplet-inspired hydraulic transport with water flow and sediment capacity.
export function erodeHydraulic(terrain,{iterations=35,rain=.025,evaporation=.25,erosion=.12,deposition=.13}={}){
 const out=copy(terrain),n=out.config.resolution,steps=Math.round(clamp(Number(iterations)||35,1,120));
 const water=new Float32Array(n*n),sediment=new Float32Array(n*n);
 const rainfall=clamp(Number(rain)||.025,.0001,.2),evap=clamp(Number(evaporation)||.25,.01,.9),erode=clamp(Number(erosion)||.12,.001,.5),deposit=clamp(Number(deposition)||.13,.001,.5);
 for(let k=0;k<steps;k++){
  const deltaWater=new Float32Array(n*n),deltaSediment=new Float32Array(n*n);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
   const i=idx(n,x,z);water[i]+=rainfall;let next=i,gradient=0;
   for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,zz=z+dz;if(xx<0||zz<0||xx>=n||zz>=n)continue;const j=idx(n,xx,zz),slope=out.heights[i]+water[i]-out.heights[j]-water[j];if(slope>gradient){gradient=slope;next=j}}
   if(next===i){const settling=sediment[i]*deposit;out.heights[i]=clamp(out.heights[i]+settling);sediment[i]-=settling;continue}
   const flux=Math.min(water[i]*.5,gradient*.4),capacity=flux*gradient*2;
   if(sediment[i]<capacity){const amount=Math.min((capacity-sediment[i])*erode,out.heights[i]);out.heights[i]-=amount;sediment[i]+=amount}
   else{const amount=Math.min((sediment[i]-capacity)*deposit,sediment[i]);out.heights[i]=clamp(out.heights[i]+amount);sediment[i]-=amount}
   const carry=Math.min(sediment[i],sediment[i]*flux/Math.max(water[i],.0001));deltaSediment[i]-=carry;deltaSediment[next]+=carry;
   deltaWater[i]-=flux;deltaWater[next]+=flux;
  }
  for(let i=0;i<water.length;i++){water[i]=Math.max(0,(water[i]+deltaWater[i])*(1-evap));sediment[i]=Math.max(0,sediment[i]+deltaSediment[i])}
 }
 return out;
}
export function generateTerrainTiles(config={},opts={}){
 const tiles=Math.round(clamp(Number(opts.tiles)||2,1,4)),base=normalizeConfig(config);
 const n=base.resolution,width=tiles*(n-1)+1;
 if(width>1025)throw Error('Grille mondiale trop grande');
 // Create one continuous world heightfield, then split it, sharing seam vertex values.
 const world=generateHeightmap({...base,resolution:257});
 const all=new Float32Array(width*width);
 for(let z=0;z<width;z++)for(let x=0;x<width;x++){
  const u=x/(width-1),v=z/(width-1),noise=advancedNoise(u,v,{seed:base.seed,frequency:5,octaves:6,warp:.32,ridge:base.biome==='mountains'?.8:.15});
  const edge=base.biome==='islands'?clamp(1-Math.hypot((u-.5)*2,(v-.5)*2)**1.3):1;
  all[idx(width,x,z)]=clamp((.16+noise*.72)*edge);
 }
 const output=[];
 for(let tz=0;tz<tiles;tz++)for(let tx=0;tx<tiles;tx++){
  const heights=new Float32Array(n*n);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++)heights[idx(n,x,z)]=all[idx(width,tx*(n-1)+x,tz*(n-1)+z)];
  output.push({tileX:tx,tileZ:tz,offsetX:(tx-(tiles-1)/2)*base.size,offsetZ:(tz-(tiles-1)/2)*base.size,terrain:{config:{...base,tileX:tx,tileZ:tz},heights}});
 }
 return {config:base,tilesPerAxis:tiles,tiles:output,worldResolution:width};
}
export function terrainCollisionDescriptor(terrain,{offsetX=0,offsetZ=0}={}){
 const {config:c,heights}=terrain,n=c.resolution;
 return {schema:'warlike.terrain.heightfield.v1',resolution:n,size:c.size,height:c.height,offsetX,offsetZ,heights:Array.from(heights),collision:true};
}
export function sampleTerrainHeight(collider,x,z){
 if(!collider||collider.schema!=='warlike.terrain.heightfield.v1')return null;
 const {resolution:n,size,height,offsetX=0,offsetZ=0,heights}=collider;
 if(!Number.isInteger(n)||n<2||n>257||!Array.isArray(heights)||heights.length!==n*n||!Number.isFinite(size)||size<=0)return null;
 const u=(x-offsetX)/size+.5,v=(z-offsetZ)/size+.5;if(u<0||u>1||v<0||v>1)return null;
 const fx=u*(n-1),fz=v*(n-1),ix=Math.min(n-2,Math.floor(fx)),iz=Math.min(n-2,Math.floor(fz)),a=fx-ix,b=fz-iz;
 const tl=heights[idx(n,ix,iz)],tr=heights[idx(n,ix+1,iz)],bl=heights[idx(n,ix,iz+1)],br=heights[idx(n,ix+1,iz+1)];
 return ((tl*(1-a)+tr*a)*(1-b)+(bl*(1-a)+br*a)*b)*height;
}
export function exportWorldRecipe(world){
 return {schema:'warlike.gaia.world.v1',version:1,tilesPerAxis:world.tilesPerAxis,tiles:world.tiles.map(t=>({
  tileX:t.tileX,tileZ:t.tileZ,offsetX:t.offsetX,offsetZ:t.offsetZ,
  collision:terrainCollisionDescriptor(t.terrain,{offsetX:t.offsetX,offsetZ:t.offsetZ})
 }))};
}
export {exportTerrainGLB,exportTerrainRecipe};
