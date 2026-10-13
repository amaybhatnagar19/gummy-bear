import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import appStylesUrl from './style.css?url';

const path = window.location.pathname.replace(/\/$/, '') || '/';
if (path === '/app') {
  // Keep legacy CSS separate from the landing. A blocked external font must
  // never prevent the application module from opening.
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = appStylesUrl;
  document.head.appendChild(stylesheet);
}
const Page = path === '/' ? lazy(() => import('./features/landing/LandingPage'))
  : path === '/app' ? lazy(() => import('./LegacyApp')) : null;
document.title = path === '/app' ? 'Gummy Bear · Find fresh play ideas' : 'Gummy Bear · More imagination. Same toys.';
createRoot(document.getElementById('root')!).render(Page
  ? <Suspense fallback={<p role="status">Opening Gummy Bear…</p>}><Page /></Suspense>
  : <main><h1>Let’s get you back to Gummy Bear.</h1><p><a href="/">Visit the website</a> or <a href="/app">open the app</a>.</p></main>);
