import { convexTest } from 'convex-test';
import { makeFunctionReference } from 'convex/server';
import { expect, test } from 'vitest';
import schema from '../../convex/schema';
import { api, internal } from '../../convex/_generated/api';
const modules=import.meta.glob('../../convex/**/*.ts');
const ref=(name:string)=>makeFunctionReference<any>(`complimentary:${name}`);
async function setup() {
 const t=convexTest(schema,modules);
 const id=await t.run(ctx=>ctx.db.insert('users',{email:'grant@example.com',bonusGranted:true,bonusUsed:true}));
 const other=await t.run(ctx=>ctx.db.insert('users',{email:'other@example.com'}));
 return {t,id,other};
}
async function grant(t:any, overrides:any={}) {
 const c=await t.query(ref('check'),{email:' GRANT@EXAMPLE.COM '});
 return t.mutation(ref('grant'),{email:c.email,expectedUser:c.userId,expectedPaidUntil:c.paidUntil,expectedPaidFrom:c.paidFrom,newPaidUntil:Math.max(Date.now(),c.paidUntil??0)+86400000,reason:'Synthetic grant',administrator:'test administrator',operationId:crypto.randomUUID(),...overrides});
}
test('grant is atomic, preserves unrelated fields/accounts/payments and unlocks existing access',async()=>{
 const {t,id,other}=await setup();
 const before=await t.run(ctx=>ctx.db.get(id));const otherBefore=await t.run(ctx=>ctx.db.get(other));
 const grantId=await grant(t);
 const after=await t.run(ctx=>ctx.db.get(id));
 expect(after).toEqual({...before,paidUntil:after!.paidUntil});
 expect(await t.run(ctx=>ctx.db.get(other))).toEqual(otherBefore);
 expect(await t.run(ctx=>ctx.db.query('paymentEvents').collect())).toEqual([]);
 expect(await t.run(ctx=>ctx.db.get(grantId))).toMatchObject({userId:id,reason:'Synthetic grant',administrator:'test administrator'});
 const user=t.withIdentity({subject:id+'|session'});
 expect((await user.query(api.access.status,{visitorToken:'12345678-1234-1234-1234-123456789abc'})).state).toBe('paid');
 expect(await user.mutation(internal.access.reserve,{})).toBeNull();
});
test('stacked extensions revoke in reverse order, restore original field absence and audit revoker',async()=>{
 const {t,id}=await setup();const first=await grant(t);const firstExpiry=(await t.run(ctx=>ctx.db.get(id)))!.paidUntil;
 const second=await grant(t);
 await expect(t.mutation(ref('revoke'),{email:'grant@example.com',grantId:first,administrator:'admin'})).rejects.toThrow();
 await t.mutation(ref('revoke'),{email:'grant@example.com',grantId:second,administrator:'admin'});
 expect((await t.run(ctx=>ctx.db.get(id)))!.paidUntil).toBe(firstExpiry);
 await t.mutation(ref('revoke'),{email:'grant@example.com',grantId:first,administrator:'admin'});
 expect((await t.run(ctx=>ctx.db.get(id)))!.paidUntil).toBeUndefined();
 expect(await t.run(ctx=>ctx.db.get(first))).toMatchObject({revokedBy:'admin'});
 await t.mutation(ref('revoke'),{email:'grant@example.com',grantId:first,administrator:'admin'});
});
test('subsequent real markPaid blocks revocation and payment flow is unchanged',async()=>{
 const {t}=await setup();const g=await grant(t);
 await t.mutation(internal.access.markPaid,{email:'grant@example.com'});
 await expect(t.mutation(ref('revoke'),{email:'grant@example.com',grantId:g,administrator:'admin'})).rejects.toThrow('Subsequent');
 expect(await t.run(ctx=>ctx.db.query('paymentEvents').collect())).toHaveLength(1);
});
test('payment event blocks revocation even if expiry and paidFrom are unchanged',async()=>{
 const {t}=await setup();const g=await grant(t);
 await t.run(ctx=>ctx.db.insert('paymentEvents',{email:'grant@example.com',paidFrom:Date.now()+1,paidUntil:Date.now()+86400000}));
 await expect(t.mutation(ref('revoke'),{email:'grant@example.com',grantId:g,administrator:'admin'})).rejects.toThrow('payment');
});
test('missing/duplicate email, stale previews, shortenings and cross-account revocations fail',async()=>{
 const {t,other}=await setup();
 await expect(t.query(ref('check'),{email:'none@example.com'})).rejects.toThrow('exactly one');
 await expect(grant(t,{newPaidUntil:Date.now()-1})).rejects.toThrow('Expiry');
 await expect(grant(t,{expectedUser:other})).rejects.toThrow('changed');
 const g=await grant(t);
 await expect(t.mutation(ref('revoke'),{email:'other@example.com',grantId:g,administrator:'admin'})).rejects.toThrow('belong');
 await t.run(ctx=>ctx.db.insert('users',{email:'grant@example.com'}));
 await expect(t.query(ref('check'),{email:'grant@example.com'})).rejects.toThrow('exactly one');
});
test('replayed operation ID and stale confirmation leave only one grant',async()=>{
 const {t}=await setup();const operationId=crypto.randomUUID();await grant(t,{operationId});
 await expect(grant(t,{operationId})).rejects.toThrow('already processed');
 await expect(grant(t,{expectedPaidUntil:null})).rejects.toThrow('changed');
 expect(await t.run(ctx=>ctx.db.query('complimentaryGrants').collect())).toHaveLength(1);
});
test('all administrative exports are internal; none expose a public mutation',async()=>{
 const functions=await import('../../convex/complimentary');
 for(const fn of Object.values(functions)) expect((fn as any).isInternal).toBe(true);
 // convex-test deliberately permits internal calls; HTTP visibility is verified on isolated dev separately.
});
test('revocation preserves pre-existing purchased access and all original user fields',async()=>{
 const {t,id}=await setup();
 await t.mutation(internal.access.markPaid,{email:'grant@example.com'});
 const before=await t.run(ctx=>ctx.db.get(id));
 const payments=await t.run(ctx=>ctx.db.query('paymentEvents').collect());
 // Ensure the real payment predates the grant, rather than the same ambiguous millisecond.
 const originalNow=Date.now();
 const {vi}=await import('vitest');vi.useFakeTimers();vi.setSystemTime(originalNow+10);
 try {
  const g=await grant(t);
  await t.mutation(ref('revoke'),{email:'grant@example.com',grantId:g,administrator:'admin'});
  expect(await t.run(ctx=>ctx.db.get(id))).toEqual(before);
  expect(await t.run(ctx=>ctx.db.query('paymentEvents').collect())).toEqual(payments);
 } finally {vi.useRealTimers();}
});
test('subsequently inserted backdated payments also block revocation',async()=>{
 const {t}=await setup();const g=await grant(t);
 await t.run(ctx=>ctx.db.insert('paymentEvents',{email:'grant@example.com',paidFrom:Date.now()-86400000,paidUntil:Date.now()+86400000}));
 await expect(t.mutation(ref('revoke'),{email:'grant@example.com',grantId:g,administrator:'admin'})).rejects.toThrow('payment');
});
