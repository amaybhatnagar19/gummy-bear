export type EvaluationCase = { id: string; age: number; category: string; confirmedToys: string[]; expectedLabels: string[]; generationAllowed: boolean; licenseVerified: boolean; imageSha256: string | null; asset: string | null };
// Planned photo checklist. These are not 24 supplied or approved photographs.
// No caller can turn an unreviewed/private photo into an approved case.
const categories = ['plush bear', 'plush rabbit', 'large blocks', 'toy car', 'wooden train', 'nesting cups', 'stacking rings', 'large puzzle', 'toy kitchen', 'doll', 'dinosaur figurine', 'soft ball', 'shelf of toys', 'occluded plush', 'unbranded figurine', 'uncertain plush species', 'real animal (not a toy)', 'household object (not a toy)', 'tiny beads', 'button battery', 'loose magnets', 'broken sharp toy', 'long cord', 'plastic bag'];
export const evaluationCases: EvaluationCase[] = categories.map((category, i) => ({ id: `case-${String(i + 1).padStart(2, '0')}`, age: 2 + i % 7, category, confirmedToys: [], expectedLabels: [], generationAllowed: i < 16, licenseVerified: false, imageSha256: null, asset: null }));

// Approved public D1 photograph derivative; source/license in the fixture folder.
evaluationCases[0] = { ...evaluationCases[0], confirmedToys: ['brown stuffed animal'], expectedLabels: ['teddy bear', 'stuffed animal'], licenseVerified: true, imageSha256: 'b2f3ce41f030bbbb3625c48ee74426a5c7aa0bfe52d52271a3f06f3aa3b503d4', asset: 'tests/fixtures/ai-evaluation/case-01.jpg' };
