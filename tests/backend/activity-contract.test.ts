import { expect, test } from 'vitest';
import { parseActivityResponse, activityJsonSchema } from '../../shared/activityContract';

const activity = {
  category: 'play_together', title: 'Teddy story', durationMinutes: 5,
  materials: ['purple teddy'], steps: ['Hold the purple teddy and start a pretend journey.', 'Take turns telling where the purple teddy goes next.'],
  parentRole: 'Stay with your child and help them take turns.',
  safetyNotes: ['Use only intact, age-appropriate toys.'], toyReferences: ['purple teddy'],
};
const response = () => ({ toys: ['purple teddy'], activities: [structuredClone(activity)] });

test.each([1, 2, 3])('the structural contract accepts %i candidates without requiring three', count => {
  const value = { toys: ['purple teddy'], activities: Array.from({ length: count }, () => structuredClone(activity)) };
  expect(parseActivityResponse(value)).toEqual(value);
});
test('zero candidates is a valid limitation input, including recognized toys', () => {
  expect(parseActivityResponse({ toys: ['purple teddy'], activities: [] }).activities).toEqual([]);
  expect(parseActivityResponse({ toys: [], activities: [] })).toEqual({ toys: [], activities: [] });
});
test.each(Object.keys(activity))('missing %s is malformed', key => {
  const value = response();
  delete (value.activities[0] as Record<string, unknown>)[key];
  expect(() => parseActivityResponse(value)).toThrow('Malformed');
});
test.each([
  ['category', 'unknown'], ['title', ' '], ['title', 'x'.repeat(81)],
  ['durationMinutes', 0], ['durationMinutes', 31], ['durationMinutes', 2.5], ['durationMinutes', '5'],
  ['materials', []], ['materials', ['new toy']], ['materials', Array(13).fill('purple teddy')],
  ['steps', ['One step']], ['steps', [' ', 'Hold purple teddy.']], ['steps', ['x'.repeat(241), 'Hold purple teddy.']],
  ['steps', Array(6).fill('Hold purple teddy.')], ['steps', [123, 'Hold purple teddy.']],
  ['parentRole', ''], ['parentRole', 'x'.repeat(241)], ['safetyNotes', []], ['safetyNotes', [' ']],
  ['safetyNotes', Array(4).fill('Stay together.')], ['safetyNotes', ['x'.repeat(201)]],
  ['toyReferences', []], ['toyReferences', ['invisible toy']], ['toyReferences', ['purple teddy', 'purple teddy']],
])('invalid %s value %j is rejected', (key, invalid) => {
  const value = response();
  (value.activities[0] as Record<string, unknown>)[key] = invalid;
  expect(() => parseActivityResponse(value)).toThrow('Malformed');
});
test.each([
  null, [], {}, { toys: [], activities: [activity] },
  { toys: [123], activities: [] }, { toys: ['purple teddy'], activities: null },
  { toys: ['teddy', 'TEDDY'], activities: [] },
  { toys: Array.from({ length: 13 }, (_, i) => `toy ${i}`), activities: [] },
  { toys: ['x'.repeat(120)], activities: [] },
  { ...response(), extra: true },
  { toys: ['purple teddy'], activities: [{ ...activity, extra: true }] },
  { toys: ['purple teddy'], activities: Array(4).fill(activity) },
])('invalid envelope or unknown fields are rejected: %j', value => {
  expect(() => parseActivityResponse(value)).toThrow('Malformed');
});
test('a malformed candidate rejects the response rather than being silently repaired', () => {
  expect(() => parseActivityResponse({ toys: ['purple teddy'], activities: [activity, { title: 'broken' }] })).toThrow('Malformed');
});
test('provider schema requires all fields and disallows additional properties', () => {
  expect(activityJsonSchema.required).toEqual(['toys', 'activities']);
  expect(activityJsonSchema.additionalProperties).toBe(false);
  expect(activityJsonSchema.properties.activities.items.required).toEqual(Object.keys(activity));
  expect(activityJsonSchema.properties.activities.items.additionalProperties).toBe(false);
});
