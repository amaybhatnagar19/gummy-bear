import { spawnSync } from 'node:child_process';
import { dailyReport } from '../convex/analyticsRules.ts';
function read(name, args={}) {
  const result=spawnSync('npx',['convex','run','--prod','--codegen','disable',`analytics:${name}`,JSON.stringify(args)],{encoding:'utf8',maxBuffer:16*1024*1024});
  if(result.status!==0)throw new Error(`Production report failed: ${name}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}
function pages(name) {
  const rows=[];let cursor=null;
  for(;;){const result=read(name,{paginationOpts:{numItems:250,cursor}});rows.push(...result.page);if(result.isDone)return rows;cursor=result.continueCursor;}
}
const asOf=Date.now(),startedAt=read('settings');
if(startedAt===null)throw new Error('Production photo tracking is not enabled.');
console.log(JSON.stringify({deployment:'production',...dailyReport(pages('runsPage'),pages('usersPage'),pages('paymentsPage'),pages('visitorsPage'),startedAt,asOf)},null,2));
