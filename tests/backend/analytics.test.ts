import { convexTest } from 'convex-test';
import { test, expect, vi, afterEach } from 'vitest';
import schema from '../../convex/schema';
import { api, internal } from '../../convex/_generated/api';
import { dailyReport, excludedEmail, istDay } from '../../convex/analyticsRules';
const modules=import.meta.glob('../../convex/**/*.ts');
const token='12345678-1234-1234-1234-123456789abc';
afterEach(()=>vi.unstubAllEnvs());
test('success and failure records contain time, existing visitor ID and authenticated email, never a photo',async()=>{
  const t=convexTest(schema,modules);
  const userId=await t.run(ctx=>ctx.db.insert('users',{email:'parent@real.test'}));
  const user=t.withIdentity({subject:userId+'|session'});
  const id=await user.mutation(internal.analytics.startRun,{visitorToken:token});
  await user.mutation(internal.analytics.completeRun,{run:id,succeeded:true});
  await user.mutation(internal.analytics.completeRun,{run:id,succeeded:false});
  const row=await t.run(ctx=>ctx.db.get(id));
  expect(row).toMatchObject({visitorToken:token,email:'parent@real.test',succeeded:true,completed:true});
  expect(Object.keys(row!).sort()).toEqual(['_creationTime','_id','completed','email','succeeded','time','visitorToken']);
  const failed=await t.mutation(internal.analytics.startRun,{visitorToken:token});
  await t.mutation(internal.analytics.completeRun,{run:failed,succeeded:false});
  expect(await t.run(ctx=>ctx.db.get(failed))).toMatchObject({completed:true,succeeded:false});
});
test('AI failures are recorded and refund the existing free allowance',async()=>{
  vi.stubEnv('OPENAI_API_KEY','');
  const t=convexTest(schema,modules);
  await expect(t.action(api.play.discover,{visitorToken:token,image:'data:image/jpeg;base64,YQ==',age:4})).rejects.toThrow();
  expect((await t.query(api.access.status,{visitorToken:token})).uses).toBe(0);
  const page=await t.query(internal.analytics.runsPage,{paginationOpts:{numItems:20,cursor:null}});
  expect(page.page).toHaveLength(1);expect(page.page[0]).toMatchObject({visitorToken:token,succeeded:false,completed:true});
});
test('paywall rejection is not recorded as a photo sent to AI',async()=>{
  const t=convexTest(schema,modules);
  await t.run(ctx=>ctx.db.insert('visitors',{token,uses:2}));
  await expect(t.action(api.play.discover,{visitorToken:token,image:'data:image/jpeg;base64,YQ==',age:4})).rejects.toThrow('SIGNUP_REQUIRED');
  expect((await t.query(internal.analytics.runsPage,{paginationOpts:{numItems:20,cursor:null}})).page).toHaveLength(0);
});
test('IST dates, anonymous test labels, owner-linked guest runs and unique confirmed payments are filtered correctly',()=>{
  const now=Date.parse('2026-10-14T00:00:00Z'),start=Date.parse('2026-10-13T18:20:00Z');
  expect(istDay(Date.parse('2026-10-13T18:30:00Z'))).toBe('2026-10-14');
  const run=(visitorToken:string,email?:string,succeeded=true)=>({time:now,visitorToken,email,succeeded,completed:true});
  const report=dailyReport([run('one'),run('one',undefined,false),run('two'),run('test'),run('owner-guest'),run('owner-guest','AMAY.BHATNAGAR@GMAIL.COM'),run('test-account','deploy-test-x@example.com')],[{_creationTime:now,email:'parent@real.test'},{_creationTime:now,email:'amay.bhatnagar@gmail.com'}],[{email:'parent@real.test',paidFrom:now,paidUntil:now+1000},{email:'parent@real.test',paidFrom:now+1,paidUntil:now+1000},{email:'paywall-test-x@example.com',paidFrom:now,paidUntil:now+1000}],[{token:'test',excluded:true}],start,now+100);
  expect(report.daily.find(d=>d.date==='2026-10-14')).toMatchObject({unique_visitors:2,photo_runs:3,successful_photo_runs:2,failed_photo_runs:1,signups:1,paid_users:1});
  expect(report.daily.find(d=>d.date==='2026-10-13')?.photo_coverage).toBe('since_tracking_started');
  expect(excludedEmail('real-parent@gmail.com')).toBe(false);
});
test('signup identification excludes the same anonymous browser without changing allowance',async()=>{
  const t=convexTest(schema,modules);
  const id=await t.run(ctx=>ctx.db.insert('users',{email:'amay.bhatnagar@gmail.com'}));
  await t.withIdentity({subject:id+'|session'}).mutation(api.analytics.identifyVisitor,{visitorToken:token});
  const labels=await t.query(internal.analytics.visitorsPage,{paginationOpts:{numItems:20,cursor:null}});
  expect(labels.page[0]).toMatchObject({token,excluded:true});
  expect((await t.query(api.access.status,{visitorToken:token})).uses).toBe(0);
});
test('manual payment preserves its month and records confirmation history for future daily reports',async()=>{
  const t=convexTest(schema,modules);
  await t.run(ctx=>ctx.db.insert('users',{email:'paid@real.test'}));
  const payment=await t.mutation(internal.access.markPaid,{email:'paid@real.test'});
  const events=await t.query(internal.analytics.paymentsPage,{paginationOpts:{numItems:20,cursor:null}});
  expect(events.page[0]).toMatchObject(payment);
});
test('visitor metadata cannot contain image bytes or URLs',async()=>{
  const t=convexTest(schema,modules);
  const id=await t.run(ctx=>ctx.db.insert('users',{email:'parent@real.test'}));
  const user=t.withIdentity({subject:id+'|session'});
  const run=await user.mutation(internal.analytics.startRun,{visitorToken:'data:image/jpeg;base64,YQ=='});
  expect((await t.run(ctx=>ctx.db.get(run)))?.visitorToken).toBe('legacy-account:'+id);
  await expect(t.mutation(internal.analytics.markTestVisitor,{visitorToken:'https://photo.example/image.jpg'})).rejects.toThrow('valid anonymous visitor');
});
