import { expect,test } from 'vitest';
import { reminderEligible,donationEligible } from '../../shared/v1';
const now=Date.parse('2026-10-14T12:00:00Z');const toy={status:'stored',damaged:false,unsafe:false};
test('newly acquired toys are excluded; old and unknown dates make no offline claims',()=>{expect(reminderEligible({...toy,acquiredAt:Date.parse('2026-09-01')},now)).toBe(false);expect(reminderEligible({...toy,acquiredAt:Date.parse('2026-08-01')},now)).toBe(true);expect(reminderEligible(toy,now)).toBe(true);});
test('ownership exclusions and parent dismissal are honored',()=>{for(const status of ['removed','donated'])expect(reminderEligible({...toy,status},now)).toBe(false);expect(reminderEligible({...toy,suppressedUntil:now+1},now)).toBe(false);});
test('unsafe or damaged toys never receive donation guidance',()=>{expect(donationEligible(toy)).toBe(true);expect(donationEligible({...toy,unsafe:true})).toBe(false);expect(donationEligible({...toy,damaged:true})).toBe(false);});
test('two-calendar-month cutoff clamps month end rather than allowing newly acquired toys',()=>{const jan31=Date.parse('2027-01-31T12:00:00Z');expect(reminderEligible({...toy,acquiredAt:Date.parse('2026-12-01T12:00:00Z')},jan31)).toBe(false);expect(reminderEligible({...toy,acquiredAt:Date.parse('2026-11-30T12:00:00Z')},jan31)).toBe(true);});
