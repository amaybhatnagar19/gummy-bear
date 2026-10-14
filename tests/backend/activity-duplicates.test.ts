import { expect, test } from 'vitest';
import type { Activity } from '../../shared/activityContract';
import { deduplicateActivities } from '../../convex/activityDuplicates';
const base: Activity = {
  category: 'quick_play', title: 'Color groups', durationMinutes: 5,
  materials: ['blocks'], toyReferences: ['blocks'],
  steps: ['Sort the blocks into groups by color.', 'Point to each group of blocks and name its color.'],
  parentRole: 'Stay together and help your child name colors.', safetyNotes: ['Use only intact, age-appropriate toys.'],
};
test('exact duplicates keep only the first', () => {
  expect(deduplicateActivities([base, structuredClone(base)])).toEqual([base]);
});
test('different titles, categories and durations do not disguise identical mechanics', () => {
  expect(deduplicateActivities([base, { ...base, title: 'Rainbow rescue', category: 'creative_adventure', durationMinutes: 10 }])).toEqual([base]);
});
test('obvious sorting paraphrases are duplicates', () => {
  const alternative = { ...base, title: 'Colour families', steps: ['Group blocks according to their colour.', 'Name the colours of the blocks in each group.'] };
  expect(deduplicateActivities([base, alternative])).toEqual([base]);
});
test('arranging by color and sorting by color describe the same mechanic', () => {
  const alternative = { ...base, title: 'Colour shelves', steps: ['Arrange blocks by their colour.', 'Take turns naming the colour of each set.'] };
  expect(deduplicateActivities([base, alternative])).toEqual([base]);
});
test('formatting and step order do not disguise repetition', () => {
  expect(deduplicateActivities([base, { ...base, steps: [...base.steps].reverse().map(s => s.toUpperCase()) }])).toEqual([base]);
});
test('stacking and storytelling remain distinct from sorting', () => {
  const stack = { ...base, title: 'Tower', steps: ['Stack blocks into a short tower on the floor.', 'Count the blocks as you add each one.'] };
  const story = { ...base, title: 'Adventure', steps: ['Tell a pretend story about the blocks.', 'Take turns adding a sentence about their journey.'] };
  expect(deduplicateActivities([base, stack, story])).toEqual([base, stack, story]);
});
test('story titles and imaginary destinations alone are not a different game', () => {
  const story = { ...base, steps: ['Tell a story about the blocks visiting the moon.', 'Take turns describing their journey.'] };
  const repeat = { ...base, title: 'Ocean trip', steps: ['Describe an adventure where the blocks visit the sea.', 'Add a sentence each about the pretend journey.'] };
  expect(deduplicateActivities([story, repeat])).toEqual([story]);
});
test('copy and imitate use the same mirror mechanic',()=>{const first={...base,steps:['Move blocks slowly left and right while sitting.','Ask your child to copy the blocks movements.']};const second={...base,title:'Follow along',steps:['Gently move blocks side to side on the floor.','Have your child imitate your movements with blocks.']};expect(deduplicateActivities([first,second])).toEqual([first]);});
test('tower wording does not disguise the same stacking game',()=>{const first={...base,steps:['Stack blocks into a short tower on the floor.','Count the blocks as you add each one.']};const second={...base,title:'Build a high-rise',steps:['Place blocks one on top of another on the floor to make a short tower.','Count each block together as it joins the tower.']};expect(deduplicateActivities([first,second])).toEqual([first]);});
