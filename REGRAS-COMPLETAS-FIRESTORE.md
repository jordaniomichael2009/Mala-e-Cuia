# Regras completas — cancelamento antes do embarque

Projeto de destino autorizado: mobilidademalaecuia. Não aplicadas automaticamente nesta sessão por ausência de autenticação Firebase. Compatíveis com o cliente anterior schemaVersion 2; seguir ATUALIZACAO-CANCELAMENTO.md para a sequência e o console. Não criar documento de capacidade.

SHA-256 de firestore.rules: `20e6c767fe1de2110eac228de347b400a3a95e48a9532d6906d592cd403c8175`.

Distâncias continuam sendo estimativas do cliente, não verificadas por servidor.

```text
rules_version = '2';
// PROPOSTA SPARK: substitui as regras anteriores que exigiam Admin/Cloud Functions.
// NÃO APLICAR sem revisão e confirmação. Distâncias são estimativas do cliente.
service cloud.firestore {
 match /databases/{database}/documents {
  function signed() { return request.auth != null; }
  function own(u) { return signed() && request.auth.uid == u; }
  function role(u,t) { return get(/databases/$(database)/documents/perfis/$(u)).data.tipo == t; }
  function free(u) { return !exists(/databases/$(database)/documents/motoristas_ativos/$(u)) && !existsAfter(/databases/$(database)/documents/motoristas_ativos/$(u)); }
  function point(p) { return p is map && p.keys().hasOnly(['lat','lng']) && p.lat is number && p.lng is number && p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180; }
  function availabilityAfter(u,value) { return getAfter(/databases/$(database)/documents/disponibilidades/$(u)).data.disponivel == value; }
  function pairedAccept(u,id) {
   return !exists(/databases/$(database)/documents/motoristas_ativos/$(u))
    && getAfter(/databases/$(database)/documents/motoristas_ativos/$(u)).data.rideId == id
    && get(/databases/$(database)/documents/corridas_teste/$(id)).data.status == 'solicitada'
    && getAfter(/databases/$(database)/documents/corridas_teste/$(id)).data.status == 'aceita'
    && getAfter(/databases/$(database)/documents/corridas_teste/$(id)).data.driverId == u;
  }
  function pairedFinish(u,id) {
   return get(/databases/$(database)/documents/motoristas_ativos/$(u)).data.rideId == id
    && !existsAfter(/databases/$(database)/documents/motoristas_ativos/$(u))
    && get(/databases/$(database)/documents/corridas_teste/$(id)).data.status == 'embarcado'
    && getAfter(/databases/$(database)/documents/corridas_teste/$(id)).data.status == 'concluida'
    && getAfter(/databases/$(database)/documents/corridas_teste/$(id)).data.driverId == u;
  }
  function validCancellation(after,before) {
   return signed() && after.cancellation is map
    && after.cancellation.keys().hasOnly(['by','role','at'])
    && after.cancellation.by == request.auth.uid && after.cancellation.at == request.time
    && ((request.auth.uid == before.passengerId && after.cancellation.role == 'passageiro')
     || (request.auth.uid == before.driverId && after.cancellation.role == 'motorista'));
  }
  function pairedCancel(u,id) {
   let before = get(/databases/$(database)/documents/corridas_teste/$(id)).data;
   let after = getAfter(/databases/$(database)/documents/corridas_teste/$(id)).data;
   return before.get('schemaVersion',0) == 2 && before.driverId == u && before.status == 'aceita'
    && after.status == 'cancelada' && validCancellation(after,before)
    && get(/databases/$(database)/documents/motoristas_ativos/$(u)).data.rideId == id
    && !existsAfter(/databases/$(database)/documents/motoristas_ativos/$(u));
  }
  function cancelUpdate(before,after,id) {
   return before.get('schemaVersion',0) == 2 && after.status == 'cancelada'
    && after.diff(before).affectedKeys().hasOnly(['status','updatedAt','cancellation'])
    && after.updatedAt == request.time && validCancellation(after,before)
    && ((before.status == 'solicitada' && request.auth.uid == before.passengerId)
     || (before.status == 'aceita' && pairedCancel(before.driverId,id)
      && availabilityAfter(before.driverId,true)
      && getAfter(/databases/$(database)/documents/disponibilidades/$(before.driverId)).data.atualizadoEm == request.time));
  }
  function validConfig(c) {
   return c.keys().hasOnly(['base','vehicle','emptyRateCents','occupiedRateCents','version','updatedAt','position','positionAt'])
    && c.keys().hasAll(['base','vehicle','emptyRateCents','occupiedRateCents','version','updatedAt','position','positionAt'])
    && point(c.base) && c.vehicle in ['carro','moto','frete']
    && c.emptyRateCents is int && c.emptyRateCents >= 0 && c.emptyRateCents <= 10000
    && c.occupiedRateCents is int && c.occupiedRateCents >= 0 && c.occupiedRateCents <= 10000
    && c.version is int && c.version >= 1 && c.updatedAt == request.time
    && ((c.position == null && c.positionAt == null) || (point(c.position) && c.positionAt is timestamp));
  }
  function estimate(e,u,rideService) {
   let c = get(/databases/$(database)/documents/config_motoristas/$(u)).data;
   return e is map && e.keys().hasOnly(['source','currency','toPickupMeters','occupiedMeters','returnMeters','emptyRateCents','occupiedRateCents','totalCents','configVersion'])
    && e.source == 'client-estimate' && e.currency == 'BRL' && e.configVersion == c.version && c.vehicle == rideService
    && c.positionAt is timestamp && c.positionAt <= request.time && c.positionAt >= request.time - duration.value(15,'m')
    && e.toPickupMeters is int && e.toPickupMeters >= 0 && e.toPickupMeters <= 10000000
    && e.occupiedMeters is int && e.occupiedMeters >= 0 && e.occupiedMeters <= 10000000
    && e.returnMeters is int && e.returnMeters >= 0 && e.returnMeters <= 10000000
    && e.emptyRateCents == c.emptyRateCents && e.occupiedRateCents == c.occupiedRateCents
    && e.totalCents is int && e.totalCents == int(((e.toPickupMeters + e.returnMeters) * c.emptyRateCents + e.occupiedMeters * c.occupiedRateCents + 500) / 1000);
  }
  match /perfis/{u} {
   allow read: if own(u);
   allow create, update: if own(u) && free(u)
    && request.resource.data.keys().hasOnly(['nome','tipo','veiculo','atualizadoEm'])
    && request.resource.data.keys().hasAll(['nome','tipo','veiculo','atualizadoEm'])
    && request.resource.data.nome is string && request.resource.data.nome.size() >= 2 && request.resource.data.nome.size() <= 70
    && request.resource.data.tipo in ['passageiro','motorista'] && request.resource.data.veiculo in ['','carro','moto','frete']
    && request.resource.data.atualizadoEm == request.time;
  }
  match /config_motoristas/{u} {
   allow read: if own(u);
   allow create: if own(u) && role(u,'motorista') && free(u) && validConfig(request.resource.data)
    && request.resource.data.version == 1 && (request.resource.data.positionAt == null || request.resource.data.positionAt == request.time);
   allow update: if own(u) && role(u,'motorista') && free(u) && validConfig(request.resource.data)
    && request.resource.data.version == resource.data.version + 1
    && ((request.resource.data.position == resource.data.position && request.resource.data.positionAt == resource.data.positionAt)
     || (point(request.resource.data.position) && request.resource.data.positionAt == request.time));
  }
  match /disponibilidades/{u} {
   allow read: if own(u);
   allow create, update: if signed()
    && request.resource.data.keys().hasOnly(['disponivel','atualizadoEm'])
    && request.resource.data.keys().hasAll(['disponivel','atualizadoEm'])
    && request.resource.data.disponivel is bool && request.resource.data.atualizadoEm == request.time
    && ((own(u) && role(u,'motorista') && (free(u)
      || (request.resource.data.disponivel == false && pairedAccept(u,getAfter(/databases/$(database)/documents/motoristas_ativos/$(u)).data.rideId))
      || (request.resource.data.disponivel == true && pairedFinish(u,get(/databases/$(database)/documents/motoristas_ativos/$(u)).data.rideId))))
     || (request.resource.data.disponivel == true
      && pairedCancel(u,get(/databases/$(database)/documents/motoristas_ativos/$(u)).data.rideId)));
  }
  match /corridas_teste/{id} {
   allow read: if signed() && (resource.data.passengerId == request.auth.uid || resource.data.driverId == request.auth.uid);
   allow create: if signed() && request.resource.data.passengerId == request.auth.uid && role(request.auth.uid,'passageiro')
    && request.resource.data.keys().hasOnly(['schemaVersion','passengerId','driverId','status','service','pickup','destination','pickupLabel','destinationLabel','estimate','createdAt','updatedAt'])
    && request.resource.data.schemaVersion == 2
    && request.resource.data.driverId is string && request.resource.data.driverId != request.auth.uid && role(request.resource.data.driverId,'motorista')
    && request.resource.data.status == 'solicitada' && request.resource.data.estimate == null
    && request.resource.data['service'] in ['carro','moto','frete']
    && get(/databases/$(database)/documents/config_motoristas/$(request.resource.data.driverId)).data.vehicle == request.resource.data['service']
    && get(/databases/$(database)/documents/disponibilidades/$(request.resource.data.driverId)).data.disponivel == true
    && !exists(/databases/$(database)/documents/motoristas_ativos/$(request.resource.data.driverId))
    && point(request.resource.data.pickup) && point(request.resource.data.destination)
    && request.resource.data.pickupLabel is string && request.resource.data.pickupLabel.size() >= 3 && request.resource.data.pickupLabel.size() <= 120
    && request.resource.data.destinationLabel is string && request.resource.data.destinationLabel.size() >= 3 && request.resource.data.destinationLabel.size() <= 120
    && request.resource.data.createdAt == request.time && request.resource.data.updatedAt == request.time;
   allow update: if cancelUpdate(resource.data,request.resource.data,id);
   allow update: if own(resource.data.driverId) && role(resource.data.driverId,'motorista')
    && resource.data.get('schemaVersion',0) == 2
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','updatedAt','estimate'])
    && request.resource.data.updatedAt == request.time
    && ((resource.data.status == 'solicitada' && request.resource.data.status == 'aceita'
      && get(/databases/$(database)/documents/disponibilidades/$(resource.data.driverId)).data.disponivel == true
      && pairedAccept(resource.data.driverId,id) && availabilityAfter(resource.data.driverId,false)
      && estimate(request.resource.data.estimate,resource.data.driverId,resource.data['service']))
     || (resource.data.status == 'solicitada' && request.resource.data.status == 'recusada' && request.resource.data.estimate == resource.data.estimate)
     || (resource.data.status == 'aceita' && request.resource.data.status == 'embarcado' && request.resource.data.estimate == resource.data.estimate
      && get(/databases/$(database)/documents/motoristas_ativos/$(resource.data.driverId)).data.rideId == id
      && getAfter(/databases/$(database)/documents/motoristas_ativos/$(resource.data.driverId)).data.rideId == id && availabilityAfter(resource.data.driverId,false))
     || (resource.data.status == 'embarcado' && request.resource.data.status == 'concluida' && request.resource.data.estimate == resource.data.estimate
      && pairedFinish(resource.data.driverId,id) && availabilityAfter(resource.data.driverId,true)
      && getAfter(/databases/$(database)/documents/disponibilidades/$(resource.data.driverId)).data.atualizadoEm == request.time));
  }
  match /motoristas_ativos/{u} {
   allow read: if own(u);
   allow create: if own(u) && role(u,'motorista') && request.resource.data.keys().hasOnly(['rideId','updatedAt'])
    && request.resource.data.rideId is string && request.resource.data.updatedAt == request.time
    && pairedAccept(u,request.resource.data.rideId) && availabilityAfter(u,false);
   allow delete: if signed() && availabilityAfter(u,true)
    && ((own(u) && role(u,'motorista') && pairedFinish(u,resource.data.rideId)) || pairedCancel(u,resource.data.rideId));
  }
  // Read-only permission probe; no document creation is required for feature detection.
  match /system_capabilities/{id} { allow get: if signed() && id == 'cancellation-v1'; }
  match /{document=**} { allow read, write: if false; }
 }
}
```
