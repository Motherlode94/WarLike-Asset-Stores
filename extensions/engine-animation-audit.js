// WarLike Animation QA Toolkit — ES module, sans dépendances.
// Import manuel dans des outils JS : pas de chargement automatique par Engine.
export function auditGltfAnimations(gltf) {
  const nodes=gltf?.nodes||[],accessors=gltf?.accessors||[];
  return (gltf?.animations||[]).map((clip,index)=>{
    const issues=[];
    for(const channel of clip.channels||[]){const sampler=clip.samplers?.[channel.sampler];if(!sampler){issues.push('sampler manquant');continue}
      if(!nodes[channel.target?.node])issues.push('cible introuvable');
      if(!accessors[sampler.input]||!accessors[sampler.output])issues.push('keyframes introuvables');
      if(!['translation','rotation','scale','weights'].includes(channel.target?.path))issues.push('canal inconnu');
    }
    if(!(clip.channels||[]).length)issues.push('clip vide');
    return {name:clip.name||'Animation '+(index+1),channels:clip.channels?.length||0,valid:!issues.length,issues:[...new Set(issues)]};
  });
}
