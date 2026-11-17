// Account configuration is authoritative. Browser storage is never an input here.
export function createDriverSettings({readServer,writeServer,render}) {
 let token=0;
 const state={uid:null,loaded:false,busy:false,version:null,draft:null,dirty:false,error:''};
 const emit=()=>render({...state,draft:state.draft?structuredClone(state.draft):null});
 const reset=uid=>Object.assign(state,{uid,loaded:false,busy:false,version:null,draft:null,dirty:false,error:''});
 async function load(uid){const generation=++token;reset(uid);emit();if(!uid)return;
 try{const config=await readServer(uid);if(generation!==token)return;
 if(config){const p=config.base;const validRate=n=>Number.isInteger(n)&&n>=0&&n<=10000;if(typeof config.version!=='string'||!config.version||!p||typeof p.lat!=='number'||typeof p.lng!=='number'||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180||!validRate(config.emptyRateCents)||!validRate(config.occupiedRateCents)||!['carro','moto','frete'].includes(config.vehicle))throw Error('Configuração do servidor inválida; nenhuma substituição automática será feita.');}
 state.version=config?.version??null;
 state.draft=config?{emptyRate:config.emptyRateCents/100,occupiedRate:config.occupiedRateCents/100,base:config.base,vehicle:config.vehicle}:{emptyRate:'',occupiedRate:'',base:null,vehicle:null};state.loaded=true;
 }catch(e){if(generation!==token)return;state.error='Não foi possível carregar a configuração do servidor. Alterações bloqueadas. '+e.message;}
 emit();}
 function edit(patch){if(!state.loaded||state.busy)throw Error('Carregue a configuração do servidor antes de alterar.');Object.assign(state.draft,patch);state.dirty=true;state.error='';emit();}
 async function save({position,vehicle}={}){if(!state.uid||!state.loaded||state.busy)throw Error('Configuração não carregada ou operação em andamento.');
 const generation=token,uid=state.uid,draft=structuredClone(state.draft);
 if(draft.emptyRate===''||draft.occupiedRate===''||!draft.base)throw Error('Preencha as duas tarifas e cadastre a base.');
 state.busy=true;emit();
 try{await writeServer({expectedVersion:state.version,base:draft.base,emptyRate:Number(draft.emptyRate),occupiedRate:Number(draft.occupiedRate),vehicle:vehicle||draft.vehicle,...(position?{position}:{} )});if(generation===token)await load(uid);
 }catch(e){if(generation===token){if((e.code||'').endsWith('aborted')){await load(uid);state.error='Configuração alterada em outro aparelho. Valores do servidor restaurados; confira e tente novamente.';}else{state.error=e.message;state.busy=false;}emit();}throw e;}
 }
 emit();return {load,edit,save,getState:()=>({...state,draft:state.draft?structuredClone(state.draft):null})};
}
