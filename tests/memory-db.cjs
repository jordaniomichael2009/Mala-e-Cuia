// Serializable in-memory adapter for the service contract, not a Firestore emulator.
function memoryDb(){const values=new Map();let serial=0,tail=Promise.resolve();
const snapshot=path=>({exists:values.has(path),data:()=>values.get(path)});
const doc=path=>({path,id:path.split('/').pop(),get:async()=>snapshot(path)});
const db={collection:c=>({doc:id=>doc(c+'/'+(id||'ride'+ ++serial))}),async runTransaction(fn){const previous=tail;let release;tail=new Promise(r=>release=r);await previous;const writes=[];try{const result=await fn({get:async r=>snapshot(r.path),set:(r,d)=>writes.push(()=>values.set(r.path,d)),update:(r,d)=>writes.push(()=>values.set(r.path,{...values.get(r.path),...d})),delete:r=>writes.push(()=>values.delete(r.path))});writes.forEach(f=>f());return result}finally{release()}}};return {db,values};}
module.exports={memoryDb};
