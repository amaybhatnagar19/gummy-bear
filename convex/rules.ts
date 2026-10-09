export function photoPrompt(age: number): string {
  return `My child is ${age} years old. Name the toys in this photo and give 3 play ideas for these exact toys. Return JSON with toys and ideas.`;
}
export function reserveCall(timestamps: number[], now: number): number[] | null {
  const recent = timestamps.filter(t => t > now - 3600000);
  return recent.length >= 100 ? null : [...recent, now];
}
export function validateResult(value: unknown): { toys: string[]; ideas: { title: string; instructions: string }[] } {
  const x = value as { toys?: unknown; ideas?: unknown };
  if (!x || !Array.isArray(x.toys) || !Array.isArray(x.ideas)) throw new Error('Invalid answer');
  if (x.toys.length > 12 || !x.toys.every(t => typeof t === 'string' && t.trim() && t.length < 120)) throw new Error('Invalid toys');
  if (x.toys.length === 0 && x.ideas.length === 0) return { toys: [], ideas: [] };
  if (!x.toys.length || x.ideas.length !== 3 || !x.ideas.every(i => i && typeof i.title === 'string' && i.title.trim() && typeof i.instructions === 'string' && i.instructions.trim())) throw new Error('Incomplete ideas');
  return x as ReturnType<typeof validateResult>;
}
