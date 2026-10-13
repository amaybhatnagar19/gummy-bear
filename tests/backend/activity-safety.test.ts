import { expect, test } from 'vitest';
import type { Activity } from '../../shared/activityContract';
import { isSuitableActivity } from '../../convex/activitySafety';
import { parseActivityResponse } from '../../shared/activityContract';
const base: Activity = {
  category: 'play_together', title: 'Teddy story', durationMinutes: 5,
  materials: ['purple teddy'], toyReferences: ['purple teddy'],
  steps: ['Hold the purple teddy and start a pretend journey.', 'Take turns telling where the purple teddy goes next.'],
  parentRole: 'Stay with your child and help them take turns.', safetyNotes: ['Use only intact, age-appropriate toys.'],
};
test.each([2, 3, 8])('a concrete supervised story is accepted at age %i', age => {
  expect(isSuitableActivity(base, age)).toBe(true);
});
test.each([
  'Use loose magnets to decorate the purple teddy.',
  'Open a button battery and give it to the purple teddy.',
  'Put the purple teddy into your child’s mouth.',
  'Place a plastic bag over your child’s head for the purple teddy story.',
  'Wrap a cord around your child’s neck to carry the purple teddy.',
  'Mix bleach for cleaning the purple teddy.',
  'Heat the purple teddy on a stove.',
  'Plug the purple teddy into a wall socket.',
  'Cut the purple teddy with a sharp knife.',
  'Use a broken toy to make a house for the purple teddy.',
  'Climb onto a chair and jump with the purple teddy.',
  'Blindfold your child and find the purple teddy.',
  'Put the purple teddy in a bucket of water.',
  'Cover your child’s face with the purple teddy.',
  'Tie the purple teddy around your child’s neck.',
  'Warm the purple teddy in an oven.',
  'Do not use magnets, but put the purple teddy in your child’s mouth.',
])('hazardous instruction is rejected even with reassuring notes: %s', step => {
  expect(isSuitableActivity({ ...base, steps: [step, base.steps[1]], safetyNotes: ['An adult will supervise.'] }, 4)).toBe(false);
});
test('small loose pieces are rejected for age two', () => {
  expect(isSuitableActivity({ ...base, steps: ['Sort small pieces beside the purple teddy.', base.steps[1]] }, 2)).toBe(false);
});
test.each([
  'Pretend the purple teddy cooks an imaginary dinner.',
  'Pretend to cook an imaginary meal for the purple teddy.',
  'Tell a story where the purple teddy flies through imaginary clouds.',
  'Wave the purple teddy’s ears hello while sitting together.',
  'Imagine the purple teddy explores the moon while you hold it.',
])('harmless imaginary play is accepted: %s', step => {
  expect(isSuitableActivity({ ...base, steps: [step, base.steps[1]] }, 2)).toBe(true);
});
test('pretend wording cannot excuse a real hazardous method', () => {
  expect(isSuitableActivity({ ...base, steps: ['Pretend to cook an imaginary dinner for purple teddy using bleach.', base.steps[1]] }, 2)).toBe(false);
});
test.each([
  'Do not use loose magnets.', 'Never use button batteries.',
  'Keep small pieces out of reach.', 'Avoid water play.',
])('an explicit avoidance note does not cause rejection: %s', note => {
  expect(isSuitableActivity({ ...base, safetyNotes: [note] }, 2)).toBe(true);
});
test.each([
  { steps: ['Have fun with your toys.', 'Be creative and enjoy playtime.'] },
  { steps: ['Play with the purple teddy.', 'Have fun with the purple teddy.'] },
  { parentRole: 'Leave your child alone to play.' },
  { parentRole: 'No adult supervision is needed.' },
  { parentRole: 'Help set up, then let your child play independently.' },
  { steps: ['Hold the purple teddy.', 'Hold the purple teddy.'] },
])('generic, repetitive or unsupervised activities are rejected: %j', changes => {
  expect(isSuitableActivity({ ...base, ...changes }, 4)).toBe(false);
});
test('a reference must be a whole toy name, not a substring of another word', () => {
  expect(isSuitableActivity({ ...base, toyReferences: ['car'], materials: ['car'], steps: ['Hold a card and start a pretend journey.', 'Take turns telling where the card goes next.'] }, 4)).toBe(false);
});

const reproducedBypasses: { name: string; age: number; changes: Partial<Activity> }[] = [
  { name: 'split-sentence face covering', age: 4, changes: { steps: ['Hold purple teddy. Press it against your child. Their face should be underneath it.', base.steps[1]] } },
  { name: 'hot kettle', age: 4, changes: { steps: ['Place purple teddy near a hot kettle for this game.', base.steps[1]] } },
  { name: 'standing on a stool', age: 4, changes: { steps: ['Have your child stand on a stool to reach purple teddy.', base.steps[1]] } },
  { name: 'ribbon fastening around neck', age: 4, changes: { steps: ['Fasten purple teddy around the youngster’s neck with ribbon.', base.steps[1]] } },
  { name: 'chewing a differently named toy', age: 4, changes: { materials: ['purple dinosaur'], toyReferences: ['purple dinosaur'], steps: ['Chew the purple dinosaur while sitting together with your parent.', 'Hold purple dinosaur and take turns pretending it greets you.'] } },
  { name: 'watching television is not supervision', age: 4, changes: { parentRole: 'Watch television while the toddler plays on their own.' } },
  { name: 'miniature counters under three', age: 2, changes: { steps: ['Sort miniature counters beside purple teddy into different groups.', base.steps[1]] } },
];
test.each(reproducedBypasses)('Task 2A reproduced bypass: $name is rejected', ({ age, changes }) => {
  const activity = { ...base, ...changes };
  // Establish that rejection is not merely a malformed response.
  parseActivityResponse({ toys: activity.materials, activities: [activity] });
  expect(isSuitableActivity(activity, age)).toBe(false);
});
test.each([
  'Hold the purple teddy and point to its ears.',
  'Hold the purple teddy and name its head and ears.',
  'Tell a story about purple teddy visiting an imaginary pool.',
])('Task 2A harmless counterpart survives quality and safety: %s', step => {
  expect(isSuitableActivity({ ...base, steps: [step, base.steps[1]], safetyNotes: ['Do not put the purple teddy in your mouth.'] }, 2)).toBe(true);
});
