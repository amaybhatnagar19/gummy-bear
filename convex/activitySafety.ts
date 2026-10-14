import type { Activity } from '../shared/activityContract';
import { assessActivitySafety, activeInstructions } from './activitySafetyContext';
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function isSuitableActivity(activity: Activity, age: number): boolean {
  if (!assessActivitySafety(activity, age).allowed) return false;
  const supplies = ['paper','crayons','markers','scissors','tape','glue','bowl','basket','tray','blanket','string','bag','bottle'];
  const instructions=activeInstructions(activity.steps);
  for(const supply of supplies) {
    if(!activity.materials.some(m=>new RegExp('\\b'+supply+'s?\\b').test(m.toLowerCase())) && instructions.some(clause=>new RegExp('\\b'+supply+'s?\\b').test(clause)&&!new RegExp('imaginary '+supply+'s?\\b').test(clause))) return false;
  }
  const steps = activity.steps.map(normalize);
  if (new Set(steps).size !== steps.length) return false;
  const combined = steps.join(' ');
  if (activity.toyReferences.some(toy => !(` ${combined} `).includes(` ${normalize(toy)} `))) return false;
  const concrete = /\b(?:tell|name|wave|count|sort|group|stack|move|roll|match|choose|point|hold|place|imagine|pretend|describe|build|take turns)\b/;
  if (steps.every(step => /\b(?:have fun|enjoy|quality play time|wonderful possibilities)\b/.test(step))) return false;
  if (!steps.some(step => concrete.test(step)) || combined.split(' ').length < 10) return false;
  return true;
}
