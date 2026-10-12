export function getVisitorToken(): string {
  const key = 'gummy-bear-visitor';
  try { const saved = localStorage.getItem(key); if (saved && /^[a-f0-9-]{36}$/.test(saved)) return saved; } catch {}
  const token = crypto.randomUUID();
  try { localStorage.setItem(key, token); } catch {}
  return token;
}
