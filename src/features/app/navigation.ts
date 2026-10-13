export const destinations = [
  { path: '/app/home', label: 'Home' },
  { path: '/app/toys', label: 'My Toys' },
  { path: '/app/activities', label: 'Activities' },
  { path: '/app/profile', label: 'Profile' },
] as const;
export type AppRoute = 'start' | 'home' | 'toys' | 'activities' | 'profile' | 'sign-in' | 'sign-up' | 'payment' | 'missing';
export function appRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/app' || path === '/app/start') return 'start';
  const route = path.slice('/app/'.length);
  return path.startsWith('/app/') && ['home', 'toys', 'activities', 'profile', 'sign-in', 'sign-up', 'payment'].includes(route)
    ? route as AppRoute : 'missing';
}
// Internal app navigation only; reject external URLs and accidental public routes.
export function isAppPath(href: string): boolean {
  return href === '/app' || (href.startsWith('/app/') && appRoute(href) !== 'missing');
}

export function mayConnectToBackend(url: string | undefined, development: boolean): boolean {
  if (!url) return false;
  try { if (new URL(url).protocol !== 'https:') return false; } catch { return false; }
  return !development || url === 'https://d1-isolated.invalid';
}
