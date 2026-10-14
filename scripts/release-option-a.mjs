// Never invoked during preparation. The only publish operation is static upload.
import {execFileSync} from 'node:child_process';
import {loadEnv} from 'vite';
import {validateProductionBuild,requireSafeDeploy,requireCleanRelease} from './production-preflight.mjs';
import {verifyOptionA} from './prepare-option-a.mjs';
export const optionAUploadArguments=Object.freeze(['node_modules/@convex-dev/static-hosting/dist/cli/index.js','upload','--dist','dist-option-a','--prod','--component','staticHosting']);
if(process.argv[1]?.endsWith('/release-option-a.mjs')){
 const env=loadEnv('production',process.cwd(),'');validateProductionBuild(env);
 requireSafeDeploy(env.GUMMY_RELEASE_APPROVED_COMMIT,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
 const clean=args=>{try{execFileSync('git',args,{stdio:'pipe'});return true;}catch{return false;}};
 const untracked=execFileSync('git',['ls-files','--others','--exclude-standard','-z','--','src','convex','shared','scripts','public'],{encoding:'utf8'}).split('\0').filter(p=>p&&p!=='public/payments/upi-qr.png.jpg');
 requireCleanRelease(clean(['diff','--quiet']),clean(['diff','--cached','--quiet']),untracked.length);
 execFileSync(process.execPath,['scripts/production-preflight.mjs'],{stdio:'inherit'});
 execFileSync('npm',['run','build:option-a'],{stdio:'inherit'});verifyOptionA('dist-option-a');
 execFileSync(process.execPath,[...optionAUploadArguments],{stdio:'inherit'});
}
