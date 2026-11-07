// Original WarLike low-poly 3D meshes for strategy / turn-based / arcade.
// Deterministic: each asset exports an actual GLB and a silhouette-matched SVG.
// No links, placeholder models, external libraries or fabricated asset records.
const palettes={
 strategy:{base:'#68798c',trim:'#2c3847',accent:'#e6ac57',dark:'#202b35',light:'#a2b0bc',green:'#557968',glass:'#70bcc7',ground:'#7a7565',red:'#a84b43'},
 turnbased:{base:'#85839d',trim:'#3d4059',accent:'#d4b467',dark:'#2b3046',light:'#d7c8a5',green:'#599977',glass:'#71c7d1',ground:'#877569',red:'#bd6754'},
 arcade:{base:'#454b88',trim:'#20264b',accent:'#f5c655',dark:'#18223b',light:'#8b9bdf',green:'#40c4aa',glass:'#5ce6ff',ground:'#445077',red:'#fa5c89'}
};
const specs={
 strategy:[
 ['command-bunker','Bunker de commandement','Buildings'],
 ['armored-tank','Char de combat stylisé','Vehicles'],
 ['field-artillery','Artillerie de campagne','Weapons'],
 ['radar-station','Station radar','Buildings'],
 ['watch-tower','Tour de surveillance','Buildings'],
 ['supply-depot','Dépôt de ravitaillement','Buildings'],
 ['command-hq','Quartier général RTS','Buildings'],
 ['resource-refinery','Raffinerie de ressources','Buildings'],
 ['missile-launcher','Lance-missiles mobile','Vehicles'],
 ['barracks','Caserne modulaire','Buildings'],
 ['power-generator','Générateur industriel','Props'],
 ['fortified-gate','Porte fortifiée','Buildings'],
 ['scout-vehicle','Véhicule de reconnaissance','Vehicles'],
 ['defense-turret','Tourelle défensive','Weapons'],
 ['landing-pad','Plateforme aérienne','Props'],
 ['communications-relay','Relais de communication','Buildings']
 ],
 turnbased:[
 ['hex-grass','Hexagone prairie','Props'],
 ['hex-desert','Hexagone désert','Props'],
 ['hex-snow','Hexagone neige','Props'],
 ['hex-lava','Hexagone volcanique','Props'],
 ['knight-token','Pion chevalier','Characters'],
 ['mage-token','Pion mage','Characters'],
 ['archer-token','Pion archer','Characters'],
 ['guardian-token','Pion gardien','Characters'],
 ['rune-altar','Autel runique','Props'],
 ['treasure-chest','Coffre tactique','Props'],
 ['ruined-tower','Tour en ruines','Buildings'],
 ['healing-shrine','Sanctuaire de soin','Buildings'],
 ['crystal-obelisk','Obélisque de cristal','Props'],
 ['stone-golem','Golem de pierre','Characters'],
 ['battle-banner','Bannière de faction','Props'],
 ['tactical-bridge','Pont tactique','Buildings']
 ],
 arcade:[
 ['hover-racer','Bolide antigravité','Vehicles'],
 ['rocket-ship','Fusée rétro','Vehicles'],
 ['pinball-bumper','Bumper flipper','Props'],
 ['arcade-coin','Pièce bonus','Props'],
 ['boost-pad','Plateforme turbo','Props'],
 ['speed-gate','Portique de vitesse','Props'],
 ['neon-tower','Tour néon','Buildings'],
 ['retro-controller','Manette rétro','Props'],
 ['enemy-drone','Drone arcade','Vehicles'],
 ['starfighter','Vaisseau de combat','Vehicles'],
 ['power-star','Étoile bonus','Props'],
 ['asteroid','Astéroïde stylisé','Nature'],
 ['jump-platform','Plateforme de saut','Props'],
 ['laser-cannon','Canon laser','Weapons'],
 ['energy-core','Noyau d’énergie','Props'],
 ['robot-runner','Robot sprinteur','Characters']
 ]
};
const groups=()=>new Map();
const addTri=(g,col,a,b,c)=>{
 const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
 let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz);
 if(len<1e-8)return;nx/=len;ny/=len;nz/=len;
 if(!g.has(col))g.set(col,[]);
 g.get(col).push({vertices:[a,b,c],normal:[nx,ny,nz]});
};
const quad=(g,col,a,b,c,d)=>{addTri(g,col,a,b,c);addTri(g,col,a,c,d)};
const box=(g,x,y,z,w,h,d,col)=>{
 const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,i=z+d/2;
 quad(g,col,[a,c,f],[b,c,f],[b,e,f],[a,e,f]);quad(g,col,[b,c,i],[a,c,i],[a,e,i],[b,e,i]);
 quad(g,col,[a,c,i],[a,c,f],[a,e,f],[a,e,i]);quad(g,col,[b,c,f],[b,c,i],[b,e,i],[b,e,f]);
 quad(g,col,[a,e,f],[b,e,f],[b,e,i],[a,e,i]);quad(g,col,[a,c,i],[b,c,i],[b,c,f],[a,c,f]);
};
const cyl=(g,x,y,z,r,h,col,n=12,axis='y',topR=r)=>{
 const make=(angle,radius,v)=>{
  const cx=Math.cos(angle)*radius,cz=Math.sin(angle)*radius;
  return axis==='y'?[x+cx,y+v,z+cz]:axis==='x'?[x+v,y+cx,z+cz]:[x+cx,y+cz,z+v];
 };
 for(let i=0;i<n;i++){
  const a=2*Math.PI*i/n,b=2*Math.PI*(i+1)/n;
  const low=make(a,r,-h/2),low2=make(b,r,-h/2),high=make(a,topR,h/2),high2=make(b,topR,h/2);
  quad(g,col,low,low2,high2,high);
  if(topR>1e-6)addTri(g,col,make(0,0,h/2),high,high2);
  addTri(g,col,make(0,0,-h/2),low2,low);
 }
};
const ring=(g,x,y,z,major,minor,col,n=14,m=5,axis='y')=>{
 const p=(a,b)=>{const radius=major+minor*Math.cos(b),v=minor*Math.sin(b);return axis==='y'?[x+radius*Math.cos(a),y+v,z+radius*Math.sin(a)]:axis==='x'?[x+v,y+radius*Math.cos(a),z+radius*Math.sin(a)]:[x+radius*Math.cos(a),y+radius*Math.sin(a),z+v]};
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n,c=j*2*Math.PI/m,d=(j+1)*2*Math.PI/m;quad(g,col,p(a,c),p(b,c),p(b,d),p(a,d))}
};
const sphere=(g,x,y,z,r,col,n=10,m=5)=>{
 const p=(a,b)=>[x+r*Math.sin(b)*Math.cos(a),y+r*Math.cos(b),z+r*Math.sin(b)*Math.sin(a)];
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n,c=j*Math.PI/m,d=(j+1)*Math.PI/m;quad(g,col,p(a,c),p(b,c),p(b,d),p(a,d))}
};
const roof=(g,x,y,z,w,d,h,col)=>{
 const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,t=y+h;
 quad(g,col,[a,y,c],[b,y,c],[x,t,c],[a,y,c]);
 // two sloped planes run along the building's depth
 quad(g,col,[a,y,c],[x,t,c],[x,t,e],[a,y,e]);quad(g,col,[x,t,c],[b,y,c],[b,y,e],[x,t,e]);
 addTri(g,col,[a,y,c],[b,y,c],[x,t,c]);addTri(g,col,[b,y,e],[a,y,e],[x,t,e]);
};
const hex=(g,x,y,z,r,h,col)=>{
 const low=[],high=[];for(let i=0;i<6;i++){let a=2*Math.PI*i/6;low.push([x+r*Math.cos(a),y-h/2,z+r*Math.sin(a)]);high.push([x+r*Math.cos(a),y+h/2,z+r*Math.sin(a)])}
 for(let i=0;i<6;i++){let j=(i+1)%6;quad(g,col,low[i],low[j],high[j],high[i]);addTri(g,col,[x,y+h/2,z],high[i],high[j]);addTri(g,col,[x,y-h/2,z],low[j],low[i])}
};
const star=(g,x,y,z,r,col)=>{
 let low=[],top=[x,y+r*.35,z],bot=[x,y-r*.35,z];for(let i=0;i<10;i++){const a=i*Math.PI/5,rad=i%2?r*.46:r;low.push([x+rad*Math.cos(a),y+rad*Math.sin(a),z])}
 for(let i=0;i<10;i++){addTri(g,col,top,low[i],low[(i+1)%10]);addTri(g,col,bot,low[(i+1)%10],low[i])}
};
function build(kind,slug,P){
 const g=groups(),B=(...a)=>box(g,...a),C=(...a)=>cyl(g,...a),S=(...a)=>sphere(g,...a),R=(...a)=>ring(g,...a),H=(...a)=>hex(g,...a),T=(...a)=>roof(g,...a);
 const [base,trim,accent,dark,light,green,glass,ground,red]=[P.base,P.trim,P.accent,P.dark,P.light,P.green,P.glass,P.ground,P.red];
 const platform=()=>{B(0,.08,0,3,.16,3,dark);B(0,.18,0,2.76,.12,2.76,ground)};
 const wheels=(span=1.2,zs=[-1,1])=>{for(const z of zs)for(const x of [-span,span]){C(x,.37,z,.34,.17,dark,12,'x');C(x*(1+Math.sign(x)*.06),.37,z,.18,.18,light,10,'x')}};
 if(kind==='strategy'){
  if(slug==='command-bunker'){platform();B(0,.75,0,2.3,1,2.1,base);B(0,1.3,0,2.5,.26,2.35,trim);B(0,.7,1.075,.57,.62,.09,dark);for(const x of [-.8,.8])B(x,.95,1.075,.4,.13,.12,glass);C(.7,1.75,-.7,.04,1,trim,8);S(.7,2.3,-.7,.14,accent)}
  else if(slug==='armored-tank'){B(0,.65,0,2.65,.73,3.5,green);for(const x of [-1.25,1.25])B(x,.4,0,.46,.58,3.56,dark);wheels(1.22,[-1.15,-.35,.45,1.25]);C(0,1.27,0,.88,.48,base,12);B(0,1.53,.14,1.35,.3,1.3,green);C(0,1.43,1.62,.14,2.45,trim,10,'z');C(0,1.65,0,.22,.12,accent,12)}
  else if(slug==='field-artillery'){B(0,.44,0,1.5,.26,2.6,green);wheels(.84,[0]);C(0,1.04,.08,.37,.5,trim,12);C(0,1.18,1.1,.15,2.55,base,12,'z');C(0,1.18,2.37,.21,.16,dark,12,'z');for(const x of [-.6,.6])B(x,.22,-1.1,.15,.12,1.9,trim)}
  else if(slug==='radar-station'){platform();B(0,.68,0,2.2,.88,1.8,base);B(0,1.2,0,2.5,.2,2.2,trim);C(0,1.75,0,.12,1.1,light);R(0,2.35,0,.82,.09,glass,20,6,'x');C(0,2.35,0,.13,.3,accent,12,'x');for(const x of [-.65,.65])B(x,.79,1,.3,.32,.08,dark)}
  else if(slug==='watch-tower'){platform();for(const x of [-1,1])for(const z of [-1,1])B(x,1.5,z,.17,2.7,.17,trim);B(0,2.67,0,2.35,.2,2.35,base);B(0,3.4,0,2.4,.15,2.4,green);T(0,3.43,0,2.6,2.55,.48,dark);for(const x of [-1.02,1.02])for(const z of [-1.02,1.02])B(x,3.06,z,.1,.7,.1,trim);B(0,1.2,1.03,.3,2.1,.16,accent)}
  else if(slug==='supply-depot'){platform();B(0,.82,-.2,2.65,1.25,2.1,base);T(0,1.44,-.2,2.9,2.3,.45,trim);B(0,.78,1,.98,.8,.08,green);for(const x of [-.9,-.45,.6,1.05])B(x,.38,1.25,.33,.44,.5,accent);for(const x of [-1,1])C(x,.39,-1.02,.22,.52,red,9)}
  else if(slug==='command-hq'){platform();B(0,.78,0,2.4,1.1,2.2,base);B(0,1.8,-.32,1.45,1.02,1.4,trim);B(0,2.36,-.32,1.72,.15,1.65,accent);for(const z of [-.95,.9])for(const x of [-.8,.8])B(x,1.0,z,.38,.3,.08,glass);C(.8,2.84,-.6,.045,.9,light);S(.8,3.32,-.6,.12,glass)}
  else if(slug==='resource-refinery'){platform();B(-.35,.65,0,1.35,.8,2.3,base);for(const x of [.7,1.35])C(x,.98,-.5,.35,1.65,green,12);for(const z of [.15,.62])C(.8,1.76,z,.11,.36,trim,12,'z');B(-.4,1.22,.0,1.6,.17,2.4,accent);for(const z of [-.8,.8])C(-1.0,.35,z,.22,.55,red)}
  else if(slug==='missile-launcher'){B(0,.72,0,2.2,.62,3.4,green);wheels(1.05,[-1,1]);B(0,1.22,.35,1.55,.4,2.3,trim);for(const x of [-.45,.45]){C(x,1.69,.32,.23,1.75,base,12,'z');C(x,1.69,1.22,.25,.3,red,12,'z')}}
  else if(slug==='barracks'){platform();B(0,.77,0,2.5,1.1,2.1,green);T(0,1.32,0,2.7,2.3,.5,trim);B(0,.56,1.1,.54,.85,.1,dark);for(const x of [-.87,.87])B(x,.85,1.1,.32,.31,.09,glass);B(0,1.53,-.01,.8,.12,.8,accent)}
  else if(slug==='power-generator'){platform();B(0,.65,0,2.35,.77,2.1,trim);for(const x of [-.65,.65])C(x,1.2,0,.47,.62,accent,12);for(const z of [-.5,.5])B(0,.33,z,2.7,.11,.25,base);C(0,1.75,0,.3,.15,glass,12)}
  else if(slug==='fortified-gate'){platform();for(const x of [-1.08,1.08]){B(x,1.25,0,.74,2.35,1.2,base);B(x,2.45,0,.92,.18,1.4,trim);for(const z of [-.4,.4])B(x,2.64,z,.2,.23,.24,accent)}B(0,2.16,0,2.4,.35,1.05,trim);B(0,.91,0,1.4,1.45,.18,dark);B(0,.9,.14,1.25,1.35,.08,green)}
  else if(slug==='scout-vehicle'){B(0,.77,0,2,.65,3,green);wheels(1,[-.95,.93]);B(0,1.32,-.3,1.55,.63,1.35,base);B(0,1.32,.4,1.5,.42,.22,glass);C(0,1.74,-.3,.22,.27,dark);C(0,1.8,.16,.075,1.15,trim,8,'z')}
  else if(slug==='defense-turret'){platform();C(0,.51,0,.74,.65,trim);B(0,1.14,0,1.38,.65,1.37,green);for(const x of [-.3,.3])C(x,1.24,1.13,.13,1.78,dark,10,'z');B(0,1.57,0,.78,.22,.87,accent)}
  else if(slug==='landing-pad'){B(0,.16,0,3.5,.32,3.5,trim);B(0,.34,0,2.95,.06,2.95,base);R(0,.39,0,1.05,.08,accent,24);B(0,.4,0,.18,.04,2.5,light);B(0,.4,0,2.5,.04,.18,light);for(const x of [-1.35,1.35])for(const z of [-1.35,1.35])C(x,.44,z,.10,.13,red)}
  else if(slug==='communications-relay'){platform();B(0,.58,0,1.7,.7,1.5,base);for(const x of [-.75,.75])for(const z of [-.5,.5])B(x,1.49,z,.09,1.8,.09,trim);C(0,2.05,0,.08,1.6,light,8);R(0,2.73,0,.62,.075,glass,16,5,'x');for(const y of [1.5,2.3])B(0,y,0,1.5,.08,1.2,accent)}
 }
 if(kind==='turnbased'){
  const tile=(color)=>{H(0,.16,0,1.75,.32,trim);H(0,.36,0,1.67,.19,color)};
  if(slug.startsWith('hex-')){
   tile(slug==='hex-grass'?green:slug==='hex-desert'?accent:slug==='hex-snow'?light:dark);
   if(slug==='hex-grass'){for(const [x,z] of [[-.55,0],[.3,.4],[.7,-.55]]){C(x,.6,z,.09,.4,green,6);S(x,.87,z,.23,light,6,3)}}
   if(slug==='hex-desert'){for(const [x,z] of [[-.5,-.4],[.7,.35]]){C(x,.53,z,.28,.13,ground,7);C(x,.63,z,.2,.13,accent,7)}C(0,.74,0,.1,.62,green,7)}
   if(slug==='hex-snow'){for(const x of [-.55,.55]){C(x,.55,0,.17,.4,trim,7);C(x,.89,0,.45,.36,light,7, 'y',0)}}
   if(slug==='hex-lava'){for(const x of [-.65,.4])B(x,.51,x*.3,.48,.07,1.2,red);for(const x of [-.4,.65])C(x,.56,.45,.18,.25,accent,7)}
  }else if(slug.endsWith('-token')){
   H(0,.14,0,1.25,.25,trim);H(0,.37,0,1,.24,accent);
   if(slug==='knight-token'){C(0,.85,0,.35,.83,base,10);S(0,1.44,0,.36,light);C(0,1.58,0,.33,.13,trim,9);B(.5,.95,0,.11,1.15,.16,accent)}
   if(slug==='mage-token'){C(0,.83,0,.43,.85,base,10,'y',.17);S(0,1.43,0,.25,glass);C(0,1.73,0,.39,.43,accent,8,'y',0);B(.55,1.1,0,.09,1.3,.09,trim);S(.55,1.83,0,.21,glass)}
   if(slug==='archer-token'){C(0,.83,0,.32,.87,green,10);S(0,1.42,0,.26,light);R(.42,1.12,.02,.58,.07,accent,14,5,'x');B(.34,1.12,0,.06,1.06,.06,red)}
   if(slug==='guardian-token'){C(0,.86,0,.45,.98,base,10);S(0,1.46,0,.26,light);B(.4,1.0,0,.18,1.2,.7,trim);B(.48,1.06,0,.07,.64,.38,accent)}
  }else if(slug==='rune-altar'){tile(ground);C(0,.72,0,.72,.65,base,8);C(0,1.16,0,.58,.2,trim,8);for(let i=0;i<8;i++){const a=2*Math.PI*i/8;S(.5*Math.cos(a),1.28,.5*Math.sin(a),.09,glass,6,3)}S(0,1.48,0,.3,accent,8,4)}
  else if(slug==='treasure-chest'){H(0,.14,0,1.6,.2,trim);B(0,.7,0,1.7,.85,1.18,base);C(0,1.1,0,.64,1.62,green,12,'x');B(0,.76,.63,.17,.9,.1,accent);B(0,1.1,.67,.29,.25,.13,trim)}
  else if(slug==='ruined-tower'){tile(ground);C(0,1.1,0,.84,1.35,base,9);for(let i=0;i<6;i++){let a=2*Math.PI*i/6;C(.72*Math.cos(a),2.0,.72*Math.sin(a),.17,.7,trim,7)}C(0,1.83,0,.93,.17,accent,9);B(0,.75,.82,.4,.75,.12,dark)}
  else if(slug==='healing-shrine'){tile(green);for(const x of [-.65,.65])for(const z of [-.65,.65])C(x,1.03,z,.14,1.17,light,8);C(0,1.7,0,.96,.22,trim,10);S(0,1.35,0,.45,glass);C(0,.54,0,.61,.24,accent,10)}
  else if(slug==='crystal-obelisk'){tile(ground);C(0,.67,0,.6,.42,base,8);C(0,1.4,0,.45,1.2,glass,6,'y',.23);C(0,2.21,0,.23,.58,accent,6,'y',0);for(const x of [-.85,.85])S(x,.7,0,.24,glass,7,4)}
  else if(slug==='stone-golem'){H(0,.12,0,1.3,.23,trim);B(0,1.24,0,1.28,1.12,.96,base);B(0,2.0,0,.76,.66,.7,light);for(const x of [-.95,.95]){B(x,1.38,0,.58,.9,.58,base);B(x, .52,0,.56,.8,.62,trim)}B(-.18,2.1,.37,.13,.1,.08,glass);B(.18,2.1,.37,.13,.1,.08,glass)}
  else if(slug==='battle-banner'){tile(ground);C(0,1.2,0,.09,1.9,trim,8);B(.4,1.7,0,.78,.9,.09,red);B(.4,2.22,0,.82,.09,.13,accent);C(0,2.25,0,.14,.16,light,9)}
  else if(slug==='tactical-bridge'){for(const x of [-.9,.9])for(const z of [-1.1,1.1])C(x,.47,z,.14,.9,base,8);B(0,.91,0,2.25,.17,3,trim);for(const x of [-.95,.95]){B(x,1.2,0,.1,.64,3,base);for(const z of [-1.2,0,1.2])B(x,1.2,z,.1,.7,.1,light)}}
 }
 if(kind==='arcade'){
  if(slug==='hover-racer'){B(0,.65,0,1.65,.35,2.7,base);for(const x of [-.95,.95])B(x,.55,-.4,.55,.13,1.65,accent);B(0,1.03,-.28,.94,.5,1.03,glass);C(0,.68,1.35,.34,.72,red,12,'z');for(const x of [-.75,.75])S(x,.37,-.65,.19,glass)}
  else if(slug==='rocket-ship'){C(0,1.45,0,.58,2.25,base,12);C(0,2.85,0,.58,.95,red,12,'y',0);C(0,.17,0,.43,.75,accent,12,'y',0);for(let i=0;i<3;i++){let a=i*2*Math.PI/3;B(.67*Math.cos(a),.58,.67*Math.sin(a),.34,.86,.17,trim)}R(0,1.9,0,.42,.07,glass,14)}
  else if(slug==='pinball-bumper'){C(0,.25,0,1.12,.38,trim,18);C(0,.55,0,.89,.28,accent,18);C(0,.8,0,.7,.3,glass,18);S(0,1.0,0,.6,red,14,6);R(0,.7,0,.97,.09,light,18)}
  else if(slug==='arcade-coin'){C(0,1.2,0,1.04,.15,accent,20,'z');R(0,1.2,.12,.72,.095,light,20,5,'z');star(g,0,1.2,.2,.49,red);B(0,.13,0,1.65,.14,.58,trim)}
  else if(slug==='boost-pad'){B(0,.18,0,2.55,.36,2.55,trim);B(0,.39,0,2.25,.09,2.25,base);for(const x of [-.65,0,.65])B(x,.46,.05,.3,.03,1.85,accent);for(const z of [-1,1])B(0,.51,z,1.95,.09,.1,glass)}
  else if(slug==='speed-gate'){for(const x of [-1.1,1.1]){B(x,1.25,0,.33,2.5,.45,base);B(x,1.25,.32,.11,2.18,.06,glass)}B(0,2.42,0,2.65,.33,.48,trim);B(0,2.45,.32,2.1,.15,.08,accent);for(const x of [-.9,.9])S(x,2.4,.3,.16,red)}
  else if(slug==='neon-tower'){B(0,1.7,0,1.2,3.25,1.2,trim);for(const y of [.7,1.4,2.1,2.8]){B(0,y,.66,1.04,.085,.08,glass);B(.66,y,0,.08,.085,1.04,red)}C(0,3.48,0,.73,.25,accent,12)}
  else if(slug==='retro-controller'){B(0,.47,0,3,.55,1.53,base);for(const x of [-1.1,1.1])C(x,.38,0,.48,.65,base,12);B(-.7,.8,0,.66,.1,.22,light);B(-.7,.8,0,.22,.1,.63,light);for(const [x,z] of [[.6,-.35],[1,.05],[.6,.4]])C(x,.79,z,.16,.12,red,12)}
  else if(slug==='enemy-drone'){S(0,1.2,0,.88,base,12,6);S(0,1.23,.8,.42,red,12,6);for(const x of [-1.1,1.1]){B(x,1.2,0,.85,.18,.34,trim);C(x*1.35,1.3,0,.42,.07,glass,12)}C(0,.58,0,.22,.47,accent)}
  else if(slug==='starfighter'){B(0,.8,0,1,.55,2.8,base);B(0,1.18,-.55,.68,.39,1.2,glass);for(const x of [-1.3,1.3]){B(x,.62,.28,1.8,.11,1.3,trim);C(x,.61,-.85,.24,.58,red,10,'z')}C(0,.65,-1.5,.38,.75,accent,12,'z')}
  else if(slug==='power-star'){star(g,0,1.3,0,1.4,accent);R(0,1.3,0,1.12,.08,glass,20,6,'z');C(0,.18,0,.8,.27,base,14)}
  else if(slug==='asteroid'){S(0,1.2,0,1.15,base,8,4);for(const [x,y,z,r] of [[.5,1.8,.4,.38],[-.6,.8,.6,.46],[.7,.7,-.4,.32]])S(x,y,z,r,trim,7,3);for(const [x,y,z] of [[0,2,0],[-.75,1.4,-.4]])S(x,y,z,.22,accent,6,3)}
  else if(slug==='jump-platform'){B(0,.25,0,2.7,.48,2.7,base);C(0,.55,0,1.09,.15,trim,16);C(0,.73,0,.75,.18,glass,16);for(const x of [-1,1])for(const z of [-1,1])S(x,.55,z,.16,red)}
  else if(slug==='laser-cannon'){C(0,.36,0,.78,.58,trim,12);B(0,.95,0,1.55,.65,1.3,base);for(const x of [-.42,.42]){C(x,1.11,1.03,.19,1.45,glass,12,'z');C(x,1.11,1.75,.21,.25,red,12,'z')}S(0,1.39,0,.3,accent)}
  else if(slug==='energy-core'){C(0,.27,0,.96,.45,trim,14);R(0,1.35,0,1,.09,glass,22,6,'x');R(0,1.35,0,1,.09,red,22,6,'z');S(0,1.35,0,.52,accent,12,5);C(0,2.41,0,.26,.17,base)}
  else if(slug==='robot-runner'){C(0,1.2,0,.52,.95,base,10);S(0,1.94,0,.48,light,10,5);B(0,1.96,.4,.65,.16,.11,glass);for(const x of [-.7,.7]){C(x,1.24,0,.17,.68,accent);C(x*.6,.39,0,.18,.77,trim);B(x*.6,.11,.25,.42,.2,.75,red)}}
 }
 if(!g.size)throw Error('No mesh geometry '+slug);
 return g;
}
function utf8(source){const out=[];for(let i=0;i<source.length;i++){let c=source.codePointAt(i);if(c>65535)i++;if(c<128)out.push(c);else if(c<2048)out.push(192|c>>6,128|c&63);else if(c<65536)out.push(224|c>>12,128|c>>6&63,128|c&63);else out.push(240|c>>18,128|c>>12&63,128|c>>6&63,128|c&63)}return new Uint8Array(out)}
function glb(g,name){
 const materials=[],primitives=[],views=[],accessors=[],chunks=[];let length=0,totalTriangles=0;
 const append=values=>{
  const buffer=new Uint8Array(values.length*4),view=new DataView(buffer.buffer);
  values.forEach((v,i)=>view.setFloat32(i*4,v,true));
  views.push({buffer:0,byteOffset:length,byteLength:buffer.byteLength,target:34962});
  chunks.push(buffer);length+=buffer.byteLength;return views.length-1;
 };
 for(const [color,triangles] of g){
  const positions=[],normals=[];
  for(const t of triangles)for(const point of t.vertices){positions.push(...point);normals.push(...t.normal)}
  if(!positions.length)continue;
  const a=append(positions),b=append(normals),points=positions.length/3;
  const min=[0,1,2].map(k=>Math.min(...positions.filter((v,i)=>i%3===k)));
  const max=[0,1,2].map(k=>Math.max(...positions.filter((v,i)=>i%3===k)));
  accessors.push({bufferView:a,componentType:5126,count:points,type:'VEC3',min,max});
  accessors.push({bufferView:b,componentType:5126,count:points,type:'VEC3'});
  const hex=color.slice(1),rgba=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  materials.push({name:color,pbrMetallicRoughness:{baseColorFactor:[...rgba,1],metallicFactor:.12,roughnessFactor:.78},doubleSided:true});
  primitives.push({attributes:{POSITION:accessors.length-2,NORMAL:accessors.length-1},material:materials.length-1,mode:4});
  totalTriangles+=triangles.length;
 }
 const doc={asset:{version:'2.0',generator:'WarLike Original Genre Pack Generator 1.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name}],meshes:[{name,primitives}],materials,buffers:[{byteLength:length}],bufferViews:views,accessors};
 const bytes=utf8(JSON.stringify(doc)),jsonSize=(bytes.length+3)&~3,binSize=(length+3)&~3,total=12+8+jsonSize+8+binSize;
 const out=new Uint8Array(total),head=new DataView(out.buffer);
 const uint=(offset,value)=>head.setUint32(offset,value,true);
 uint(0,0x46546c67);uint(4,2);uint(8,total);uint(12,jsonSize);uint(16,0x4E4F534A);
 out.fill(32,20,20+jsonSize);out.set(bytes,20);
 uint(20+jsonSize,binSize);uint(24+jsonSize,0x004E4942);
 let at=28+jsonSize;for(const chunk of chunks){out.set(chunk,at);at+=chunk.length}
 return {bytes:out,triangles:totalTriangles};
}
function preview(g){
 const polys=[];let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
 const project=p=>{const x=(p[0]-p[2])*.78,y=(p[0]+p[2])*.32-p[1]*.87;minx=Math.min(minx,x);miny=Math.min(miny,y);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y);return[x,y]};
 const colors=c=>{const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),str=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');return str(...rgb)};
 for(const [color,triangles] of g)for(const tri of triangles){
  const projected=tri.vertices.map(project);const n=tri.normal;
  const light=.66+Math.max(0,n[0]*.34+n[1]*.5+n[2]*.25)*.32;
  const fill=colors('#'+[1,3,5].map(i=>(Math.max(0,Math.min(255,Math.floor(parseInt(color.slice(i,i+2),16)*light)))).toString(16).padStart(2,'0')).join(''));
  const depth=tri.vertices.reduce((sum,p)=>sum+p[0]*.6+p[2]*.85-p[1]*.2,0)/3;
  polys.push({projected,depth,fill});
 }
 const size=Math.max(maxx-minx,maxy-miny,.5),zoom=Math.min(105/(maxx-minx||1),108/(maxy-miny||1),90),cx=(minx+maxx)/2,cy=(miny+maxy)/2;
 polys.sort((a,b)=>a.depth-b.depth);
 const svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 165" role="img">','<rect width="220" height="165" fill="#1d273a"/>','<ellipse cx="110" cy="143" rx="66" ry="13" fill="#0d1424" opacity=".55"/>'];
 for(const poly of polys){const points=poly.projected.map(([x,y])=>[(110+(x-cx)*zoom).toFixed(1),(82+(y-cy)*zoom).toFixed(1)].join(',')).join(' ');svg.push('<polygon points="'+points+'" fill="'+poly.fill+'" stroke="#0a1425" stroke-width=".24" stroke-opacity=".35"/>')}
 svg.push('</svg>');return svg.join('');
}
export function generateWarLikeGenreModels(){
 const generated=[];
 for(const [genre,items] of Object.entries(specs)){
  for(const [slug,name,category] of items){
   const mesh=build(genre,slug,palettes[genre]),model=glb(mesh,name);
   generated.push({genre,slug,name,category,bytes:model.bytes,preview:preview(mesh),triangles:model.triangles});
  }
 }
 return generated;
}
export const originalPackSpecs=specs;
