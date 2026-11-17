// Isolated browser check: no request reaches Firebase or other external services.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const baseURL=process.env.MALA_TEST_BASE_URL||'http://localhost/';const appDir=process.env.MALA_TEST_DIR||'.';

(async()=>{
const browser=await chromium.launch({...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),headless:true,args:['--no-sandbox']});
const pages=[],store=new Map(),listeners=[];
const moduleCode=`
export const initializeApp=()=>({});export const getAuth=()=>({currentUser:window.testUser});export const getFirestore=()=>({});
export const doc=(db,...parts)=>parts.length?({path:parts.join('/'),id:parts.join('/').split('/').pop()}):({path:db.path+'/'+crypto.randomUUID(),get id(){return this.path.split('/').pop()}});export const collection=(db,path)=>({path});
export const where=(field,op,value)=>({field,value});export const query=(ref,filter)=>({...ref,filter});
export const serverTimestamp=()=>({__timestamp:Date.now()});
const revive=data=>{if(!data||typeof data!=='object')return data;if(data.__timestamp)return {...data,toMillis:()=>data.__timestamp};if(Array.isArray(data))return data.map(revive);return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,revive(v)]));};
const snap=(data)=>({exists:()=>data!==null,data:()=>revive(data)});
export const getDoc=async ref=>snap(await window.readDoc(ref.path));export const getDocFromServer=getDoc;
export const setDoc=(ref,data)=>window.writeDoc(ref.path,data);
export const onAuthStateChanged=(auth,cb)=>{cb(window.testUser);return ()=>{}};
export const onSnapshot=(ref,cb,err)=>{const id=++window.subId;window.subs[id]={ref,cb};window.subscribe(id,ref);return ()=>{delete window.subs[id]}};
window.deliver=(id,data)=>{const sub=window.subs[id];if(!sub)return;sub.cb(sub.ref.filter?{docs:data.map(([path,data])=>({id:path.split('/').pop(),data:()=>revive(data)}))}:snap(data));};
export const runTransaction=async(db,fn)=>{const writes=[];const result=await fn({get:getDoc,set:(ref,data)=>writes.push({op:'set',path:ref.path,data}),update:(ref,data)=>writes.push({op:'update',path:ref.path,data}),delete:ref=>writes.push({op:'delete',path:ref.path})});await window.commitTransaction(writes);return result;};
export const signInWithEmailAndPassword=()=>{};export const createUserWithEmailAndPassword=()=>{};export const sendPasswordResetEmail=()=>{};export const signOut=()=>{};
`;
async function deliver(l){const data=l.ref.filter?[...store].filter(([path,d])=>path.startsWith(l.ref.path+'/')&&d[l.ref.filter.field]===l.ref.filter.value):store.get(l.ref.path)||null;await l.page.evaluate(({id,data})=>window.deliver(id,data),{id:l.id,data});}
async function write(path,data){store.set(path,data);for(const l of listeners)await deliver(l);}
async function createPage(uid,{stale=false,cancellationAvailable=true}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},geolocation:{latitude:-7.55,longitude:-38.5},permissions:['geolocation']});
 const page=await context.newPage();pages.push(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.testErrors=errors;
 await page.exposeBinding('commitTransaction',async(_,writes)=>{for(const w of writes){if(w.op==='delete')store.delete(w.path);else store.set(w.path,w.op==='set'?w.data:{...store.get(w.path),...w.data});}for(const l of [...listeners])await deliver(l);});
 await page.exposeBinding('readDoc',(_,path)=>{if(path==='system_capabilities/cancellation-v1'&&!cancellationAvailable)throw Error('permission-denied');return store.get(path)||null;});
 await page.exposeBinding('writeDoc',(_,path,data)=>write(path,data));
 await page.exposeBinding('subscribe',async(_,id,ref)=>{const l={page,id,ref};listeners.push(l);await deliver(l)});
 await page.addInitScript(({uid,stale})=>{window.testUser={uid,email:uid+'@example.test'};window.subs={};window.subId=0;if(stale){localStorage.setItem('mc_demo_empty_rate','99');localStorage.setItem('mc_demo_occupied_rate','98');localStorage.setItem('mc_demo_base',JSON.stringify({lat:1,lng:2}));}},{uid,stale});
 await page.route('**/*',route=>{const url=route.request().url();if([baseURL+'driver-settings.js',baseURL+'firestore-client.js'].includes(url))return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(appDir,url.slice(baseURL.length)),'utf8')});if(url.startsWith(baseURL))return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(appDir,'index.html'),'utf8')});if(url.includes('gstatic.com/firebasejs/'))return route.fulfill({contentType:'text/javascript',body:moduleCode});if(url.includes('router.project-osrm.org'))return route.fulfill({json:{code:'Ok',routes:[{distance:10000}]}});if(url.includes('ibge.gov.br'))return route.fulfill({json:[{nome:'Conceição'}]});if(url.includes('nominatim.openstreetmap.org'))return route.fulfill({json:[{lat:'-7.6',lon:'-38.4',display_name:'Hospital de teste'}]});return route.abort();});
 await page.goto(baseURL);await page.waitForFunction(()=>window.mcDriverSettings?.getState().loaded);return page;
}
const passenger=await createPage('passenger'),driver=await createPage('driver');
// Saving the first profile must activate the ride panel without logout/reload.
for(const [page,role,name] of [[passenger,'passageiro','Pessoa passageira'],[driver,'motorista','Pessoa motorista']]){
 await page.click('[data-view="account"]');await page.fill('#profileName',name);await page.selectOption('#profileRole',role);await page.click('#saveProfileBtn');await page.waitForFunction(()=>document.querySelector('#rideFeedback').textContent.includes('Conectado'));
}
await driver.click('[data-role="motorista"]');assert(await driver.locator('[data-view="account"]').isVisible());await driver.click('[data-view="account"]');assert(await driver.locator('#accountView').isVisible());assert(!(await driver.locator('#driverView').isVisible()));await driver.click('[data-view="home"]');assert(await driver.locator('#driverView').isVisible());
await driver.fill('#driverEmptyRate','1.20');await driver.fill('#driverRate','2.50');await driver.click('#driverGpsBtn');await driver.waitForFunction(()=>localStorage.getItem('mc_demo_driver_position'));await driver.click('#setBaseGps');await driver.waitForFunction(()=>localStorage.getItem('mc_demo_base'));await driver.click('#syncDriverBackend');await driver.waitForFunction(()=>document.querySelector('#driverBackendStatus').textContent.includes('sincronizados'));
const driver2=await createPage('driver',{stale:true});
assert.equal(await driver2.inputValue('#profileEmptyRate'),'1.2');assert.equal(await driver2.inputValue('#driverEmptyRate'),'1.2');assert.equal(await driver2.inputValue('#driverRate'),'2.5');
assert.deepEqual(await driver2.evaluate(()=>window.mcDriverSettings.getState().draft.base),{lat:-7.55,lng:-38.5});
const serverVersion=store.get('config_motoristas/driver').version;
await driver2.click('[data-view="account"]');await driver2.fill('#profileEmptyRate','1.30');assert.equal(await driver2.inputValue('#driverEmptyRate'),'1.30');await driver2.click('#saveProfileBtn');await driver2.waitForFunction(()=>document.querySelector('#profileFeedback').textContent.includes('Perfil e configuração'));
assert.equal(store.get('config_motoristas/driver').emptyRateCents,130);
// Stale first phone must fail rather than overwrite phone 2. Server values reload after conflict.
await driver.fill('#driverEmptyRate','1.40');await driver.click('#syncDriverBackend');await driver.waitForFunction(()=>document.querySelector('#driverBackendStatus').textContent.includes('Não foi possível salvar'));
assert.equal(store.get('config_motoristas/driver').emptyRateCents,130);assert.equal(await driver.inputValue('#driverEmptyRate'),'1.3');assert.notEqual(store.get('config_motoristas/driver').version,serverVersion);
// Restore rate explicitly using the latest server version.
await driver.fill('#driverEmptyRate','1.20');await driver.click('#syncDriverBackend');await driver.waitForFunction(()=>document.querySelector('#driverBackendStatus').textContent.includes('sincronizados'));
await driver.click('#driverOnlineBtn');await driver.waitForFunction(()=>document.querySelector('#driverOnlineBadge').textContent.includes('Disponível'));
await passenger.click('[data-view="home"]');await passenger.click('#gpsBtn');await passenger.waitForFunction(()=>window.mcPassengerPosition());await passenger.fill('#destination','Hospital');await passenger.click('#searchStreetBtn');await passenger.click('.result-item');
await passenger.fill('#rideTargetUid','driver');await passenger.fill('#ridePickupText','Praça de teste');await passenger.fill('#rideDestinationText','Hospital de teste');await passenger.click('#rideSend');await driver.getByRole('button',{name:'✅ Aceitar e abrir Maps até o passageiro'}).waitFor();
// Avoid navigating the test page away; exercise the transaction while recording Maps URL.
await driver.route('https://www.google.com/**',route=>route.fulfill({status:204}));
await driver.getByRole('button',{name:'✅ Aceitar e abrir Maps até o passageiro'}).click();await passenger.waitForFunction(()=>document.querySelector('#rideOutgoing').textContent.includes('Motorista aceitou'));
assert(await driver.locator('#activeRidePanel').isVisible());assert.equal(await driver.locator('#activeRideTitle').textContent(),'Corrida ativa');assert.equal(await driver.locator('#rideIncoming [data-state]').first().getAttribute('data-state'),'aceita');assert.equal(await passenger.getByRole('button',{name:'Cancelar corrida',exact:true}).count(),1);
await driver.getByRole('button',{name:'👤 Confirmar embarque',exact:true}).click();await passenger.waitForFunction(()=>document.querySelector('#rideOutgoing').textContent.includes('Em viagem.'));
assert.equal(await passenger.getByRole('button',{name:'Cancelar corrida',exact:true}).count(),0);assert.equal(await driver.getByRole('button',{name:'Cancelar corrida',exact:true}).count(),0);
await driver.getByRole('button',{name:'🏁 Finalizar corrida'}).click();await passenger.waitForFunction(()=>document.querySelector('#rideOutgoing').textContent.includes('Viagem encerrada.'));
for(const page of pages){assert.deepEqual(page.testErrors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
assert.equal([...store.values()].filter(d=>d.status==='concluida').length,1);assert.equal(store.has('motoristas_ativos/driver'),false);assert.equal(store.get('disponibilidades/driver').disponivel,true);assert.equal([...store.values()].find(d=>d.status==='concluida').estimate.totalCents,3700);await passenger.click('[data-view="trips"]');assert(await passenger.locator('#tripHistory').textContent().then(t=>t.includes('Concluída')));
await passenger.click('[data-view="home"]');
const currentPending=()=>[...store.entries()].find(([key,d])=>key.startsWith('corridas_teste/')&&d.status==='solicitada');
async function send(){await passenger.click('#rideSend');await driver.getByRole('button',{name:'✅ Aceitar e abrir Maps até o passageiro'}).waitFor();return currentPending()[0].split('/').pop();}
async function confirmedCancel(page){page.once('dialog',async dialog=>{assert.equal(dialog.type(),'confirm');await dialog.accept();});await page.getByRole('button',{name:'Cancelar corrida',exact:true}).click();}
let waiting=await send();assert.equal(await driver.getByRole('button',{name:'Cancelar corrida',exact:true}).count(),0);assert(await driver.getByRole('button',{name:'Recusar solicitação'}).isVisible());
passenger.once('dialog',dialog=>dialog.dismiss());await passenger.getByRole('button',{name:'Cancelar corrida',exact:true}).click();assert.equal(store.get('corridas_teste/'+waiting).status,'solicitada');
await confirmedCancel(passenger);await driver.waitForFunction(()=>document.querySelector('#rideIncoming').textContent.includes('Cancelada por passageiro'));assert.equal(store.get('corridas_teste/'+waiting).cancellation.by,'passenger');assert.equal(store.has('motoristas_ativos/driver'),false);
for(const actor of [passenger,driver]){const id=await send();await driver.getByRole('button',{name:'✅ Aceitar e abrir Maps até o passageiro'}).click();await driver.getByRole('button',{name:'Cancelar corrida',exact:true}).waitFor();await confirmedCancel(actor);await passenger.waitForFunction(id=>document.querySelector('[data-ride-id="'+id+'"]')?.dataset.state==='cancelada',id);const result=store.get('corridas_teste/'+id);assert.equal(result.cancellation.by,actor===driver?'driver':'passenger');assert(result.cancellation.at.__timestamp);assert.equal(store.has('motoristas_ativos/driver'),false);assert.equal(store.get('disponibilidades/driver').disponivel,true);}
await passenger.click('[data-view="trips"]');assert((await passenger.locator('#tripHistory').textContent()).includes('Cancelada por motorista'));assert((await passenger.locator('#tripHistory').textContent()).includes('Cancelada por passageiro'));
assert(!(await passenger.locator('#activeRidePanel').isVisible()));
await passenger.click('[data-view="home"]');waiting=await send();
const beforeUpgrade=await createPage('passenger',{cancellationAvailable:false});await beforeUpgrade.waitForFunction(()=>document.querySelector('#cancellationStatus').textContent.includes('indisponível'));assert(await beforeUpgrade.getByRole('button',{name:'Cancelar corrida',exact:true}).isDisabled());
await confirmedCancel(passenger);await beforeUpgrade.waitForFunction(id=>document.querySelector('[data-ride-id="'+id+'"]')?.dataset.state==='cancelada',waiting);
for(const page of pages){assert.deepEqual(page.testErrors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
console.log('PASS: mobile lifecycle and synchronization; active ride spotlight/order; cancellation confirmation/dismissal; passenger waiting/accepted and driver accepted cancellation; audit/history seen by both participants; old-rule feature gate; no external services.');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
