const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'web-dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const name of ['index.html','driver-settings.js','firestore-client.js'])fs.copyFileSync(path.join(root,name),path.join(out,name));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('web-dist: index.html, driver-settings.js, firestore-client.js e .nojekyll; nenhum deploy executado.');
