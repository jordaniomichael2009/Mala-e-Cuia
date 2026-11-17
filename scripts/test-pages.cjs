const {spawnSync}=require('node:child_process');
const build=spawnSync(process.execPath,['scripts/prepare-pages.cjs'],{stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
const result=spawnSync(process.execPath,['tests/local-flow.cjs'],{stdio:'inherit',env:{...process.env,MALA_TEST_BASE_URL:'http://localhost/Mala-e-Cuia/',MALA_TEST_DIR:'docs'}});process.exit(result.status??1);
