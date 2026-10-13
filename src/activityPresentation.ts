import { categories, categoryLabels, formatActivityInstructions, type LegacyResult, type StructuredResult } from '../shared/activityContract';

export type PresentedResult = {
  toys: string[];
  ideas: { title: string; instructions: string; categoryLabel: string; categoryIndex: number }[];
  limitation: string | null;
};
export function presentActivities(result: LegacyResult | StructuredResult): PresentedResult {
  if ('schemaVersion' in result) {
    return {
      toys: result.toys, limitation: result.limitation,
      ideas: result.activities.map(activity => ({
        title: activity.title, instructions: formatActivityInstructions(activity),
        categoryLabel: categoryLabels[activity.category], categoryIndex: categories.indexOf(activity.category),
      })),
    };
  }
  return {
    toys: result.toys, limitation: result.ideas.length ? null : 'I couldn’t spot any toys clearly. Try a closer, brighter photo.',
    ideas: result.ideas.map((idea, i) => ({ ...idea, categoryLabel: categoryLabels[categories[i]], categoryIndex: i })),
  };
}
