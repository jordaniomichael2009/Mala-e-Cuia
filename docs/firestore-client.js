// All writes use the signed-in Firebase client. Security is enforced by firestore.rules.
// Route distances are supplied by the driver browser and are NOT verified by a server.
export function createFirestoreClient({sdk,db,auth,routeKm}) {
 const {doc,collection,runTransaction,serverTimestamp}=sdk;
 const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
 const uid=()=>auth.currentUser?.uid||fail('unauthenticated','Faça login.');
 const ref=(c,id)=>doc(db,c,id);
 const exists=s=>s.exists();
 async function configureDriver(d){const u=uid();
 if(!Object.hasOwn(d,'expectedVersion'))fail('invalid-argument','Carregue a configuração primeiro.');
 return runTransaction(db,async tx=>{const target=ref('config_motoristas',u),snap=await tx.get(target),lock=await tx.get(ref('motoristas_ativos',u));
 const current=exists(snap)?snap.data():null;if(exists(lock))fail('failed-precondition','Finalize a corrida antes de alterar a configuração.');
 if((current?.version??null)!==d.expectedVersion)fail('aborted','Configuração alterada em outro aparelho.');
 if(d.emptyRate===''||d.occupiedRate===''||![d.emptyRate,d.occupiedRate].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100))fail('invalid-argument','Tarifas entre R$ 0 e R$ 100.');
 const next={base:d.base,vehicle:d.vehicle,emptyRateCents:Math.round(d.emptyRate*100),occupiedRateCents:Math.round(d.occupiedRate*100),version:(current?.version??0)+1,updatedAt:serverTimestamp(),position:d.position??current?.position??null,positionAt:d.position?serverTimestamp():current?.positionAt??null};
 tx.set(target,next);return {saved:true,version:next.version};});}
 async function requestRide(d){const u=uid(),target=doc(collection(db,'corridas_teste'));
 const ride={schemaVersion:2,passengerId:u,driverId:d.driverId,status:'solicitada',service:d.service,pickup:d.pickup,destination:d.destination,pickupLabel:d.pickupLabel,destinationLabel:d.destinationLabel,estimate:null,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
 await runTransaction(db,async tx=>{const p=await tx.get(ref('perfis',u));if(!exists(p)||p.data().tipo!=='passageiro')fail('permission-denied','Salve perfil Passageiro.');tx.set(target,ride);});return {id:target.id};}
 const meters=km=>{if(!Number.isFinite(km)||km<0||km>10000)fail('unavailable','Distância inválida.');return Math.round(km*1000);};
 async function executeRideStep(d,report){const u=uid(),target=ref('corridas_teste',d.rideId);let prepared=null;
 report('checking','Verificando sessão, corrida, configuração e GPS...');
 if(d.next==='aceita'){
  // Read only this driver's private configuration; the passenger never reads the base.
  const {getDocFromServer}=sdk;const [r,c]=await Promise.all([getDocFromServer(target),getDocFromServer(ref('config_motoristas',u))]);
  if(!exists(r)||!exists(c))fail('failed-precondition','Corrida ou configuração não encontrada.');
  const ride=r.data(),cfg=c.data();if(ride.schemaVersion!==2)fail('failed-precondition','Corrida antiga: somente consulta; recrie o pedido após revisar a migração.');if(ride.driverId!==u||ride.status!=='solicitada')fail('permission-denied','Solicitação não disponível para esta conta.');
  if(!cfg.position||typeof cfg.positionAt?.toMillis!=='function'||Date.now()-cfg.positionAt.toMillis()>900000)fail('failed-precondition','GPS do motorista ausente ou desatualizado. Toque em Verificar meu GPS e depois em Salvar configuração da conta e atualizar GPS.');
  report('route-pickup','Calculando rota 1/3: motorista até o passageiro...');const toPickupMeters=meters(await routeKm(cfg.position,ride.pickup));
  report('route-destination','Calculando rota 2/3: embarque até o destino...');const occupiedMeters=meters(await routeKm(ride.pickup,ride.destination));
  report('route-base','Calculando rota 3/3: destino até a base...');const returnMeters=meters(await routeKm(ride.destination,cfg.base));
  prepared={source:'client-estimate',currency:'BRL',toPickupMeters,occupiedMeters,returnMeters,emptyRateCents:cfg.emptyRateCents,occupiedRateCents:cfg.occupiedRateCents,totalCents:Math.round(((toPickupMeters+returnMeters)*cfg.emptyRateCents+occupiedMeters*cfg.occupiedRateCents)/1000),configVersion:cfg.version};
 }
 report('transaction','Aguardando confirmação da gravação no Firestore...');
 const committed=await runTransaction(db,async tx=>{
  const rideSnap=await tx.get(target),lockRef=ref('motoristas_ativos',u),lock=await tx.get(lockRef),availabilityRef=ref('disponibilidades',u),available=await tx.get(availabilityRef);
  if(!exists(rideSnap))fail('not-found','Corrida não encontrada.');const ride=rideSnap.data();
  if(ride.schemaVersion!==2)fail('failed-precondition','Corrida antiga: somente consulta.');
  if(ride.driverId!==u)fail('permission-denied','Apenas o motorista designado.');
  const transitions={solicitada:['aceita','recusada'],aceita:['embarcado'],embarcado:['concluida']};if(!transitions[ride.status]?.includes(d.next))fail('failed-precondition','Etapa já alterada ou inválida.');
  if(d.next==='aceita'){
   const config=await tx.get(ref('config_motoristas',u));
   if(exists(lock)||!exists(available)||available.data().disponivel!==true)fail('failed-precondition','Motorista ocupado ou indisponível.');
   if(!exists(config)||config.data().version!==prepared.configVersion)fail('aborted','Configuração mudou durante o cálculo. Tente novamente.');
   tx.set(lockRef,{rideId:d.rideId,updatedAt:serverTimestamp()});tx.set(availabilityRef,{disponivel:false,atualizadoEm:serverTimestamp()});
  }else if(d.next!=='recusada'){
   if(!exists(lock)||lock.data().rideId!==d.rideId)fail('failed-precondition','Reserva inconsistente.');
   if(d.next==='concluida'){tx.delete(lockRef);tx.set(availabilityRef,{disponivel:true,atualizadoEm:serverTimestamp()});}
  }
  tx.update(target,{status:d.next,updatedAt:serverTimestamp(),...(prepared?{estimate:prepared}:{})});return {status:d.next,serverConfirmed:true,ride:{...ride,id:d.rideId,status:d.next,...(prepared?{estimate:prepared}:{}),updatedAt:null}};
 });
 report('confirmed','Gravação confirmada pelo Firestore.');
 try{d.onConfirmed?.(committed.ride);}catch(e){console.warn('Falha ao atualizar a interface após confirmação',e);}
 return committed;}
 async function rideStep(d){let phase='checking';const report=(next,message)=>{phase=next;try{d.onProgress?.({phase:next,message});}catch(e){console.warn('Falha no indicador de progresso',e);}};
 try{return await executeRideStep(d,report);}catch(error){const wrapped=new Error(error?.message||'Falha na operação.');wrapped.code=typeof error?.code==='string'?error.code:(['AbortError','TimeoutError'].includes(error?.name)?'routes/timeout':phase.startsWith('route-')?'routes/unavailable':'unknown');wrapped.operationPhase=phase;wrapped.cause=error;throw wrapped;}}
 async function cancelRide(d){const u=uid(),target=ref('corridas_teste',d.rideId);
 return runTransaction(db,async tx=>{const snap=await tx.get(target);if(!exists(snap))fail('not-found','Corrida não encontrada.');const ride=snap.data();
 if(ride.schemaVersion!==2)fail('failed-precondition','Corrida antiga: somente consulta.');
 const passenger=ride.passengerId===u,driver=ride.driverId===u;
 if(!passenger&&!driver)fail('permission-denied','Você não participa desta corrida.');
 if(!['solicitada','aceita'].includes(ride.status)||(driver&&ride.status!=='aceita'))fail('failed-precondition','Não é possível cancelar nesta etapa.');
 const released=ride.status==='aceita';
 // The passenger need not read the driver's private reservation. Rules validate its exact ID.
 if(released){tx.delete(ref('motoristas_ativos',ride.driverId));tx.set(ref('disponibilidades',ride.driverId),{disponivel:true,atualizadoEm:serverTimestamp()});}
 tx.update(target,{status:'cancelada',updatedAt:serverTimestamp(),cancellation:{by:u,role:passenger?'passageiro':'motorista',at:serverTimestamp()}});
 return {status:'cancelada',released};});}
 async function cancellationSupported(){uid();try{await sdk.getDocFromServer(ref('system_capabilities','cancellation-v1'));return true;}catch{return false;}}
 return {configureDriver,requestRide,rideStep,cancelRide,cancellationSupported};
}

export async function browserRouteKm(a,b){if(a.lat===b.lat&&a.lng===b.lng)return 0;
 const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false&steps=false`,{signal:AbortSignal.timeout(13000)});
 if(!response.ok)throw Error('Serviço de rotas indisponível.');const result=await response.json(),distance=result.routes?.[0]?.distance;
 if(result.code!=='Ok'||!Number.isFinite(distance)||distance<0)throw Error('Rota não encontrada.');return distance/1000;
}
