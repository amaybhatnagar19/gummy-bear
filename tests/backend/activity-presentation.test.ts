import { expect, test } from 'vitest';
import type { Activity } from '../../shared/activityContract';
import { presentActivities } from '../../src/activityPresentation';
import { validateAndFilterActivities, legacyResponse, limitationResult } from '../../convex/activityResponses';
const activity: Activity = {
  category: 'play_together', title: 'Teddy story', durationMinutes: 5,
  materials: ['purple teddy'], toyReferences: ['purple teddy'],
  steps: ['Hold the purple teddy and start a pretend journey.', 'Take turns telling where the purple teddy goes next.'],
  parentRole: 'Stay with your child and help them take turns.', safetyNotes: ['Use only intact, age-appropriate toys.'],
};
test('existing card content includes duration, materials, steps, parent role and safety', () => {
  const result = validateAndFilterActivities({ toys: ['purple teddy'], activities: [activity] }, 4);
  const view = presentActivities(result);
  expect(view.ideas).toHaveLength(1);
  expect(view.ideas[0]).toMatchObject({ title: activity.title, categoryLabel: 'Play together', categoryIndex: 2 });
  for (const text of ['About 5 minutes', 'Materials: purple teddy', ...activity.steps, activity.parentRole, ...activity.safetyNotes]) {
    expect(view.ideas[0].instructions).toContain(text);
  }
});
test('legacy conversion preserves the exact old keys and includes only accepted content', () => {
  const unsafe = { ...activity, title: 'Battery game', steps: ['Open a button battery beside purple teddy.', activity.steps[1]] };
  const result = validateAndFilterActivities({ toys: ['purple teddy'], activities: [unsafe, activity] }, 4);
  const legacy = legacyResponse(result);
  expect(Object.keys(legacy).sort()).toEqual(['ideas', 'raw', 'toys']);
  expect(Object.keys(legacy.ideas[0]).sort()).toEqual(['instructions', 'title']);
  expect(legacy.ideas).toHaveLength(1);
  expect(legacy.raw).not.toContain('Battery game');
  expect(JSON.parse(legacy.raw)).toEqual({ toys: legacy.toys, ideas: legacy.ideas });
  expect(presentActivities(legacy).ideas[0].title).toBe(activity.title);
});
test('zero accepted activities have a recoverable server-written limitation, without filler', () => {
  const view = presentActivities(limitationResult(['purple teddy']));
  expect(view.ideas).toEqual([]);
  expect(view.limitation).toContain('Try a clearer photo');
});
test('unsafe, generic and duplicate candidates leave the valid candidate intact', () => {
  const unsafe = { ...activity, steps: ['Put purple teddy in your child’s mouth.', activity.steps[1]] };
  const generic = { ...activity, steps: ['Have fun with purple teddy.', 'Be creative with purple teddy.'] };
  for (const rejected of [unsafe, generic, { ...activity, title: 'Renamed story' }]) {
    expect(validateAndFilterActivities({ toys: ['purple teddy'], activities: [activity, rejected] }, 4).activities).toEqual([activity]);
  }
});
