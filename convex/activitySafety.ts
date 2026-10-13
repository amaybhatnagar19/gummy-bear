import type { Activity } from '../shared/activityContract';
import { assessActivitySafety } from './activitySafetyContext';
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function isSuitableActivity(activity: Activity, age: number): boolean {
  if (!assessActivitySafety(activity, age).allowed) return false;
  const steps = activity.steps.map(normalize);
  if (new Set(steps).size !== steps.length) return false;
  const combined = steps.join(' ');
  if (activity.toyReferences.some(toy => !(` ${combined} `).includes(` ${normalize(toy)} `))) return false;
  const concrete = /\b(?:tell|name|wave|count|sort|group|stack|move|roll|match|choose|point|hold|place|imagine|pretend|describe|build|take turns)\b/;
  if (!steps.some(step => concrete.test(step)) || combined.split(' ').length < 10) return false;
  return true;
}
