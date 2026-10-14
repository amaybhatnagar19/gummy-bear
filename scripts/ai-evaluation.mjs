import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { verifyRemoteTestingProject } from './testing-environment.mjs';
import { evaluationCases, evaluationPilotIds, evaluationAlternativeIds } from '../shared/evaluationCorpus.ts';
import { EVALUATION_MAX_MICROS } from '../shared/aiEvaluation.ts';
const command = process.argv[2] ?? 'check';
if (process.argv.length > 3 || !['check', 'pilot', 'continue'].includes(command)) throw new Error('Use check, pilot or continue only; arbitrary targets and credentials are not accepted.');
const env = await verifyRemoteTestingProject();
const client = new ConvexHttpClient(env.CONVEX_URL); client.setAdminAuth(env.CONVEX_DEPLOY_KEY);
let status;
try { status = await client.query(makeFunctionReference('aiEvaluation:status'), {}); }
catch { console.log('Evaluation backend is not installed in the verified testing deployment. No provider request made.'); process.exitCode = 2; }
if (status) {
  const blockers = [...status.blockers];
  if (status.corpusReady < 20) blockers.push('20–30 distinct approved photographs');
  if (status.halted) blockers.push('unreconciled evaluation reservation/usage');
  console.log(JSON.stringify({ mode: command, model: 'gpt-6-luna', approvedBudgetUSD: 10, reservedUSD: status.reservedMicros / 1e6, reconciledProviderUSD:status.providerCostMicros===null?null:status.providerCostMicros/1e6,reservationHeadroomUSD: Math.max(0, EVALUATION_MAX_MICROS - status.effectiveReservedMicros) / 1e6, corpusReady: status.corpusReady, blockers }, null, 2));
  if (command !== 'check' && blockers.length) { console.log('Live evaluation blocked. Follow AI_EVALUATION_REPORT.md; verification flags are not substitutes for missing approvals/evidence.'); process.exitCode = 2; }
  else if (command !== 'check') {
    const folder = resolve('.ai-evaluation'); mkdirSync(folder, { recursive: true, mode: 0o700 }); chmodSync(folder, 0o700);
    const path = resolve(folder, 'state.json');
    const state = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { slots: [], results: [] };
    const save = () => { writeFileSync(path, JSON.stringify(state, null, 2), { mode: 0o600 }); chmodSync(path, 0o600); };
    // State is numeric usage + operator proof only. Separate local review files
    // contain filtered benchmark results, never images or raw provider envelopes.
    if (command === 'continue' && (state.pilotReviewed !== true || state.providerCostsReconciled !== true || !Number.isFinite(state.providerCostUSD) || state.providerCostUSD < 0 || state.providerCostUSD > 10 || state.results.filter(row=>row.complete).length < 3)) throw new Error('Review the local filtered pilot results and reconcile project costs before marking the review record. No batch started.');
    if(command==='continue')await client.mutation(makeFunctionReference('aiEvaluation:reconcile'),{projectId:status.projectId,providerCostMicros:Math.ceil(state.providerCostUSD*1e6)});
    const selected = command === 'pilot' ? evaluationPilotIds.map(id => evaluationCases.find(c => c.id === id)) : evaluationCases;
    // Prevalidate every selected case before creating slots or transmitting photos.
    if(selected.some(item=>!item?.licenseVerified||!item.privacyReviewed||!item.imageSha256||!item.asset))throw new Error('A selected corpus case is incomplete. No batch started.');
    const numbers = value => value ? { latencyMs: value.latencyMs, inputTokens: value.inputTokens, outputTokens: value.outputTokens, tokenCostEstimateMicros: value.tokenCostMicros, acceptedActivities: value.activities?.length ?? 0, rejectedActivities: value.rejectedActivities, invoiceReconciled: false } : null;
    // No automatic retries. All spending controls are in the server action.
    for (const [index, item] of selected.entries()) {
      if (!item?.licenseVerified || !item.privacyReviewed || !item.imageSha256 || !item.asset) throw new Error('A selected corpus case is incomplete. No request sent for it.');
      if (state.results.some(row => row.caseId === item.id && row.complete)) continue;
      const slot = Math.floor(index / 8);
      while (state.slots.length <= slot) { state.slots.push((await client.mutation(makeFunctionReference('testingAccess:invite'), { evaluation: true })).capability); save(); }
      const image = 'data:image/jpeg;base64,' + readFileSync(resolve(item.asset)).toString('base64');
      let row=state.results.find(row=>row.caseId===item.id);
      if(!row){row={caseId:item.id,complete:false,recognition:null,generation:null,humanRecognitionReview:null,humanActivityReview:null};state.results.push(row);}
      const reviewPath=resolve(folder,`${item.id}-review.json`);
      const review=existsSync(reviewPath)?JSON.parse(readFileSync(reviewPath,'utf8')):{caseId:item.id,expectedLabels:item.expectedLabels,confirmedToys:item.confirmedToys};
      const saveReview=()=>{writeFileSync(reviewPath,JSON.stringify(review,null,2),{mode:0o600});chmodSync(reviewPath,0o600);};
      if(!row.recognition){const result=await client.action(makeFunctionReference('aiEvaluation:run'), { invitation: state.slots[slot], caseId: item.id, kind: 'recognition', image, previous: [] });row.recognition=numbers(result);review.recognizedToys=result.toys;saveReview();save();}
      if(item.generationAllowed&&!row.generation){const result=await client.action(makeFunctionReference('aiEvaluation:run'), { invitation: state.slots[slot], caseId: item.id, kind: 'generation', image: '', previous: [] });row.generation=numbers(result);review.activities=result.activities;review.limitation=result.limitation;saveReview();save();}
      row.complete=true;save();
      console.log(`Finished ${item.id}; numeric usage recorded. Human quality review still required.`);
    }
    // One deliberate alternative probe in the pilot; six total in the full run.
    // Four probes plus six primary generations in slot zero fit its daily ten.
    const probes=command==='pilot'?['case-03']:evaluationAlternativeIds;
    for(const caseId of probes){
      const item=evaluationCases.find(c=>c.id===caseId);const row=state.results.find(r=>r.caseId===caseId);
      if(row?.alternative)continue;
      const reviewPath=resolve(folder,`${caseId}-review.json`);const review=existsSync(reviewPath)?JSON.parse(readFileSync(reviewPath,'utf8')):null;
      if(!item?.generationAllowed||!row?.complete||!review?.activities?.length)throw new Error('Alternative probe needs prior valid ideas. Pause for review; no filler or automatic retry.');
      const slot=Math.floor(evaluationCases.findIndex(c=>c.id===caseId)/8);
      const result=await client.action(makeFunctionReference('aiEvaluation:run'),{invitation:state.slots[slot],caseId,kind:'generation',image:'',previous:review.activities});
      row.alternative=numbers(result);review.alternativeActivities=result.activities;review.alternativeLimitation=result.limitation;
      writeFileSync(reviewPath,JSON.stringify(review,null,2),{mode:0o600});chmodSync(reviewPath,0o600);save();
    }
    console.log(command === 'pilot' ? 'Pilot requests finished; pause for human output review and actual project billing reconciliation before continue.' : 'Approved case requests finished; complete human recognition/activity scoring and reconcile actual project charges.');
  }
}
