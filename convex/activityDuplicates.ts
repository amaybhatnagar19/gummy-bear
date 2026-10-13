import type { Activity } from '../shared/activityContract';

function normalize(activity: Activity): string {
  let text = activity.steps.join(' ').toLowerCase();
  for (const name of [...activity.toyReferences].sort((a, b) => b.length - a.length)) {
    text = text.split(name.toLowerCase()).join('toy');
  }
  return text.replace(/colours?/g, 'color').replace(/colors/g, 'color')
    .replace(/\b(?:sorting|sorted|group|grouping|grouped|organize|organise|organizing|organising|arrange|arranging)\b/g, 'sort')
    .replace(/\b(?:stacking|stacked)\b/g, 'stack').replace(/\b(?:rolling|rolled)\b/g, 'roll')
    .replace(/\b(?:describe|telling|describing)\b/g, 'tell')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function mechanics(text: string): string {
  const actions: string[] = [];
  if (/\bsort\b/.test(text)) {
    for (const attribute of ['color', 'shape', 'size']) if (text.includes(attribute)) actions.push(`sort:${attribute}`);
  }
  if (/\bstack\b/.test(text)) actions.push('stack');
  if (/\broll\b/.test(text)) actions.push('roll');
  if (/\b(?:story|adventure|journey)\b/.test(text) && /\b(?:tell|sentence|turns)\b/.test(text)) actions.push('story');
  return actions.sort().join('|');
}
function repeated(a: Activity, b: Activity): boolean {
  const left = normalize(a), right = normalize(b);
  if (left === right) return true;
  const first = mechanics(left), second = mechanics(right);
  if (first && first === second) return true;
  const stop = new Set(['the', 'a', 'an', 'and', 'of', 'to', 'with', 'your', 'each', 'in', 'its', 'it', 'toy']);
  const tokens = (text: string) => new Set(text.split(' ').filter(word => !stop.has(word)));
  const x = tokens(left), y = tokens(right);
  const union = new Set([...x, ...y]);
  const intersection = [...x].filter(word => y.has(word)).length;
  return union.size > 0 && intersection / union.size >= 0.8;
}
export function deduplicateActivities(activities: Activity[]): Activity[] {
  const accepted: Activity[] = [];
  for (const activity of activities) if (!accepted.some(previous => repeated(previous, activity))) accepted.push(activity);
  return accepted;
}
