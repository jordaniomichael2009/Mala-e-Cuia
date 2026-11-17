const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'web-dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const name of ['index.html','driver-settings.js','firestore-client.js'])fs.copyFileSync(path.join(root,name),path.join(out,name));
console.log('web-dist contém somente HTML e módulo público; nenhum backend ou teste será hospedado.');
