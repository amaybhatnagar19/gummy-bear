export function nextMonth(now: number): number {
  const date = new Date(now), day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay)); return date.getTime();
}
export function accountAccess(user: { paidFrom?: number; paidUntil?: number; bonusGranted?: boolean; bonusUsed?: boolean }, now: number) {
  if ((user.paidUntil ?? 0) > now) return 'paid' as const;
  if (user.paidFrom !== undefined) return 'payment' as const;
  return user.bonusGranted && !user.bonusUsed ? 'bonus' as const : 'payment' as const;
}
