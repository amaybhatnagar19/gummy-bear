import { v } from 'convex/values';
import { parseActivityResponse, formatActivityInstructions, type StructuredResult, type LegacyResult } from '../shared/activityContract';
import { assessActivitySafety } from './activitySafetyContext';
import { isSuitableActivity } from './activitySafety';
import { deduplicateActivities } from './activityDuplicates';

export const limitationMessage = 'I couldn’t find a suitable play idea from this photo. Try a clearer photo with different toys.';
export const activityValidator = v.object({
  category: v.union(v.literal('quick_play'), v.literal('creative_adventure'), v.literal('play_together')),
  title: v.string(), durationMinutes: v.number(), materials: v.array(v.string()), steps: v.array(v.string()),
  parentRole: v.string(), safetyNotes: v.array(v.string()), toyReferences: v.array(v.string()),
});
export const structuredResultValidator = v.object({
  schemaVersion: v.literal(2), outcome: v.union(v.literal('success'), v.literal('limitation')),
  limitation: v.union(v.string(), v.null()), toys: v.array(v.string()), activities: v.array(activityValidator),
});
export const legacyResultValidator = v.object({
  toys: v.array(v.string()), ideas: v.array(v.object({ title: v.string(), instructions: v.string() })), raw: v.string(),
});
export function limitationResult(toys: string[] = [], reason: 'unknown'|'safety'|'quality'|'repetition' = 'unknown'): StructuredResult {
  const detail = {unknown:'',safety:' These suggestions weren’t suitable for this age.',quality:' These suggestions weren’t specific enough to be useful.',repetition:' These ideas were too similar to earlier suggestions; you can deliberately revisit a favorite.'}[reason];
  return { schemaVersion: 2, outcome: 'limitation', limitation: limitationMessage + detail, toys, activities: [] };
}
export function validateAndFilterActivities(value: unknown, age: number): StructuredResult {
  const parsed = parseActivityResponse(value);
  const activities = deduplicateActivities(parsed.activities.filter(activity => isSuitableActivity(activity, age)));
  if (!activities.length) return limitationResult(parsed.toys, parsed.activities.length ? parsed.activities.every(a=>!assessActivitySafety(a,age).allowed) ? 'safety' : 'quality' : 'unknown');
  return { schemaVersion: 2, outcome: 'success', limitation: null, toys: parsed.toys, activities };
}
export function legacyResponse(result: StructuredResult): LegacyResult {
  const response = { toys: result.toys, ideas: result.activities.map(activity => ({
    title: activity.title, instructions: formatActivityInstructions(activity),
  })) };
  // Never return rejected provider candidates in the legacy raw field.
  return { ...response, raw: JSON.stringify(response) };
}
