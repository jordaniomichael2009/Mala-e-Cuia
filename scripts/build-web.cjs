const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'web-dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const name of ['driver-settings.js','firestore-client.js']){const content=fs.readFileSync(path.join(root,name));const hash=crypto.createHash('sha256').update(content).digest('hex').slice(0,16);fs.writeFileSync(path.join(out,name),content);html=html.replaceAll("'./"+name+"'","'./"+name+'?v='+hash+"'");}
fs.writeFileSync(path.join(out,'index.html'),html);fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('web-dist: index.html, módulos com importações versionadas e .nojekyll; nenhum deploy executado.');
