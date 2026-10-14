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
