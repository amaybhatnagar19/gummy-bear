import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { evaluationCases, evaluationPilotIds, evaluationAlternativeIds, EVALUATION_DATASET_VERSION } from '../../shared/evaluationCorpus';
const manifest=JSON.parse(readFileSync(new URL('../fixtures/ai-evaluation/manifest.json',import.meta.url),'utf8'));
test('all 24 reviewed licensed photographs match the server allowlist and distinct byte hashes',()=>{
 expect(manifest.version).toBe(EVALUATION_DATASET_VERSION);expect(evaluationCases).toHaveLength(24);expect(new Set(evaluationCases.map(c=>c.imageSha256)).size).toBe(24);
 for(const item of evaluationCases){const entry=manifest.cases.find((c:{id:string})=>c.id===item.id);expect(entry).toMatchObject(item);expect(entry.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File/);expect(entry.licenseUrl).toMatch(/^https:\/\/creativecommons.org\//);expect(entry.creator.length).toBeGreaterThan(0);expect(entry.criteria.length).toBeGreaterThan(0);expect(entry.privacyReviewed&&entry.licenseVerified).toBe(true);const bytes=readFileSync(item.asset!);expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.imageSha256);expect(bytes.length).toBe(entry.bytes);expect('data:image/jpeg;base64,'.length+bytes.toString('base64').length).toBeLessThanOrEqual(350000);}
});
test('reduced fixtures contain no EXIF/XMP, IPTC or source comment segments',()=>{
 for(const c of evaluationCases){const bytes=readFileSync(c.asset!);expect(bytes.subarray(0,2)).toEqual(Buffer.from([255,216]));let i=2;while(i<bytes.length){expect(bytes[i]).toBe(255);const marker=bytes[i+1];i+=2;if(marker===0xda||marker===0xd9)break;expect([0xe1,0xed,0xfe]).not.toContain(marker);i+=bytes.readUInt16BE(i);}}
});
test('ages span 2–8, expected aliases exist and known sensitive toys cannot generate activities',()=>{
 expect(new Set(evaluationCases.map(c=>c.age))).toEqual(new Set([2,3,4,5,6,7,8]));
 for(const c of evaluationCases){expect(c.expectedLabels.length).toBeGreaterThan(0);expect(c.confirmedToys.length).toBeGreaterThan(0);if(/magnetic|lead|puzzle|small toy balls|historic|ride-on/.test(c.category))expect(c.generationAllowed).toBe(false);}
});

test('pilot and alternatives use only allowed cases and fit per-slot daily allowances',()=>{
 expect(evaluationPilotIds).toHaveLength(3);expect(new Set(evaluationPilotIds).size).toBe(3);
 expect(evaluationPilotIds.map(id=>evaluationCases.find(c=>c.id===id)!.age)).toEqual([2,4,8]);
 for(const id of [...evaluationPilotIds,...evaluationAlternativeIds])expect(evaluationCases.find(c=>c.id===id)?.generationAllowed).toBe(true);
 for(let slot=0;slot<3;slot++){const cases=evaluationCases.slice(slot*8,slot*8+8);expect(cases.length).toBeLessThanOrEqual(10);expect(cases.filter(c=>c.generationAllowed).length+evaluationAlternativeIds.filter(id=>cases.some(c=>c.id===id)).length).toBeLessThanOrEqual(10);}
});
