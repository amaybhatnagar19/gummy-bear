import type { Activity } from '../shared/activityContract';

export type SafetyReason = 'invalid_age' | 'airway_risk' | 'heat_exposure' | 'height_risk'
  | 'neck_wrapping' | 'ingestion_risk' | 'inadequate_supervision' | 'small_parts'
  | 'hazardous_material' | 'water_play' | 'dangerous_stunt';
export type SafetyAssessment = { allowed: boolean; reasons: SafetyReason[] };

const normalized = (text: string) => text.normalize('NFKC').toLowerCase()
  .replace(/[’‘]/g, "'").replace(/[‐‑‒–—]/g, '-');
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const human = /\b(?:child(?:ren)?|toddler|kid|youngster|baby|little one)\b/;
const bodyPart = /\b(?:mouth|nose|nostrils?|ears?|face|head)\b/;
const bodyPossession = /\b(?:your|their|his|her|child's|toddler's|youngster's|baby's)\b[^.;!?]{0,35}\b(?:mouth|nose|nostrils?|ears?|face|head|neck|throat)\b/;

function clauses(text: string): string[] {
  // Keep ordered clauses rather than checking isolated sentences. Conjunctions
  // end a prohibition's scope; ambiguity is not treated as a broad exemption.
  return normalized(text).split(/[.,;!?\n]|\b(?:but|then|however|instead|while|and)\b/)
    .map(clause => clause.trim()).filter(Boolean);
}
function prohibitedClause(clause: string): boolean {
  // Only direct prohibitions of actions qualify. "Do not worry/hesitate" and
  // arbitrary reassuring language cannot disable the hazard assessment.
  return /^(?:do not|don't|never) (?:use|put|place|insert|chew|swallow|touch|climb|stand|wrap|tie|fasten|cover|leave|let|heat|warm|cook|throw|open|play)\b/.test(clause)
    || /^avoid (?:using|putting|placing|inserting|chewing|swallowing|climbing|standing|wrapping|tying|fastening|covering|heating|throwing)\b/.test(clause)
    || /^avoid water play$/.test(clause)
    || /^keep (?:small |loose )?(?:pieces|parts|magnets|batteries) out of reach(?: of children)?$/.test(clause);
}
function activeClauses(text: string): string[] {
  // Exceptions can turn a prohibition into permission ("do not ... unless
  // supervised"). Keep such text for hazard assessment, including exceptions
  // separated by punctuation, instead of treating it as a safe warning.
  const conditional = /\b(?:unless|except|until|before|after)\b/.test(normalized(text));
  return clauses(text).filter(clause => conditional || !prohibitedClause(clause));
}
function supervised(role: string): boolean {
  const active = activeClauses(role).join(' ');
  if (/\b(?:do not|don't|never) (?:supervise|watch|stay|sit|help|guide|assist|support)\b/.test(active)) return false;
  const distracted = /\b(?:television|tv|movie|phone|scroll|asleep|sleeping|another room)\b/.test(active);
  const independent = /\b(?:alone|unsupervised|independently|on (?:their|his|her|its) own|no adult supervision|without (?:an? )?(?:adult|parent))\b/.test(active);
  if (distracted || independent) return false;
  // Positive parent involvement must describe presence, actual supervision,
  // or helping the child, not merely contain a verb such as "watch".
  return /\b(?:stay|sit|play) together\b/.test(active)
    || /\b(?:stay|sit|join)\b.{0,35}\b(?:child|toddler|youngster|kid)\b/.test(active)
    || /\bwatch\b.{0,15}\b(?:child|toddler|youngster|kid)\b/.test(active)
    || /\bsupervise(?: closely| directly| your child| the child)?$/.test(active)
    || /\b(?:help|guide|assist|support)\b.{0,20}\b(?:child|toddler|youngster|kid)\b/.test(active);
}

export function assessActivitySafety(activity: Activity, age: number): SafetyAssessment {
  if (!Number.isInteger(age) || age < 2 || age > 8) return { allowed: false, reasons: ['invalid_age'] };
  const reasons = new Set<SafetyReason>();
  const toyPattern = new RegExp(`\\b(?:${activity.toyReferences.map(name => escape(normalized(name))).join('|')})\\b`);
  const toyPossessive = new RegExp(`(?:${activity.toyReferences.map(name => escape(normalized(name))).join('|')}|'?toy|'?teddy)'s\\s+(?:head|face|ears?|mouth|nose)\\b`);
  const instructions = activity.steps.flatMap(activeClauses);
  // State belongs to this activity only. A directed contact/binding action can
  // precede its body target in a later clause or step, including a pronoun.
  let pendingContact = false;
  let pendingChildContact = false;
  let pendingBinding = false;
  let previousToy = false;

  const check = (clause: string, instruction: boolean) => {
    const toyMention = toyPattern.test(clause) || /\b(?:toy|teddy|blocks?|pieces?|parts?)\b/.test(clause);
    const childMention = human.test(clause) || /\b(?:your|their|his|her)\b/.test(clause);
    const namesToyBody = toyPossessive.test(clause)
      || (/\bits (?:head|face|ears?|mouth|nose)\b/.test(clause) && (toyMention || previousToy) && !pendingChildContact);
    const targetsHumanBody = bodyPossession.test(clause) || (human.test(clause) && bodyPart.test(clause));
    const ambiguousBody = bodyPart.test(clause) && !namesToyBody;
    const contact = /\b(?:put|place|insert|push|stuff|hold|press|cover)\b/.test(clause);
    const strongContact = /\b(?:insert|push|stuff|press|cover)\b/.test(clause);
    if ((targetsHumanBody || ambiguousBody)
      && (contact || (instruction && pendingContact))) reasons.add('airway_risk');
    if (/\bplastic bags?\b/.test(clause)) reasons.add('airway_risk');

    const binding = /\b(?:fasten|tie|wrap|loop|drape|attach|secure|wind|knot)\b/.test(clause);
    const neck = /\b(?:neck|throat)\b/.test(clause);
    const strap = /\b(?:ribbon|cord|rope|string|strap)\b/.test(clause);
    if (neck && (binding || strap || (instruction && pendingBinding))) reasons.add('neck_wrapping');

    const consumption = /\b(?:chew(?:s|ing)?|swallow(?:s|ing)?|lick(?:s|ing)?|bite|bites|biting|eat|eats|eating|mouth(?:ing)?)\b/.exec(clause);
    if (consumption) {
      // Resolve the consumed object, rather than relying on a few toy nouns.
      const object = clause.slice(consumption.index + consumption[0].length);
      if (toyPattern.test(object) || /\b(?:toy|teddy|pieces?|parts?|blocks?)\b/.test(object)
        || /^(?:\s+the)?\s+(?:it|them)\b/.test(object)) reasons.add('ingestion_risk');
    }

    if (/\b(?:magnets?|batter(?:y|ies)|bleach|chemicals?|detergent|cleaning fluid|poison|knife|knives|scissors|sharp tools?)\b/.test(clause)
      || /\b(?:broken|damaged|sharp)\s+(?:toys?|pieces?|parts?|edges?)\b/.test(clause)) reasons.add('hazardous_material');
    const hotObject = /\b(?:hot|heated|boiling|lit)\b.{0,40}\b(?:kettle|pot|pan|water|candle|heater|radiator)\b/.test(clause)
      || /\b(?:kettle|pot|pan|water|candle|heater|radiator)\b.{0,25}\b(?:hot|heated|boiling|lit)\b/.test(clause);
    const realHeat = /\b(?:fire|flames?|boiling|stove|oven|microwave|electricity|electrical|wall socket|power outlet|suffocation)\b/.test(clause);
    const heatAction = /\b(?:heat|warm|burn|melt)\b/.test(clause) && (toyMention || childMention || /\bit\b/.test(clause));
    // Only the meal is imaginary. Mentioning a pretend game somewhere else
    // must not excuse cooking the physical toy itself.
    const imaginaryCooking = /\bpretend (?:to )?cook (?:an? )?imaginary (?:meal|dinner|lunch|breakfast|food|soup)\b/.test(clause);
    if (hotObject || realHeat || heatAction || (/\bcook\b/.test(clause) && toyMention && !imaginaryCooking)) reasons.add('heat_exposure');

    const elevated = /\b(?:chair|table|stool|height|stairs?|window|roof|ledge|ladder|shelf)\b/.test(clause);
    const upwardAction = /\b(?:stand|standing|climb|climbing|jump|jumping|leap|balance|reach|reaching)\b/.test(clause);
    if (elevated && upwardAction) reasons.add('height_risk');
    if (/\b(?:throw|toss|launch|blindfold|blindfolded)\b/.test(clause)) reasons.add('dangerous_stunt');

    // Remove only the explicitly imaginary setting, not other words/actions
    // in the clause. A real bucket of water remains prohibited despite pretend.
    const physicalSetting = clause.replace(/\bimaginary (?:pool|bath|water|river|ocean)\b/g, 'fictional setting');
    if (/\b(?:water|bath|bucket|pool|drown|submerge)\b/.test(physicalSetting)) reasons.add('water_play');
    if (age < 3 && (/\b(?:small|tiny|loose|miniature|minuscule)\s+(?:pieces?|parts?|beads?|blocks?|counters?|tokens?)\b/.test(clause)
      || /\b(?:beads?|marbles?|coins?)\b/.test(clause))) reasons.add('small_parts');

    if (/\b(?:do not|don't|never) (?:supervise|watch)\b/.test(clause)
      || /\b(?:alone|unsupervised|independently|on (?:their|his|her) own)\b/.test(clause) && human.test(clause)
      || /\b(?:no adult supervision|without (?:an? )?(?:adult|parent))\b/.test(clause)) reasons.add('inadequate_supervision');
    if (instruction) {
      // Do not expire a risky action merely because filler sentences intervene.
      // Explicit toy anatomy still distinguishes harmless contact with the toy.
      pendingContact ||= strongContact;
      pendingChildContact ||= strongContact && (human.test(clause) || /\bagainst (?:them|him|her)\b/.test(clause));
      pendingBinding ||= binding;
      previousToy = toyMention;
    }
  };

  for (const clause of instructions) check(clause, true);
  // A harmless note cannot cancel any reason found in the actual instructions.
  for (const field of [activity.title, ...activity.materials, ...activity.toyReferences, activity.parentRole, ...activity.safetyNotes]) {
    for (const clause of activeClauses(field)) check(clause, false);
  }
  if (!supervised(activity.parentRole)) reasons.add('inadequate_supervision');
  return { allowed: reasons.size === 0, reasons: [...reasons] };
}
