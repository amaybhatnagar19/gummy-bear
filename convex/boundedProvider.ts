import {ConvexError} from 'convex/values';
import type {ActionCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
import {internal} from './_generated/api';
import {requireLiveAI} from './v1Policy';
import {EVALUATION_MODEL,EVALUATION_PRICE_VERSION,EVALUATION_INPUT_CAP,conservativeRequestMicros,tokenCostMicros} from '../shared/aiEvaluation';
export function verifiedNormalCosts(){
 requireLiveAI();
 const expiry=Number(process.env.V1_AI_COST_VALID_UNTIL),fee=Number(process.env.V1_AI_COUNT_FEE_MICROS),ceiling=Number(process.env.V1_AI_REQUEST_CEILING_MICROS);
 if(process.env.V1_AI_COST_VERIFIED!=='true'||process.env.V1_AI_PRICING_VERSION!==EVALUATION_PRICE_VERSION||!Number.isSafeInteger(expiry)||expiry<=Date.now()||expiry>Date.now()+86400000||!Number.isSafeInteger(fee)||fee<0||!Number.isSafeInteger(ceiling)||ceiling<=fee)throw new ConvexError('AI request costs need verification before processing. Your existing ideas remain available.');
 return {fee,ceiling};
}
export async function boundedResponse(ctx:ActionCtx,request:{model:string;max_output_tokens:number;input:unknown;instructions:string;text:unknown;[key:string]:unknown},key:string,lease:{id:Id<'testingInvites'>;lease:string}):Promise<Response>{
 const {fee,ceiling}=verifiedNormalCosts();
 if(request.model!==EVALUATION_MODEL||![500,1500].includes(request.max_output_tokens))throw new ConvexError('The AI request configuration needs review.');
 const headers={Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
 try{
  const count=await fetch('https://api.openai.com/v1/responses/input_tokens',{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(20000),body:JSON.stringify({model:request.model,input:request.input,instructions:request.instructions,text:request.text})});
  if(!count.ok)throw new Error('Counting unavailable');const counted=await count.json();
  if(counted.object!=='response.input_tokens'||!Number.isSafeInteger(counted.input_tokens)||counted.input_tokens<0||counted.input_tokens>EVALUATION_INPUT_CAP||conservativeRequestMicros(counted.input_tokens,request.max_output_tokens)+fee>ceiling)throw new Error('Cost bound exceeded');
  // Recheck the persisted lease/consent/ledger in a fresh server invocation.
  verifiedNormalCosts();await ctx.runQuery(internal.testingAccess.verifyLease,lease);
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(60000),body:JSON.stringify({...request,service_tier:'default'})});
  if(!response.ok)throw new Error('Provider unavailable');const body=await response.json();const u=body.usage;
  if(body.model!==EVALUATION_MODEL||body.service_tier!=='default'||!u||![u.input_tokens,u.output_tokens,u.total_tokens,u.input_tokens_details?.cached_tokens,u.output_tokens_details?.reasoning_tokens].every(n=>Number.isSafeInteger(n)&&n>=0)||u.input_tokens!==counted.input_tokens||u.output_tokens>request.max_output_tokens||u.total_tokens!==u.input_tokens+u.output_tokens||u.input_tokens_details.cached_tokens>u.input_tokens||u.output_tokens_details.reasoning_tokens>u.output_tokens)throw new Error('Unverified usage');
  await ctx.runMutation(internal.testingAccess.recordUsage,{...lease,modelEstimateMicros:tokenCostMicros(u.input_tokens,u.input_tokens_details.cached_tokens,u.output_tokens)+fee});
  return Response.json(body);
 }catch{
  // An uncertain transport/count/usage result cannot free a reservation.
  await ctx.runMutation(internal.testingAccess.haltUsage,lease);
  throw new ConvexError('AI processing is paused because request cost or usage could not be verified. Your previous ideas remain available.');
 }
}
