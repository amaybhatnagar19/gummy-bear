import { spawn } from 'node:child_process';
import { verifyRemoteTestingProject, testingProcessEnvironment, validateTestingCommand, prepareTestingWorkspace } from './testing-environment.mjs';
const command = validateTestingCommand(process.argv.slice(2));
const env = await verifyRemoteTestingProject();
if (command === 'verify') { console.log('Verified separate testing project and development deployment; credential values withheld.'); }
else {
  const workspace = await prepareTestingWorkspace(env);
  const args = ['dev', '--env-file', '.env.v1-testing', '--tail-logs', 'disable', '--once'];
  const child = spawn('./node_modules/.bin/convex', args, { cwd: workspace, env: testingProcessEnvironment(process.env, env), stdio: ['inherit', 'pipe', 'pipe'] });
  // CLI logs can contain credentials on errors. Redact testing key, never stream raw logs.
  const redact = value => value.split(env.CONVEX_DEPLOY_KEY).join('[testing credential withheld]').replace(/(?:dev|prod|preview):[^\s|]+\|[^\s]+/g, '[deployment credential withheld]');
  for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    let pending = '';
    stream.on('data', data => {
      pending += data.toString();
      let end;
      while ((end = pending.indexOf('\n')) !== -1) { output.write(redact(pending.slice(0, end + 1))); pending = pending.slice(end + 1); }
    });
    stream.on('end', () => { if (pending) output.write(redact(pending)); });
  }
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
