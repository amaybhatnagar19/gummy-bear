import { spawnSync } from 'node:child_process';
import { expect, test } from 'vitest';
// Every case fails before the CLI can launch Convex or make a network connection.
for(const args of [
 ['grant','--email=x@example.com','--days=365','--reason=Test'],
 ['grant','--email=x@example.com','--deployment=sensible-avocet-370'],
 ['check','--email=x@example.com','--deployment=unexpected-deployment'],
 ['grant','--deployment=blissful-dotterel-906','--push=true'],
 ['grant','--deployment=blissful-dotterel-906','--deployment=sensible-avocet-370'],
]) test(`CLI refuses unsafe targeting/options: ${args.join(' ')}`,()=>{
 const result=spawnSync(process.execPath,['scripts/admin-paid.mjs',...args],{encoding:'utf8'});
 expect(result.status).toBe(1);
 expect(result.stderr).toMatch(/Explicit|Production also requires|unique/);
 expect(result.stdout).toBe('');
});
