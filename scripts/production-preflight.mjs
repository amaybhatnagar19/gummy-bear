import {loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {productionTarget as target} from '../shared/productionTarget.js';
export function validateProductionBuild(env){
  const declaration=env.CONVEX_DEPLOYMENT?.split(' #')[0];
  const configuredDev=declaration===`dev:${target.developmentDeploymentName}`&&env.CONVEX_URL===target.developmentCloudUrl&&env.CONVEX_SITE_URL===target.developmentSiteUrl;
  const configuredProd=declaration===`prod:${target.deploymentName}`&&env.CONVEX_URL===target.cloudUrl&&env.CONVEX_SITE_URL===target.siteUrl;
  if((!configuredDev&&!configuredProd)||(env.VITE_CONVEX_URL&&env.VITE_CONVEX_URL!==target.cloudUrl))throw new Error('Release target differs from the read-verified original project. No build or release permitted; values withheld.');
  if(env.CONVEX_DEPLOY_KEY&&!env.CONVEX_DEPLOY_KEY.startsWith(`prod:${target.deploymentName}|`))throw new Error('Unverified deployment credential scope; values withheld.');
  if(Object.keys(env).some(n=>n.startsWith('VITE_')&&n!=='VITE_CONVEX_URL'))throw new Error('Unapproved frontend environment variable; values withheld.');
  return target;
}
export function requireSafeDeploy(approvedCommit,currentCommit){
  if(target.deploymentType!=='prod'||! /^[a-f0-9]{40}$/.test(approvedCommit??'')||approvedCommit!==currentCommit)throw new Error('Release blocked: explicit owner approval of this exact commit is required. No deployment command was started.');
}
export function requireCleanRelease(trackedClean,stagedClean,untrackedSourceCount){
  if(!trackedClean||!stagedClean||untrackedSourceCount)throw new Error('Release blocked: reviewed source must be committed and unchanged. No deployment command was started.');
}
function cleanGit(args){try{execFileSync('git',args,{stdio:'pipe'});return true;}catch{return false;}}
async function verifyRemoteTarget(){
  const token=JSON.parse(readFileSync(homedir()+'/.convex/config.json','utf8')).accessToken;
  for(const [kind,url]of[['project',`https://api.convex.dev/v1/projects/${target.projectId}`],['deployment',`https://api.convex.dev/v1/deployments/${target.deploymentName}`]]){
    const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Remote release metadata verification failed; no deployment permitted.');const d=await r.json();
    if(kind==='project'?(d.id!==target.projectId||d.teamId!==target.teamId||d.prodDeploymentName!==target.deploymentName):(d.projectId!==target.projectId||d.deploymentType!=='prod'))throw new Error('Remote production target mismatch; no deployment permitted.');
  }
}
if(process.argv[1]?.endsWith('/production-preflight.mjs')){
  const env=loadEnv('production',process.cwd(),'');validateProductionBuild(env);
  if(process.argv.includes('--before-deploy')){
    requireSafeDeploy(env.GUMMY_RELEASE_APPROVED_COMMIT,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
    const untracked=execFileSync('git',['ls-files','--others','--exclude-standard','-z','--','src','convex','shared','scripts'],{encoding:'utf8'}).split('\0').filter(Boolean);
    requireCleanRelease(cleanGit(['diff','--quiet']),cleanGit(['diff','--cached','--quiet']),untracked.length);
  }
  await verifyRemoteTarget();
  console.log('Existing production target verified. No deployment or environment writes performed.');
}
