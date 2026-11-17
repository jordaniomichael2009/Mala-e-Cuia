// Local build only: does not call GitHub, Pages or Firebase.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),output=path.join(root,'docs');const names=['index.html','driver-settings.js','firestore-client.js','.nojekyll'];
if(fs.existsSync(output)&&fs.readdirSync(output).some(name=>!names.includes(name)))throw Error('docs contém arquivos não gerados; não sobrescrever sem revisão.');
const built=spawnSync(process.execPath,['scripts/build-web.cjs'],{cwd:root,stdio:'inherit'});if(built.status!==0)process.exit(built.status||1);fs.mkdirSync(output,{recursive:true});
const files=names.map(name=>{const bytes=fs.readFileSync(path.join(root,'web-dist',name));fs.writeFileSync(path.join(output,name),bytes);return {path:'docs/'+name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
fs.writeFileSync(path.join(root,'PAGES-MANIFEST.json'),JSON.stringify({branch:'teste-sem-blaze',source:'/docs',mode:'pages-payload-cancellation-v1',files},null,2)+'\n');console.log('Preparados 4 arquivos em docs; manifesto na raiz. Nenhum push ou deploy.');
