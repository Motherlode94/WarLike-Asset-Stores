// Structural glTF 2.0 animation audit; checks serialized tracks, not visual motion.
export function inspectGlbAnimations(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20)throw Error('Fichier GLB incomplet');
 const v=new DataView(buffer);
 if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==buffer.byteLength||v.getUint32(16,true)!==0x4e4f534a)throw Error('En-tête GLB 2.0 invalide');
 const length=v.getUint32(12,true);
 if(length<2||length+20>buffer.byteLength)throw Error('JSON GLB hors limites');
 const document=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,length)).trim());
 const animations=Array.isArray(document.animations)?document.animations:[];
 const accessors=Array.isArray(document.accessors)?document.accessors:[];
 const nodes=Array.isArray(document.nodes)?document.nodes:[];
 const results=animations.map((clip,index)=>{
  const problems=[],channels=Array.isArray(clip.channels)?clip.channels:[],samplers=Array.isArray(clip.samplers)?clip.samplers:[];
  if(!channels.length)problems.push('Aucun canal de mouvement');
  if(!samplers.length)problems.push('Aucun sampler');
  for(const channel of channels){
   const target=channel.target||{};
   if(!Number.isInteger(channel.sampler)||!samplers[channel.sampler]){problems.push('Sampler manquant');continue}
   if(!Number.isInteger(target.node)||!nodes[target.node])problems.push('Nœud cible manquant');
   if(!['translation','rotation','scale','weights'].includes(target.path))problems.push('Canal inconnu');
   const sampler=samplers[channel.sampler];
   if(!Number.isInteger(sampler.input)||!accessors[sampler.input]||!Number.isInteger(sampler.output)||!accessors[sampler.output])problems.push('Données de keyframes manquantes');
   else if((accessors[sampler.input].count||0)<1||(accessors[sampler.output].count||0)<1)problems.push('Keyframes vides');
  }
  return {name:clip.name||'Animation '+(index+1),channels:channels.length,valid:problems.length===0,problems:[...new Set(problems)]};
 });
 return {clips:results,valid:results.filter(x=>x.valid).length,invalid:results.filter(x=>!x.valid).length};
}
