import { v } from 'convex/values';
export const toyStatus = v.union(v.literal('in_use'), v.literal('stored'), v.literal('donated'), v.literal('removed'));
export const cadence = v.union(v.literal('off'), v.literal('weekly'), v.literal('monthly'));
export const feedback = v.union(v.literal('loved'), v.literal('okay'), v.literal('did_not_work'));
export function cleanText(value: string, max = 119): string {
  const s = value.trim();
  if (!s || s.length > max || /[\u0000-\u001f\u007f]/.test(s)) throw new Error('Please use a short, clear label.');
  return s;
}
export function childAge(age: number) {
  if (!Number.isInteger(age) || age < 2 || age > 8) throw new Error('Choose an age between 2 and 8.');
  return age;
}
export function reminderEligible(toy: {
  status: string;
  acquiredAt?: number;
  damaged: boolean;
  unsafe: boolean;
  suppressedUntil?: number;
}, now: number): boolean {
  const cutoff = new Date(now),
    day = cutoff.getUTCDate();
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 2);
  const last = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(day, last));
  return ['in_use', 'stored'].includes(toy.status) && (toy.acquiredAt === undefined || toy.acquiredAt <= cutoff.getTime()) && (!toy.suppressedUntil || toy.suppressedUntil <= now);
}
export function donationEligible(toy: {
  damaged: boolean;
  unsafe: boolean;
  status: string;
}) {
  return !toy.damaged && !toy.unsafe && ['in_use', 'stored'].includes(toy.status);
}
export function ageFromBirthDate(dob:string,now:number):number {const date=new Date(dob),today=new Date(now);if(!/^\d{4}-\d{2}-\d{2}$/.test(dob)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dob||date.getTime()>now)throw new Error('Choose a valid birth date.');return today.getUTCFullYear()-date.getUTCFullYear()-(today.getUTCMonth()<date.getUTCMonth()||(today.getUTCMonth()===date.getUTCMonth()&&today.getUTCDate()<date.getUTCDate())?1:0);}
