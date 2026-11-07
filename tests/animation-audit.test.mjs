import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectGlbAnimations} from '../animation-audit.js';
function glb(document){
 const encoded=new TextEncoder().encode(JSON.stringify({asset:{version:'2.0'},...document}));
 const padded=Math.ceil(encoded.length/4)*4, buffer=new ArrayBuffer(20+padded);
 const view=new DataView(buffer);
 view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,buffer.byteLength,true);
 view.setUint32(12,padded,true);view.setUint32(16,0x4e4f534a,true);
 new Uint8Array(buffer,20).fill(0x20);new Uint8Array(buffer,20,encoded.length).set(encoded);
 return buffer;
}
test('identifies structurally playable animation channels',()=>{
 const sample=glb({nodes:[{}],accessors:[{count:3},{count:3}],animations:[{name:'Idle',samplers:[{input:0,output:1}],channels:[{sampler:0,target:{node:0,path:'translation'}}]}]});
 const result=inspectGlbAnimations(sample);
 assert.equal(result.valid,1);assert.equal(result.invalid,0);assert.equal(result.clips[0].name,'Idle');
});
test('identifies missing animation targets and empty animations',()=>{
 const broken=glb({nodes:[{}],accessors:[],animations:[{name:'Broken',samplers:[],channels:[{sampler:0,target:{node:5,path:'rotation'}}]}]});
 assert.equal(inspectGlbAnimations(broken).invalid,1);
 assert.equal(inspectGlbAnimations(glb({nodes:[]})).clips.length,0);
});
test('rejects invalid GLB headers',()=>{
 assert.throws(()=>inspectGlbAnimations(new ArrayBuffer(20)),/GLB/);
});
