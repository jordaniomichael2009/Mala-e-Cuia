'use strict';
// requestRide ignores passenger-supplied price/rates/distances. Driver configuration requires an explicit matching revision.
const crypto=require('node:crypto');
function service({db,now=Date.now,routeKm,fail=(code,message)=>Object.assign(new Error(message),{code})}){
 const error=(c,m)=>{throw fail(c,m)};
 const point=p=>!!p&&typeof p.lat==='number'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&typeof p.lng==='number'&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180;
 const uid=u=>{if(!u)error('unauthenticated','Faça login.');return u};
 const ref=(c,id)=>db.collection(c).doc(id);
 const read=async(tx,c,id)=>{const snap=await tx.get(ref(c,id));return snap.exists?snap.data():null};
 const rate=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100;
 const active=l=>!!l?.rideId;
 async function configureDriver(u,d){uid(u);if(!Object.hasOwn(d,'expectedVersion')||(d.expectedVersion!==null&&typeof d.expectedVersion!=='string')||!point(d.base)||!rate(d.emptyRate)||!rate(d.occupiedRate)||!['carro','moto','frete'].includes(d.vehicle)||(d.position!==undefined&&!point(d.position)))error('invalid-argument','Confira a versão, base, tarifas e veículo.');
 return db.runTransaction(async tx=>{const p=await read(tx,'perfis',u),lock=await read(tx,'motoristas_ativos',u),current=await read(tx,'config_motoristas',u);
 if(p?.tipo!=='motorista')error('permission-denied','Salve perfil Motorista.');if(active(lock))error('failed-precondition','Finalize a corrida antes de alterar a configuração.');
 if((current?.version??null)!==d.expectedVersion)error('aborted','Configuração alterada em outro aparelho. Recarregue antes de salvar.');
 const value={base:{lat:d.base.lat,lng:d.base.lng},emptyRateCents:Math.round(d.emptyRate*100),occupiedRateCents:Math.round(d.occupiedRate*100),vehicle:d.vehicle,version:crypto.randomUUID()};
 if(d.position){value.position={lat:d.position.lat,lng:d.position.lng};value.positionAt=now();}else if(current?.position){value.position=current.position;value.positionAt=current.positionAt;}
 tx.set(ref('config_motoristas',u),value);return {saved:true,version:value.version};});}
 const eligible=(p,c,a,t)=>{if(p?.tipo!=='motorista'||!c||a?.disponivel!==true)error('failed-precondition','Motorista sem configuração ou indisponível.');if(!point(c.position)||!point(c.base)||!Number.isFinite(c.positionAt)||t-c.positionAt>900000||t<c.positionAt)error('failed-precondition','Motorista precisa atualizar o GPS.');if(!Number.isInteger(c.emptyRateCents)||!Number.isInteger(c.occupiedRateCents)||c.emptyRateCents<0||c.occupiedRateCents<0||c.emptyRateCents>10000||c.occupiedRateCents>10000)error('failed-precondition','Tarifas inválidas.');};
 async function requestRide(u,d){uid(u);if(typeof d.driverId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(d.driverId)||d.driverId===u||!point(d.pickup)||!point(d.destination)||!['carro','moto','frete'].includes(d.service)||![d.pickupLabel,d.destinationLabel].every(x=>typeof x==='string'&&x.trim().length>=3&&x.length<=120))error('invalid-argument','Confira os dados da solicitação.');
 // Initial read before network routing; a transaction below revalidates its version.
 const [p,c,a,pass]=await Promise.all([ref('perfis',d.driverId).get(),ref('config_motoristas',d.driverId).get(),ref('disponibilidades',d.driverId).get(),ref('perfis',u).get()]);
 if(pass.data()?.tipo!=='passageiro')error('permission-denied','Use perfil Passageiro.');const config=c.data();eligible(p.data(),config,a.data(),now());if(config.vehicle!==d.service)error('failed-precondition','Serviço diferente do veículo do motorista.');
 const distances=[];for(const [from,to] of [[config.position,d.pickup],[d.pickup,d.destination],[d.destination,config.base]]){const km=await routeKm(from,to);if(!Number.isFinite(km)||km<0||km>10000)error('unavailable','Rota inválida.');distances.push(Math.round(km*1000));}
 const emptyRateCents=config.emptyRateCents,occupiedRateCents=config.occupiedRateCents;
 const totalCents=Math.round(((distances[0]+distances[2])*emptyRateCents+distances[1]*occupiedRateCents)/1000);
 const rideRef=db.collection('corridas_teste').doc(),t=now();
 await db.runTransaction(async tx=>{const current=await read(tx,'config_motoristas',d.driverId),driver=await read(tx,'perfis',d.driverId),availability=await read(tx,'disponibilidades',d.driverId),passenger=await read(tx,'perfis',u),lock=await read(tx,'motoristas_ativos',d.driverId);
 eligible(driver,current,availability,t);if(passenger?.tipo!=='passageiro')error('permission-denied','Perfil Passageiro obrigatório.');if(current.version!==config.version||active(lock))error('failed-precondition','Motorista alterado ou ocupado. Atualize e tente novamente.');
 tx.set(rideRef,{passengerId:u,driverId:d.driverId,status:'solicitada',service:d.service,pickup:{lat:d.pickup.lat,lng:d.pickup.lng},destination:{lat:d.destination.lat,lng:d.destination.lng},pickupLabel:d.pickupLabel.trim(),destinationLabel:d.destinationLabel.trim(),createdAt:t,updatedAt:t,quote:{currency:'BRL',totalCents,distancesMeters:distances,emptyRateCents,occupiedRateCents,configVersion:config.version,expiresAt:t+600000}});});return {id:rideRef.id,totalCents};}
 async function rideStep(u,d){uid(u);if(typeof d.rideId!=='string'||!/^[-\w]{1,128}$/.test(d.rideId)||!['aceita','recusada','embarcado','concluida'].includes(d.next))error('invalid-argument','Etapa inválida.');
 return db.runTransaction(async tx=>{const ride=await read(tx,'corridas_teste',d.rideId),lock=await read(tx,'motoristas_ativos',u),availability=await read(tx,'disponibilidades',u),profile=await read(tx,'perfis',u);if(!ride||ride.driverId!==u||profile?.tipo!=='motorista')error('permission-denied','Apenas o motorista designado pode atualizar.');
 const allowed={solicitada:['aceita','recusada'],aceita:['embarcado'],embarcado:['concluida']};if(!allowed[ride.status]?.includes(d.next))error('failed-precondition','Etapa já alterada.');
 const t=now();if(d.next==='aceita'){
 if(availability?.disponivel!==true||active(lock))error('failed-precondition','Motorista indisponível ou com corrida ativa.');
 if(!Number.isInteger(ride.quote?.totalCents)||ride.quote.totalCents<0||!Number.isFinite(ride.quote?.expiresAt)||ride.quote.expiresAt<t)error('failed-precondition','Cotação inválida ou expirada. Envie nova solicitação.');
 tx.set(ref('motoristas_ativos',u),{rideId:d.rideId,updatedAt:t});tx.set(ref('disponibilidades',u),{disponivel:false,atualizadoEm:t});
 }else if(d.next!=='recusada'){
 if(lock?.rideId!==d.rideId)error('failed-precondition','Reserva do motorista inconsistente.');
 if(d.next==='concluida'){tx.delete(ref('motoristas_ativos',u));tx.set(ref('disponibilidades',u),{disponivel:true,atualizadoEm:t});}}
 tx.update(ref('corridas_teste',d.rideId),{status:d.next,updatedAt:t});return {status:d.next};});}
 return {configureDriver,requestRide,rideStep};
}
module.exports={service};
