export const EVALUATION_MODEL = 'gpt-6-luna';
export const EVALUATION_PRICE_VERSION = 'gpt-6-luna-standard-2026-10-14';
export const EVALUATION_MAX_MICROS = 10_000_000; // USD, one dollar = one million micros.
export const EVALUATION_RESERVE_MICROS = 10_000;
export const EVALUATION_INPUT_CAP = 16_384;
// Official Standard rates per million tokens, expressed as USD micros.
export const evaluationRates = { input: 100_000, cached: 10_000, cacheWrite: 125_000, output: 500_000 };
export function effectiveReservedMicros(ledger: {reservedMicros:number;providerCostMicros?:number;reconciledReservationMicros?:number} | null) {
  if (!ledger) return 0;
  return Math.max(ledger.reservedMicros, (ledger.providerCostMicros ?? 0) + Math.max(0, ledger.reservedMicros - (ledger.reconciledReservationMicros ?? 0)));
}
export function tokenCostMicros(input: number, cached: number, output: number) {
  if (![input, cached, output].every(n => Number.isSafeInteger(n) && n >= 0) || cached > input) throw new Error('Invalid numeric usage');
  return Math.ceil(((input - cached) * evaluationRates.input + cached * evaluationRates.cached + output * evaluationRates.output) / 1_000_000);
}
export function conservativeRequestMicros(input: number, output: number) {
  // Counted total input includes image tokens. Use the higher cache-write rate
  // and 10% regional headroom; never assume cache hits or visible-only output.
  return Math.ceil((input * evaluationRates.cacheWrite + output * evaluationRates.output) * 1.1 / 1_000_000);
}
