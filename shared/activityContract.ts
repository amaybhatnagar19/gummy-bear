export const categories = ['quick_play', 'creative_adventure', 'play_together'] as const;
export type ActivityCategory = typeof categories[number];
export type Activity = {
  category: ActivityCategory;
  title: string;
  durationMinutes: number;
  materials: string[];
  steps: string[];
  parentRole: string;
  safetyNotes: string[];
  toyReferences: string[];
};
export type ActivityResponse = { toys: string[]; activities: Activity[] };
export type StructuredResult = ActivityResponse & {
  schemaVersion: 2;
  outcome: 'success' | 'limitation';
  limitation: string | null;
};
export type LegacyResult = { toys: string[]; ideas: { title: string; instructions: string }[]; raw: string };
export const categoryLabels: Record<ActivityCategory, string> = {
  quick_play: 'Quick play', creative_adventure: 'Creative adventure', play_together: 'Play together',
};
export function formatActivityInstructions(activity: Activity): string {
  return [
    `${categoryLabels[activity.category]}. About ${activity.durationMinutes} minutes.`,
    `Materials: ${activity.materials.join(', ')}.`,
    ...activity.steps.map((step, i) => `${i + 1}. ${step}`),
    `Parent role: ${activity.parentRole}`, `Safety: ${activity.safetyNotes.join(' ')}`,
  ].join(' ');
}

const text = (maxLength: number) => ({ type: 'string', minLength: 1, maxLength });
const list = (minItems: number, maxItems: number, maxLength: number) => ({
  type: 'array', minItems, maxItems, items: text(maxLength),
});
const activityProperties = {
  category: { type: 'string', enum: [...categories] },
  title: text(80),
  durationMinutes: { type: 'integer', minimum: 1, maximum: 30 },
  materials: list(1, 12, 119),
  steps: list(2, 5, 240),
  parentRole: text(240),
  safetyNotes: list(1, 3, 200),
  toyReferences: list(1, 12, 119),
};
export const activityJsonSchema = {
  type: 'object', additionalProperties: false, required: ['toys', 'activities'],
  properties: {
    toys: list(0, 12, 119),
    activities: {
      type: 'array', minItems: 0, maxItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        required: Object.keys(activityProperties), properties: activityProperties,
      },
    },
  },
};

function invalid(): never { throw new Error('Malformed activity response'); }
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const result = value as Record<string, unknown>;
  if (Object.keys(result).length !== keys.length || keys.some(key => !Object.hasOwn(result, key))) return invalid();
  return result;
}
function string(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) return invalid();
  return value.trim();
}
function strings(value: unknown, min: number, max: number, length: number): string[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) return invalid();
  return value.map(item => string(item, length));
}
function unique(values: string[]): boolean {
  return new Set(values.map(value => value.toLowerCase())).size === values.length;
}

export function parseActivityResponse(value: unknown): ActivityResponse {
  const root = object(value, ['toys', 'activities']);
  const toys = strings(root.toys, 0, 12, 119);
  if (!unique(toys) || !Array.isArray(root.activities) || root.activities.length > 3) return invalid();
  const activities = root.activities.map(candidate => {
    const item = object(candidate, Object.keys(activityProperties));
    if (!categories.includes(item.category as ActivityCategory)
      || !Number.isInteger(item.durationMinutes) || (item.durationMinutes as number) < 1
      || (item.durationMinutes as number) > 30) return invalid();
    const toyReferences = strings(item.toyReferences, 1, 12, 119);
    const materials = strings(item.materials, 1, 12, 119);
    if (!unique(toyReferences) || !unique(materials)
      || toyReferences.some(name => !toys.includes(name))
      || materials.some(name => !toyReferences.includes(name))
      || toyReferences.some(name => !materials.includes(name))) return invalid();
    return {
      category: item.category as ActivityCategory,
      title: string(item.title, 80), durationMinutes: item.durationMinutes as number,
      materials, steps: strings(item.steps, 2, 5, 240),
      parentRole: string(item.parentRole, 240), safetyNotes: strings(item.safetyNotes, 1, 3, 200), toyReferences,
    };
  });
  return { toys, activities };
}
