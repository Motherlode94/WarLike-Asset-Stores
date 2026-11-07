// WarLike gameplay clip mapper — API pure, sans accès au runtime.
const patterns={idle:/idle|rest|stand/i,walk:/walk|walking/i,run:/run|sprint|jog/i,attack:/attack|shoot|punch|strike/i,jump:/jump/i,hurt:/hurt|hit|damage/i,death:/death|die|dead/i};
export function mapGameplayClips(names=[]){const clips=names.filter(v=>typeof v==='string');const map={};for(const [state,re] of Object.entries(patterns)){const match=clips.find(name=>re.test(name));if(match)map[state]=match;}return map;}
export function missingGameplayClips(names=[]){const map=mapGameplayClips(names);return Object.keys(patterns).filter(state=>!map[state]);}
