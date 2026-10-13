import { getAuthUserId } from '@convex-dev/auth/server';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation } from './_generated/server';
import { internal } from './_generated/api';
import { excludedEmail } from './analyticsRules';
const validVisitor = (token: string | undefined): token is string => !!token && /^[a-f0-9-]{36}$/.test(token);
export const enableTracking = internalMutation({args:{},returns:v.number(),handler:async ctx=>{
  const existing=await ctx.db.query('analyticsSettings').withIndex('by_key',q=>q.eq('key','photo_tracking')).unique();
  if(existing)return existing.startedAt;
  const startedAt=Date.now();await ctx.db.insert('analyticsSettings',{key:'photo_tracking',startedAt});return startedAt;
}});
export const identifyVisitor = mutation({args:{visitorToken:v.string()},returns:v.null(),handler:async(ctx,{visitorToken})=>{
  if(!validVisitor(visitorToken))return null;
  const id=await getAuthUserId(ctx);const user=id?await ctx.db.get(id):null;
  if(!user||!excludedEmail(user.email))return null;
  const existing=await ctx.db.query('analyticsVisitors').withIndex('by_token',q=>q.eq('token',visitorToken)).unique();
  if(existing)await ctx.db.patch(existing._id,{excluded:true});else await ctx.db.insert('analyticsVisitors',{token:visitorToken,excluded:true});return null;
}});
export const markTestVisitor = internalMutation({args:{visitorToken:v.string()},returns:v.null(),handler:async(ctx,{visitorToken})=>{
  if(!validVisitor(visitorToken))throw new Error('A valid anonymous visitor ID is required.');
  const existing=await ctx.db.query('analyticsVisitors').withIndex('by_token',q=>q.eq('token',visitorToken)).unique();
  if(existing)await ctx.db.patch(existing._id,{excluded:true});else await ctx.db.insert('analyticsVisitors',{token:visitorToken,excluded:true});return null;
}});
export const startRun = internalMutation({args:{visitorToken:v.optional(v.string())},returns:v.id('photoRuns'),handler:async(ctx,{visitorToken})=>{
  const id=await getAuthUserId(ctx),user=id?await ctx.db.get(id):null;
  const settings=await ctx.db.query('analyticsSettings').withIndex('by_key',q=>q.eq('key','photo_tracking')).unique();
  if(!settings)await ctx.db.insert('analyticsSettings',{key:'photo_tracking',startedAt:Date.now()});
  const run=await ctx.db.insert('photoRuns',{time:Date.now(),visitorToken:validVisitor(visitorToken)?visitorToken:`legacy-account:${id}`,...(user?.email?{email:user.email.trim().toLowerCase()}:{}),succeeded:false,completed:false});
  await ctx.scheduler.runAfter(90000,internal.analytics.completeRun,{run,succeeded:false});return run;
}});
export const completeRun = internalMutation({args:{run:v.id('photoRuns'),succeeded:v.boolean()},returns:v.null(),handler:async(ctx,{run,succeeded})=>{
  const row=await ctx.db.get(run);if(row&&!row.completed)await ctx.db.patch(run,{succeeded,completed:true});return null;
}});
export const settings = internalQuery({args:{},returns:v.union(v.number(),v.null()),handler:async ctx=>(await ctx.db.query('analyticsSettings').withIndex('by_key',q=>q.eq('key','photo_tracking')).unique())?.startedAt??null});
const args={paginationOpts:paginationOptsValidator};
const returns=v.object({page:v.array(v.any()),isDone:v.boolean(),continueCursor:v.string()});
function onlyPage<T>(result:{page:T[];isDone:boolean;continueCursor:string}){return {page:result.page,isDone:result.isDone,continueCursor:result.continueCursor};}
export const runsPage=internalQuery({args,returns,handler:async(ctx,{paginationOpts})=>onlyPage(await ctx.db.query('photoRuns').withIndex('by_time').paginate(paginationOpts))});
export const visitorsPage=internalQuery({args,returns,handler:async(ctx,{paginationOpts})=>onlyPage(await ctx.db.query('analyticsVisitors').withIndex('by_token').paginate(paginationOpts))});
export const paymentsPage=internalQuery({args,returns,handler:async(ctx,{paginationOpts})=>onlyPage(await ctx.db.query('paymentEvents').withIndex('by_paidFrom').paginate(paginationOpts))});
export const usersPage=internalQuery({args,returns,handler:async(ctx,{paginationOpts})=>{
  const result=await ctx.db.query('users').withIndex('email').paginate(paginationOpts);
  return {...onlyPage(result),page:result.page.map(u=>({_creationTime:u._creationTime,...(u.email?{email:u.email}:{}),...(u.paidFrom!==undefined?{paidFrom:u.paidFrom}:{}),...(u.paidUntil!==undefined?{paidUntil:u.paidUntil}:{})}))};
}});
