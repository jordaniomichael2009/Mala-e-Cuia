'use strict';
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {service}=require('./service.cjs');
initializeApp();
async function routeKm(a,b){if(a.lat===b.lat&&a.lng===b.lng)return 0;
 try{const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false&steps=false`,{signal:AbortSignal.timeout(13000)});
 if(!response.ok)throw Error('HTTP '+response.status);const result=await response.json(),distance=result.routes?.[0]?.distance;if(result.code!=='Ok'||!Number.isFinite(distance)||distance<0)throw Error('Sem rota');return distance/1000;
 }catch{throw new HttpsError('unavailable','Serviço de rotas indisponível. Tente novamente.');}}
const api=service({db:getFirestore(),routeKm,fail:(code,message)=>new HttpsError(code,message)});
for(const name of ['configureDriver','requestRide','rideStep'])exports[name]=onCall({region:'southamerica-east1',maxInstances:10},req=>api[name](req.auth?.uid,req.data||{}));
