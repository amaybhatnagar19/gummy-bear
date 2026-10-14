import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { ConvexError, v } from 'convex/values';
import { evaluationBlockers, requireEvaluation } from './evaluationPolicy';
import { evaluationCases } from '../shared/evaluationCorpus';
import { EVALUATION_MODEL, EVALUATION_PRICE_VERSION, EVALUATION_INPUT_CAP, EVALUATION_RESERVE_MICROS, EVALUATION_MAX_MICROS, tokenCostMicros, conservativeRequestMicros, effectiveReservedMicros } from '../shared/aiEvaluation';
import { requireTestingPrivacyOperation } from './privacyAccess';
import { activityRequest, parseGeneratedBody } from './play';
import { recognitionRequest, parseRecognitionBody } from './recognition';
import { activityValidator } from './activityResponses';
const kind = v.union(v.literal('recognition'), v.literal('generation'));
const corpusReady = () => new Set(evaluationCases.filter(c => c.licenseVerified && c.imageSha256 && c.asset).map(c => c.imageSha256)).size;
export const status = internalQuery({ args: {}, returns: v.object({ blockers: v.array(v.string()), corpusReady: v.number(), budgetCeilingMicros: v.number(), reservedMicros: v.number(), effectiveReservedMicros:v.number(), providerCostMicros:v.union(v.number(),v.null()), projectId:v.union(v.string(),v.null()), halted: v.boolean() }), handler: async ctx => {
  const ledger = await ctx.db.query('testingBudget').withIndex('by_key', q => q.eq('key', 'initial-14-days')).unique();
  const blockers=evaluationBlockers();
  if(effectiveReservedMicros(ledger)>Number(process.env.V1_AI_BUDGET_MICROS))blockers.push('remaining approved budget');
  return { blockers, corpusReady: corpusReady(), budgetCeilingMicros: EVALUATION_MAX_MICROS, reservedMicros: ledger?.reservedMicros ?? 0, effectiveReservedMicros:effectiveReservedMicros(ledger),providerCostMicros:ledger?.providerCostMicros??null,projectId:process.env.OPENAI_TESTING_PROJECT_ID??null, halted: !!ledger?.haltReason || !!ledger?.evaluationLease && (ledger.evaluationActiveUntil ?? 0) <= Date.now() };
} });
// Trusted operator supplies only the new project's reconciled cumulative USD
// amount. No invoice documents, billing address or payment records are stored.
// Reservations never decrease and reconciliation cannot remove a safety halt.
export const reconcile = internalMutation({args:{projectId:v.string(),providerCostMicros:v.number()},returns:v.null(),handler:async(ctx,args)=>{
  requireTestingPrivacyOperation();
  if(!args.projectId||args.projectId!==process.env.OPENAI_TESTING_PROJECT_ID||!Number.isSafeInteger(args.providerCostMicros)||args.providerCostMicros<0)throw new ConvexError('Use the verified evaluation project and non-negative USD amount.');
  const ledger=await ctx.db.query('testingBudget').withIndex('by_key',q=>q.eq('key','initial-14-days')).unique();
  if(!ledger||ledger.evaluationLease)throw new ConvexError('Finish or review the evaluation reservation before reconciling costs.');
  if(args.providerCostMicros<(ledger.providerCostMicros??0))throw new ConvexError('The cumulative evaluation cost cannot be reduced.');
  await ctx.db.patch(ledger._id,{providerCostMicros:args.providerCostMicros,reconciledReservationMicros:ledger.reservedMicros});return null;
}});
export const begin = internalMutation({
  args: { invite: v.id('testingInvites'), lease: v.string(), caseId: v.string(), kind, age: v.number() }, returns: v.id('aiEvaluations'),
  handler: async (ctx, args) => {
    requireEvaluation();
    const invite = await ctx.db.get(args.invite);
    const ledger = await ctx.db.query('testingBudget').withIndex('by_key', q => q.eq('key', 'initial-14-days')).unique();
    if (!invite || invite.lease !== args.lease || invite.activeUntil <= Date.now() || ledger?.evaluationLease !== args.lease || ledger.haltReason || await ctx.db.query('aiEvaluations').withIndex('by_lease', q => q.eq('lease', args.lease)).unique()) throw new ConvexError('This evaluation reservation is unavailable.');
    return ctx.db.insert('aiEvaluations', { ...args, startedAt: Date.now(), state: 'reserved', pricingVersion: EVALUATION_PRICE_VERSION });
  }
});
export const record = internalMutation({
  args: { id: v.id('aiEvaluations'), lease: v.string(), latencyMs: v.number(), countedInputTokens:v.number(), inputTokens: v.number(), cachedTokens: v.number(), outputTokens: v.number(), reasoningTokens: v.number(), acceptedActivities: v.number(), rejectedActivities: v.number() }, returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.lease !== args.lease) throw new ConvexError('This usage record is unavailable.');
    if (row.state !== 'reserved') throw new ConvexError('This usage record has already been closed.');
    const outputCap = row.kind === 'recognition' ? 500 : 1500;
    if (args.inputTokens > EVALUATION_INPUT_CAP || args.countedInputTokens > EVALUATION_INPUT_CAP || args.outputTokens > outputCap || args.reasoningTokens > args.outputTokens || ![args.latencyMs,args.countedInputTokens,args.inputTokens,args.cachedTokens,args.outputTokens,args.reasoningTokens,args.acceptedActivities,args.rejectedActivities].every(n => Number.isSafeInteger(n) && n >= 0)) throw new ConvexError('Usage exceeded a verified evaluation limit.');
    const cost = tokenCostMicros(args.inputTokens, args.cachedTokens, args.outputTokens), upper = conservativeRequestMicros(args.inputTokens, args.outputTokens);
    if (upper > EVALUATION_RESERVE_MICROS) throw new ConvexError('Usage exceeded the reserved evaluation cost.');
    const { id, lease, ...numbers } = args;
    await ctx.db.patch(id, { ...numbers, state: 'measured', outputVerified:false, tokenCostMicros: cost, costUpperMicros: upper });
    return null;
  }
});
export const verifyOutput = internalMutation({args:{id:v.id('aiEvaluations'),lease:v.string(),acceptedActivities:v.number(),rejectedActivities:v.number()},returns:v.null(),handler:async(ctx,args)=>{
  const row=await ctx.db.get(args.id);
  if(!row||row.lease!==args.lease||row.state!=='measured'||row.outputVerified||![args.acceptedActivities,args.rejectedActivities].every(n=>Number.isSafeInteger(n)&&n>=0)||args.acceptedActivities+args.rejectedActivities>3)throw new ConvexError('This evaluation output cannot be verified.');
  await ctx.db.patch(row._id,{outputVerified:true,acceptedActivities:args.acceptedActivities,rejectedActivities:args.rejectedActivities});return null;
}});
export const halt = internalMutation({ args: { id: v.optional(v.id('aiEvaluations')), observed:v.optional(v.object({inputTokens:v.number(),cachedTokens:v.number(),outputTokens:v.number(),reasoningTokens:v.number()})) }, returns: v.null(), handler: async (ctx, { id, observed }) => {
  if (id) { const row = await ctx.db.get(id); if (row?.state === 'reserved') await ctx.db.patch(id, { state: 'uncertain', ...observed }); }
  const ledger = await ctx.db.query('testingBudget').withIndex('by_key', q => q.eq('key', 'initial-14-days')).unique();
  if (ledger) await ctx.db.patch(ledger._id, { haltReason: 'evaluation_uncertain' });
  return null;
} });
// Internal operator path only: no UI entry, no parent records, no auth remapping.
export const run = internalAction({
  args: { invitation: v.string(), caseId: v.string(), kind, image: v.string(), previous: v.array(activityValidator) }, returns: v.any(),
  handler: async (ctx, args) => {
    requireEvaluation();
    const item = evaluationCases.find(c => c.id === args.caseId);
    if (corpusReady() < 20 || !item?.licenseVerified || !item.imageSha256 || !item.asset) throw new ConvexError('The evaluation corpus needs 20–30 distinct approved toy photographs before live testing.');
    if (args.previous.length > 100) throw new ConvexError('Too much evaluation history.');
    if (args.kind === 'generation' && (!item.generationAllowed || !item.confirmedToys.length || args.image)) throw new ConvexError('Generation is not permitted for this corpus case or photo.');
    if (args.kind === 'recognition') {
      if (args.image.length > 350000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(args.image)) throw new ConvexError('Use the approved reduced corpus photograph.');
      const bytes = Uint8Array.from(atob(args.image.slice(args.image.indexOf(',') + 1)), c => c.charCodeAt(0));
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
      if (hash !== item.imageSha256) throw new ConvexError('The photograph does not match the approved corpus.');
    }
    const lease = await ctx.runMutation(internal.testingAccess.reserve, { invitation: args.invitation, kind: args.kind, evaluation: true });
    let recordId;
    let observedUsage;
    const started = Date.now();
    try {
      recordId = await ctx.runMutation(internal.aiEvaluation.begin, { invite: lease.id, lease: lease.lease, caseId: item.id, kind: args.kind, age: item.age });
      if (!await ctx.runMutation(internal.quota.reserve, {})) throw new Error('Quota');
      const body = args.kind === 'recognition' ? recognitionRequest(args.image) : activityRequest({ image: '', age: item.age, confirmedToys: item.confirmedToys, previous: args.previous });
      const headers = { Authorization: `Bearer ${process.env.OPENAI_TESTING_API_KEY}`, 'Content-Type': 'application/json', 'OpenAI-Project': process.env.OPENAI_TESTING_PROJECT_ID! };
      // Count the same full model/input/instructions/schema, including the image.
      // Counting endpoint compatibility/cost must be verified before activation.
      requireEvaluation();
      const count = await fetch('https://api.openai.com/v1/responses/input_tokens', { method: 'POST', headers, redirect:'error', signal: AbortSignal.timeout(20000), body: JSON.stringify({ model: body.model, input: body.input, instructions: body.instructions, text: body.text }) });
      if (!count.ok) throw new Error('Counting unavailable');
      const counted = await count.json();
      if (counted.object !== 'response.input_tokens' || !Number.isSafeInteger(counted.input_tokens) || counted.input_tokens < 0 || counted.input_tokens > EVALUATION_INPUT_CAP || conservativeRequestMicros(counted.input_tokens, body.max_output_tokens) > EVALUATION_RESERVE_MICROS) throw new Error('Input/cost limit');
      // Fresh query sees revoked approval/configuration in a new invocation,
      // rather than relying only on this action's initial environment snapshot.
      const fresh=await ctx.runQuery(internal.aiEvaluation.status,{});
      if(fresh.blockers.length||fresh.halted||fresh.projectId!==headers['OpenAI-Project']||fresh.corpusReady<20)throw new Error('Readiness changed');
      const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers, redirect:'error', signal: AbortSignal.timeout(60000), body: JSON.stringify({ ...body, service_tier: 'default' }) });
      if (!response.ok) throw new Error('Provider unavailable');
      const reply = await response.json();
      const reported=reply.usage;
      if(reported&&[reported.input_tokens,reported.input_tokens_details?.cached_tokens,reported.output_tokens,reported.output_tokens_details?.reasoning_tokens].every(n=>Number.isSafeInteger(n)&&n>=0)&&reported.input_tokens_details.cached_tokens<=reported.input_tokens&&reported.output_tokens_details.reasoning_tokens<=reported.output_tokens)observedUsage={inputTokens:reported.input_tokens,cachedTokens:reported.input_tokens_details.cached_tokens,outputTokens:reported.output_tokens,reasoningTokens:reported.output_tokens_details.reasoning_tokens};
      if (reply.model !== EVALUATION_MODEL || reply.service_tier !== 'default') throw new Error('Unverified model/tier');
      const usage = reply.usage;
      if (!usage || usage.total_tokens !== usage.input_tokens + usage.output_tokens || !Number.isSafeInteger(usage.input_tokens_details?.cached_tokens) || !Number.isSafeInteger(usage.output_tokens_details?.reasoning_tokens)) throw new Error('Unknown usage');
      const latencyMs = Date.now() - started;
      await ctx.runMutation(internal.aiEvaluation.record, { id: recordId, lease: lease.lease, latencyMs, countedInputTokens:counted.input_tokens, inputTokens: usage.input_tokens, cachedTokens: usage.input_tokens_details.cached_tokens, outputTokens: usage.output_tokens, reasoningTokens: usage.output_tokens_details.reasoning_tokens, acceptedActivities:0, rejectedActivities:0 });
      if (usage.input_tokens !== counted.input_tokens) throw new Error('Counting mismatch');
      const parsed = args.kind === 'recognition' ? parseRecognitionBody(reply) : parseGeneratedBody(reply, item.age, item.confirmedToys, args.previous);
      const raw = reply.output.flatMap((o:any) => o.content ?? []).filter((c:any) => c.type === 'output_text').map((c:any) => c.text).join('');
      const candidateCount = args.kind === 'generation' && raw ? JSON.parse(raw).activities.length : 0;
      const accepted = 'activities' in parsed ? parsed.activities.length : 0;
      await ctx.runMutation(internal.aiEvaluation.verifyOutput, {id:recordId,lease:lease.lease,acceptedActivities:accepted,rejectedActivities:candidateCount-accepted});
      return { ...parsed, latencyMs, rejectedActivities: candidateCount - accepted, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, tokenCostMicros: tokenCostMicros(usage.input_tokens, usage.input_tokens_details.cached_tokens, usage.output_tokens), invoiceReconciled: false };
    } catch {
      await ctx.runMutation(internal.aiEvaluation.halt, { id: recordId, observed:observedUsage });
      throw new ConvexError('Live evaluation stopped. A cost, response or safety limit needs review before further requests. The reservation is preserved.');
    } finally { await ctx.runMutation(internal.testingAccess.release, lease); }
  }
});
