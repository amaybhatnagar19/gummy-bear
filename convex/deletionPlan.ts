import type {QueryCtx} from './_generated/server';
import type {Id} from './_generated/dataModel';
// Read-only, bounded preparation. No identity/session deletion is activated.
export async function identityDeletionPlan(ctx:QueryCtx,user:Id<'users'>){
 const accounts=await ctx.db.query('authAccounts').withIndex('userIdAndProvider',q=>q.eq('userId',user)).take(21);
 const sessions=await ctx.db.query('authSessions').withIndex('userId',q=>q.eq('userId',user)).take(51);
 let refreshTokens=0,verificationCodes=0,verifiers=0,remaining=100,truncated=accounts.length>20||sessions.length>50;
 for(const session of sessions.slice(0,50)){
  if(!remaining){truncated=true;break;}
  const tokens=await ctx.db.query('authRefreshTokens').withIndex('sessionId',q=>q.eq('sessionId',session._id)).take(remaining);
  refreshTokens+=tokens.length;remaining-=tokens.length;
  if(!remaining){truncated=true;break;}
  const proofs=await ctx.db.query('authVerifiers').withIndex('by_session',q=>q.eq('sessionId',session._id)).take(remaining);
  verifiers+=proofs.length;remaining-=proofs.length;
 }
 for(const account of accounts.slice(0,20)){
  if(!remaining){truncated=true;break;}
  const codes=await ctx.db.query('authVerificationCodes').withIndex('accountId',q=>q.eq('accountId',account._id)).take(remaining);
  verificationCodes+=codes.length;remaining-=codes.length;
 }
 return {accounts:Math.min(20,accounts.length),sessions:Math.min(50,sessions.length),refreshTokens,verificationCodes,verifiers,truncated:truncated||remaining===0,identityRemovalEnabled:false as const};
}
export const identityRemovalSequence=['freeze new writes and require fresh parent proof','delete session refresh tokens and owned PKCE proofs in bounded batches','invalidate owned sessions','delete account verification codes','remove proved provider accounts','resolve personal operational references and approved financial exceptions','remove user identity and record completion only after all required steps'] as const;

// Internal preparation helper only: returns a removal plan, never executes it.
// A future approved finalizer must persist the stage with each atomic batch,
// obtain fresh parent proof and resolve operational/financial policy separately.
export async function prepareIdentityBatch(ctx:QueryCtx,requestId:Id<'deletionRequests'>,stage:0|1|2,budget=100){
 if(!Number.isInteger(budget)||budget<1||budget>100)throw new Error('Choose a bounded identity-removal batch.');
 const request=await ctx.db.get(requestId);
 if(!request||request.scope!=='account'||request.status!=='awaiting_policy')throw new Error('Finish family removal and policy review before planning identity removal.');
 const owner=request.owner;
 if(stage===0){
  const session=await ctx.db.query('authSessions').withIndex('userId',q=>q.eq('userId',owner)).first();
  if(!session)return {owner,stage:1 as const,remove:[] as (Id<'authRefreshTokens'>|Id<'authVerifiers'>|Id<'authSessions'>|Id<'authVerificationCodes'>|Id<'authAccounts'>)[],done:false};
  const tokens=await ctx.db.query('authRefreshTokens').withIndex('sessionId',q=>q.eq('sessionId',session._id)).take(budget);
  const remove:(Id<'authRefreshTokens'>|Id<'authVerifiers'>|Id<'authSessions'>)[]=tokens.map(t=>t._id);
  if(remove.length<budget){const proofs=await ctx.db.query('authVerifiers').withIndex('by_session',q=>q.eq('sessionId',session._id)).take(budget-remove.length);remove.push(...proofs.map(p=>p._id));}
  if(remove.length<budget)remove.push(session._id);
  return {owner,stage:0 as const,remove,done:false};
 }
 {const pending=await ctx.db.query('authSessions').withIndex('userId',q=>q.eq('userId',owner)).first();if(pending)return {owner,stage:0 as const,remove:[] as Id<'authSessions'>[],done:false};}
 if(stage===1){
  const account=await ctx.db.query('authAccounts').withIndex('userIdAndProvider',q=>q.eq('userId',owner)).first();
  if(!account)return {owner,stage:2 as const,remove:[] as Id<'authAccounts'>[],done:false};
  const codes=await ctx.db.query('authVerificationCodes').withIndex('accountId',q=>q.eq('accountId',account._id)).take(budget);
  const remove:(Id<'authVerificationCodes'>|Id<'authAccounts'>)[]=codes.map(c=>c._id);if(remove.length<budget)remove.push(account._id);
  return {owner,stage:1 as const,remove,done:false};
 }
 const pending=await ctx.db.query('authAccounts').withIndex('userIdAndProvider',q=>q.eq('userId',owner)).first();if(pending)return {owner,stage:1 as const,remove:[] as Id<'authAccounts'>[],done:false};
 // No user/financial/analytics deletion or completed-account claim here.
 return {owner,stage:2 as const,remove:[] as Id<'authAccounts'>[],done:true};
}
