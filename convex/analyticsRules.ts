export function excludedEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return normalized === 'amay.bhatnagar@gmail.com' || /@example\.(com|org|net)$/.test(normalized) || /^(deploy-test-|paywall-test-|codex-test-|test[-+])/.test(normalized);
}
export function istDay(time: number): string { return new Date(time + 19800000).toISOString().slice(0, 10); }
export type Run = { time: number; visitorToken: string; email?: string; succeeded: boolean; completed: boolean };
export type Signup = { _creationTime: number; email?: string; paidFrom?: number; paidUntil?: number };
export type Payment = { email: string; paidFrom: number; paidUntil: number };
export function dailyReport(runs: Run[], users: Signup[], payments: Payment[], labels: {token: string; excluded: boolean}[], startedAt: number, asOf: number) {
  const excludedTokens = new Set(labels.filter(l => l.excluded).map(l => l.token));
  for (const run of runs) if (excludedEmail(run.email)) excludedTokens.add(run.visitorToken);
  const cleanRuns = runs.filter(r => r.time <= asOf && !excludedTokens.has(r.visitorToken) && !excludedEmail(r.email));
  const cleanUsers = users.filter(u => u._creationTime <= asOf && !excludedEmail(u.email));
  const allPayments = [...payments];
  for (const user of users) if (user.email && user.paidFrom !== undefined && user.paidUntil !== undefined && !allPayments.some(p => p.email === user.email && p.paidFrom === user.paidFrom)) allPayments.push({email:user.email,paidFrom:user.paidFrom,paidUntil:user.paidUntil});
  const firstDay = istDay(Math.min(startedAt, ...users.map(u => u._creationTime), ...allPayments.map(p => p.paidFrom)));
  const lastDay = istDay(asOf), daily = [];
  for (let date = firstDay; date <= lastDay; date = new Date(Date.parse(date + 'T00:00:00Z') + 86400000).toISOString().slice(0,10)) {
    const dayStart = Date.parse(date + 'T00:00:00+05:30');
    const partial = dayStart < startedAt && dayStart + 86400000 > startedAt;
    const tracked = dayStart + 86400000 > startedAt;
    const dayRuns = cleanRuns.filter(r => istDay(r.time) === date);
    daily.push({date,photo_coverage:!tracked ? 'not_recorded' : partial ? 'since_tracking_started' : 'full_day_to_report_time',unique_visitors:tracked ? new Set(dayRuns.map(r=>r.visitorToken)).size : null,photo_runs:tracked ? dayRuns.length : null,successful_photo_runs:tracked ? dayRuns.filter(r=>r.completed&&r.succeeded).length : null,failed_photo_runs:tracked ? dayRuns.filter(r=>r.completed&&!r.succeeded).length : null,pending_photo_runs:tracked ? dayRuns.filter(r=>!r.completed).length : null,signups:cleanUsers.filter(u=>istDay(u._creationTime)===date).length,paid_users:new Set(allPayments.filter(p=>p.paidFrom<=asOf&&istDay(p.paidFrom)===date&&!excludedEmail(p.email)).map(p=>p.email.trim().toLowerCase())).size});
  }
  return {timezone:'Asia/Kolkata',as_of:new Date(asOf).toISOString(),photo_tracking_started_at:new Date(startedAt).toISOString(),paid_users_definition:'Unique accounts with payment confirmed that day; old renewal history before tracking is unavailable',exclusions:{owner_email:'amay.bhatnagar@gmail.com',test_email_rules:['@example.com / @example.org / @example.net','deploy-test- / paywall-test- / codex-test- / test- / test+'],excluded_visitor_ids:excludedTokens.size},daily};
}
