import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { randomUUID, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
const actions = {grant:'grant', revoke:'revoke', check:'check'};
async function main() {
  const [action,...args]=process.argv.slice(2), options={};
  if(!actions[action]) throw Error('Choose grant, revoke or check.');
  for(const arg of args) {
    const match=/^--(email|days|reason|deployment|production|admin)=(.+)$/.exec(arg);
    if(!match || options[match[1]]!==undefined) throw Error('Use unique --name=value options.');
    options[match[1]]=match[2];
  }
  const deployment=options.deployment;
  if(!['blissful-dotterel-906','sensible-avocet-370'].includes(deployment)) throw Error('Explicit --deployment=blissful-dotterel-906 (testing) or sensible-avocet-370 (production) required.');
  if(deployment==='sensible-avocet-370' && options.production!=='sensible-avocet-370') throw Error('Production also requires --production=sensible-avocet-370.');
  if(!options.email) throw Error('--email required.');
  const email=options.email.trim().toLowerCase();
  // Ignore inherited deployment keys/targets; use the operator’s Convex login and explicit deployment.
  const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^CONVEX_/.test(k)));
  function run(name,args) {
    const result=spawnSync('./node_modules/.bin/convex',['run',`complimentary:${name}`,JSON.stringify(args),'--deployment',deployment,'--codegen','disable','--typecheck','disable'],{env,encoding:'utf8'});
    if(result.status!==0) throw Error('Administrator operation failed. Check Convex login, deployment and access state. Raw CLI errors withheld to protect credentials.');
    try { return JSON.parse(result.stdout); } catch { throw Error('Unexpected server response. No automatic retry; check access.'); }
  }
  const current=run('check',{email});
  console.log(JSON.stringify({deployment,...current,expiry:current.paidUntil===null?null:new Date(current.paidUntil).toISOString()},null,2));
  if(action==='check') return;
  if(!options.admin?.trim()) throw Error('--admin required: accountable operator label (not automatically verified personal identity). Convex credentials authenticate deployment administrator rights.');
  // Attribute writes to the exact logged-in CLI credential, plus the operator’s label.
  // The one-way fingerprint is not a credential and cannot authenticate requests.
  let credential;
  try { credential=JSON.parse(readFileSync(`${homedir()}/.convex/config.json`,'utf8')).accessToken; } catch { throw Error('Convex administrator login required.'); }
  if(!credential || options.admin.length>80) throw Error('Administrator login and operator label of at most 80 characters required.');
  const administrator=`${options.admin.trim()} [convex-login:${createHash('sha256').update(credential).digest('hex')}]`;
  credential=undefined;
  let payload;
  if(action==='grant') {
    const days=Number(options.days);
    if(!Number.isInteger(days)||days<1||days>3650||!options.reason?.trim()) throw Error('--days=1..3650 and --reason required.');
    const newPaidUntil=Math.max(Date.now(),current.paidUntil??0)+days*86400000;
    payload={email,expectedUser:current.userId,expectedPaidUntil:current.paidUntil,expectedPaidFrom:current.paidFrom,newPaidUntil,reason:options.reason,administrator,operationId:randomUUID()};
    console.log(`Proposed expiry: ${new Date(newPaidUntil).toISOString()}; reason: ${options.reason}`);
  } else {
    const grant=run('previewRevoke',{email});
    if(!grant) throw Error('No unrevoked complimentary grant.');
    console.log('Original grant:',JSON.stringify(grant,null,2));
    payload={email,grantId:grant.grantId,administrator};
  }
  if(!process.stdin.isTTY) throw Error('Interactive terminal required; confirmation cannot be supplied by a pipe.');
  const terminal=createInterface({input:process.stdin,output:process.stdout});
  const phrase=`${action.toUpperCase()} ${email} ${deployment}`;
  try { if(await terminal.question(`Type exactly "${phrase}" to confirm: `)!==phrase) throw Error('Cancelled; no change made.'); } finally {terminal.close();}
  run(action,payload);
  console.log('Completed. Verified current access:');console.log(JSON.stringify(run('check',{email}),null,2));
}
main().catch(error=>{console.error(error.message);console.error('No automatic retry. If a write was attempted, use admin:check-access to verify its outcome.');process.exitCode=1;});
