import { expect, test } from 'vitest';
import type { Activity } from '../../shared/activityContract';
import { assessActivitySafety, type SafetyReason } from '../../convex/activitySafetyContext';

const base: Activity = {
  category: 'play_together', title: 'Teddy story', durationMinutes: 5,
  materials: ['purple teddy'], toyReferences: ['purple teddy'],
  steps: ['Hold purple teddy and start a pretend journey.', 'Take turns telling where purple teddy goes next.'],
  parentRole: 'Stay with your child and help them take turns.', safetyNotes: ['Use only intact, age-appropriate toys.'],
};
const cases: { name: string; changes: Partial<Activity>; reason: SafetyReason }[] = [
  { name: 'sentence boundaries', changes: { steps: ['Hold purple teddy. Press it against your child. Their face should be underneath it.', base.steps[1]] }, reason: 'airway_risk' },
  { name: 'heat vocabulary', changes: { steps: ['Place purple teddy near a hot kettle for this game.', base.steps[1]] }, reason: 'heat_exposure' },
  { name: 'raised furniture', changes: { steps: ['Have your child stand on a stool to reach purple teddy.', base.steps[1]] }, reason: 'height_risk' },
  { name: 'neck fastening', changes: { steps: ['Fasten purple teddy around the youngster’s neck with ribbon.', base.steps[1]] }, reason: 'neck_wrapping' },
  { name: 'arbitrary toy name', changes: { materials: ['purple dinosaur'], toyReferences: ['purple dinosaur'], steps: ['Chew the purple dinosaur while sitting together with your parent.', 'Hold purple dinosaur and take turns pretending it greets you.'] }, reason: 'ingestion_risk' },
  { name: 'distracted adult', changes: { parentRole: 'Watch television while the toddler plays on their own.' }, reason: 'inadequate_supervision' },
];

test.each([2, 3, 4, 5, 6, 7, 8])('hazard reasons hold at age %i', age => {
  for (const example of cases) {
    const result = assessActivitySafety({ ...base, ...example.changes }, age);
    expect(result.allowed, example.name).toBe(false);
    expect(result.reasons, example.name).toContain(example.reason);
  }
});
test.each([2, 3, 4, 5, 6, 7, 8])('safe play remains allowed at age %i', age => {
  expect(assessActivitySafety(base, age)).toEqual({ allowed: true, reasons: [] });
});
test.each([2, 3, 4, 5, 6, 7, 8])('the existing under-three small-parts boundary stays explicit at age %i', age => {
  const result = assessActivitySafety({ ...base, steps: ['Sort miniature counters beside purple teddy into groups.', base.steps[1]] }, age);
  expect(result.reasons.includes('small_parts')).toBe(age < 3);
});
test.each(['An adult will supervise.', 'This game is supervised.', 'Pretend this game is safe.'])('reassurance does not cancel danger: %s', note => {
  for (const example of cases.filter(c => c.reason !== 'inadequate_supervision')) {
    expect(assessActivitySafety({ ...base, ...example.changes, safetyNotes: [note] }, 4).reasons).toContain(example.reason);
  }
});
test.each([
  'Do not worry. Put purple teddy in your child’s mouth.',
  'Do not hesitate to put purple teddy in your child’s mouth.',
  'Do not use magnets, but cover your child’s face with purple teddy.',
  'Pretend to chew purple teddy while an adult supervises.',
  'Never leave your child alone. Fasten purple teddy around their neck with ribbon.',
  'Do not cover your child’s face with purple teddy unless an adult supervises.',
  'Never use magnets, except when an adult is watching.',
  'Do not put purple teddy in your child’s mouth before playtime.',
  'Pretend to cook purple teddy for an imaginary dinner.',
])('broad negation or pretend words do not exempt dangerous steps: %s', step => {
  expect(assessActivitySafety({ ...base, steps: [step, base.steps[1]] }, 4).allowed).toBe(false);
});
test('a negative supervision instruction in a note is not reassurance', () => {
  expect(assessActivitySafety({ ...base, safetyNotes: ['Do not supervise your child.'] }, 4).reasons).toContain('inadequate_supervision');
});
test.each([
  'Do not put purple teddy in your mouth.',
  'Never leave your child unsupervised.',
  'Do not use loose magnets.',
  'Never use button batteries.',
  'Keep small pieces out of reach.',
  'Avoid water play.',
])('a local prohibition is a harmless warning: %s', note => {
  expect(assessActivitySafety({ ...base, safetyNotes: [note] }, 2).allowed).toBe(true);
});
test.each([
  'Hold purple teddy and point to its ears.',
  'Hold purple teddy and name its head and ears.',
  'Tell a story about purple teddy visiting an imaginary pool.',
  'Pretend to cook an imaginary dinner for purple teddy.',
  'Imagine purple teddy flies to the moon while you hold it.',
])('toy anatomy or imaginary play is harmless: %s', step => {
  expect(assessActivitySafety({ ...base, steps: [step, base.steps[1]] }, 2).allowed).toBe(true);
});
test('pretend words cannot hide a real hazardous object', () => {
  expect(assessActivitySafety({ ...base, steps: ['Pretend to cook an imaginary dinner for purple teddy near a hot kettle.', base.steps[1]] }, 4).reasons).toContain('heat_exposure');
});
test('an avoidance note cannot cancel a contradicting instruction elsewhere', () => {
  expect(assessActivitySafety({ ...base, steps: ['Chew purple teddy while sitting together.', base.steps[1]], safetyNotes: ['Do not put purple teddy in your mouth.'] }, 4).reasons).toContain('ingestion_risk');
});
test('face context can cross a step boundary without crossing activities', () => {
  expect(assessActivitySafety({ ...base, steps: ['Press purple teddy against your child.', 'Their face should be underneath it.'] }, 4).reasons).toContain('airway_risk');
  expect(assessActivitySafety(base, 4).allowed).toBe(true);
});
test('unknown physical contact with an airway is rejected conservatively', () => {
  expect(assessActivitySafety({ ...base, steps: ['Press purple teddy against them.', 'Their face should be underneath it.'] }, 4).reasons).toContain('airway_risk');
});
test('filler sentences cannot expire the earlier physical-contact risk', () => {
  const steps = ['Press purple teddy against your child. Count to one. Count to two. Count to three. Count to four.', 'Their face should be underneath it.'];
  expect(assessActivitySafety({ ...base, steps }, 4).reasons).toContain('airway_risk');
});
test('an ambiguous its after child contact cannot be assumed to mean the toy', () => {
  expect(assessActivitySafety({ ...base, steps: ['Press purple teddy against your child.', 'Its face should be underneath it.'] }, 4).reasons).toContain('airway_risk');
});
test.each(['Watch television.', 'Watch the toy.', 'Help set up and let the youngster play on their own.', 'Do not supervise your child.'])('a parent keyword alone does not establish supervision: %s', parentRole => {
  expect(assessActivitySafety({ ...base, parentRole }, 4).reasons).toContain('inadequate_supervision');
});
