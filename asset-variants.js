// Genuine Quaternius model variants often share a silhouette. Make their
// authored geometry/material differences explicit without claiming duplicates.
export function assetVariantInfo(asset){
 const path=String(asset?.id||asset?.name||'').toLowerCase().replace(/[_ ]/g,'-');
 const textured=/(?:^|-)mat(?:$|-)/.test(path);
 const base=/(?:^|-)base(?:$|-)/.test(path);
 const gable=/(?:^|-)gableroof(?:$|-)/.test(path);
 const round=/(?:^|-)roundroof(?:$|-)/.test(path);
 const sign=/(?:^|-)sign(?:$|-)/.test(path);
 if(!/ultimatetexturedbuildings/.test(path))return null;
 const shape=gable?'Toit à pignon':round?'Toit arrondi':sign?'Avec enseigne':'Bâtiment standard';
 const finish=textured?'Version avec matériaux':base?'Version de base':'Version standard';
 const key=path.replace(/(?:-mat|-base)+$/g,'').replace(/-(?:gableroof|roundroof|sign)$/,'');
 return {shape,finish,base,textured,key,description:shape+' · '+finish};
}
export function relatedAssetVariants(asset,all,limit=14){
 const info=assetVariantInfo(asset);if(!info)return [];
 return all.filter(item=>item.id!==asset.id&&item.author===asset.author&&item.pack===asset.pack&&assetVariantInfo(item)?.key===info.key).slice(0,limit);
}
