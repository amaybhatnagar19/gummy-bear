import { v, ConvexError } from 'convex/values';
import { internalQuery, internalMutation, type QueryCtx } from './_generated/server';
import { accountAccess } from './paymentRules';
const nullable = v.union(v.number(), v.null());
const view = v.object({userId:v.id('users'),email:v.string(),status:v.string(),paidUntil:nullable,paidFrom:nullable,active:v.boolean()});
async function find(ctx: QueryCtx, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new ConvexError('Invalid email.');
  const rows = await ctx.db.query('users').withIndex('email', q=>q.eq('email',normalized)).take(2);
  if(rows.length!==1) throw new ConvexError('Expected exactly one registered account. No change made.');
  return rows[0];
}
function actor(value: string) { if(value.trim().length<3 || value.length>200) throw new ConvexError('Administrator label required.'); }
export const check = internalQuery({args:{email:v.string()},returns:view,handler:async(ctx,{email})=>{
  const u=await find(ctx,email);
  return {userId:u._id,email:u.email!,status:accountAccess(u,Date.now()),paidUntil:u.paidUntil??null,paidFrom:u.paidFrom??null,active:(u.paidUntil??0)>Date.now()};
}});
export const grant = internalMutation({args:{email:v.string(),expectedUser:v.id('users'),expectedPaidUntil:nullable,expectedPaidFrom:nullable,newPaidUntil:v.number(),reason:v.string(),administrator:v.string(),operationId:v.string()},returns:v.id('complimentaryGrants'),handler:async(ctx,a)=>{
  actor(a.administrator);
  if(!a.reason.trim() || a.reason.length>1000 || !/^[a-f0-9-]{36}$/.test(a.operationId)) throw new ConvexError('Reason and unique operation ID required.');
  if(await ctx.db.query('complimentaryGrants').withIndex('by_operation',q=>q.eq('operationId',a.operationId)).unique()) throw new ConvexError('Operation already processed. Check access before retrying.');
  const u=await find(ctx,a.email),now=Date.now();
  if(u._id!==a.expectedUser || (u.paidUntil??null)!==a.expectedPaidUntil || (u.paidFrom??null)!==a.expectedPaidFrom) throw new ConvexError('Access changed since preview. Preview again.');
  if(!Number.isSafeInteger(a.newPaidUntil) || a.newPaidUntil<=Math.max(now,u.paidUntil??0) || a.newPaidUntil>Math.max(now,u.paidUntil??0)+3650*86400000) throw new ConvexError('Expiry must extend access by at most 3650 days.');
  const id=await ctx.db.insert('complimentaryGrants',{userId:u._id,email:u.email!,previousPaidUntil:u.paidUntil,previousPaidFrom:u.paidFrom,newPaidUntil:a.newPaidUntil,reason:a.reason.trim(),grantedAt:now,administrator:a.administrator.trim(),operationId:a.operationId});
  await ctx.db.patch(u._id,{paidUntil:a.newPaidUntil});
  return id;
}});
export const previewRevoke = internalQuery({args:{email:v.string()},returns:v.union(v.null(),v.object({grantId:v.id('complimentaryGrants'),reason:v.string(),administrator:v.string(),grantedAt:v.number(),previousPaidUntil:nullable,newPaidUntil:v.number()})),handler:async(ctx,{email})=>{
  const u=await find(ctx,email);
  const rows=await ctx.db.query('complimentaryGrants').withIndex('by_user',q=>q.eq('userId',u._id)).order('desc').take(101);
  if(rows.length>100) throw new ConvexError('Grant history requires administrator review.');
  const g=rows.find(r=>r.revokedAt===undefined);
  return g?{grantId:g._id,reason:g.reason,administrator:g.administrator,grantedAt:g.grantedAt,previousPaidUntil:g.previousPaidUntil??null,newPaidUntil:g.newPaidUntil}:null;
}});
export const revoke = internalMutation({args:{email:v.string(),grantId:v.id('complimentaryGrants'),administrator:v.string()},returns:v.null(),handler:async(ctx,a)=>{
  actor(a.administrator);
  const u=await find(ctx,a.email),g=await ctx.db.get(a.grantId);
  if(!g || g.userId!==u._id) throw new ConvexError('Grant does not belong to this account.');
  if(g.revokedAt!==undefined) return null;
  if(u.paidUntil!==g.newPaidUntil || u.paidFrom!==g.previousPaidFrom) throw new ConvexError('Subsequent payment or extension detected. Manual review required.');
  // Existing payment index is time-based. Bound the scan and fail closed if it overflows.
  const payments=await ctx.db.query('paymentEvents').withIndex('by_paidFrom').take(1001);
  if(payments.length>1000 || payments.some(p=>p.email.trim().toLowerCase()===g.email && (p._creationTime>=g.grantedAt || p.paidFrom>=g.grantedAt))) throw new ConvexError('Possible subsequent payment. Manual review required.');
  await ctx.db.patch(u._id,{paidUntil:g.previousPaidUntil});
  await ctx.db.patch(g._id,{revokedAt:Date.now(),revokedBy:a.administrator.trim()});
  return null;
}});
