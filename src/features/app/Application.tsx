import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ConvexReactClient, useConvexAuth, useQuery } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import { LegacyTool } from '../../LegacyApp';
import { AccessPanel, type AccessScreen } from '../../AccessPanel';
import { getVisitorToken } from '../../visitor';
import { destinations, appRoute, isAppPath, mayConnectToBackend } from './navigation';
import { AppErrorBoundary, AppButton, EmptyState, Notice } from './components';
import '../../styles/tokens.css';
import './app.css';

function AppShell() {
  const [path, setPath] = useState(location.pathname);
  const route = appRoute(path);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [visitorToken] = useState(getVisitorToken);
  const access = useQuery(api.access.status, isLoading ? 'skip' : { visitorToken });
  const [online, setOnline] = useState(navigator.onLine);
  const [accountError, setAccountError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const previousRoute = useRef(route);
  const wasAuthenticated = useRef(false);
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const page = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  function go(href: string) {
    if (!isAppPath(href) || href === location.pathname) return;
    history.pushState(null, '', href); setPath(location.pathname);
  }
  function follow(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest('a');
    const href = anchor?.getAttribute('href');
    if (href && isAppPath(href) && !anchor?.hasAttribute('download') && (!anchor?.target || anchor.target === '_self')) {
      event.preventDefault(); go(href);
    }
  }
  useEffect(() => {
    const back = () => setPath(location.pathname);
    const connection = () => setOnline(navigator.onLine);
    addEventListener('popstate', back); addEventListener('online', connection); addEventListener('offline', connection);
    return () => { removeEventListener('popstate', back); removeEventListener('online', connection); removeEventListener('offline', connection); };
  }, []);
  useEffect(() => {
    const title = destinations.find(d => appRoute(d.path) === route)?.label || 'Find fresh play ideas';
    document.title = `Gummy Bear · ${title}`;
    if (previousRoute.current !== route) {
      const heading = page.current?.querySelector<HTMLElement>(route === 'start' ? '#photo-title' : '.ga-content h1');
      if (heading) { heading.tabIndex = -1; heading.focus(); }
      scrollTo({ top: 0, behavior: 'instant' });
    }
    previousRoute.current = route;
  }, [route]);
  useEffect(() => {
    if (isAuthenticated && (route === 'sign-in' || route === 'sign-up')) {
      history.replaceState(null, '', '/app/home'); setPath('/app/home');
    }
  }, [isAuthenticated, route]);
  useEffect(() => {
    if (isLoading) return;
    if (wasAuthenticated.current && !isAuthenticated) setSessionEpoch(epoch => epoch + 1);
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);
  useEffect(() => {
    const nav = navigation.current;
    if (!nav) return;
    const resize = new ResizeObserver(() => page.current?.style.setProperty('--ga-nav-height', `${nav.getBoundingClientRect().height}px`));
    resize.observe(nav);
    return () => resize.disconnect();
  }, [isAuthenticated]);
  const screen: Exclude<AccessScreen, 'tool'> | null = route === 'sign-in' ? 'signIn' : route === 'sign-up' ? 'signUp' : route === 'payment' ? 'payment' : null;
  const accessRoute = (screen: AccessScreen) => go(screen === 'tool' ? '/app' : screen === 'signIn' ? '/app/sign-in' : screen === 'signUp' ? '/app/sign-up' : '/app/payment');
  async function logout() {
    setSigningOut(true); setAccountError('');
    try { await signOut(); go('/app'); } catch { setAccountError('We couldn’t sign you out. Please try again.'); }
    finally { setSigningOut(false); }
  }
  return <div className={`ga-app${isAuthenticated ? ' ga-has-nav' : ''}`} onClick={follow} ref={page}>
    <a className="ga-skip" href={route === 'start' ? '#photo-title' : '#app-content'}>Skip to app content</a>
    {!online && <Notice title="You’re offline">You’ll need a connection to find new ideas or save changes. Keep your current page open.</Notice>}
    {accountError && <Notice title="Let’s try that again" error>{accountError}</Notice>}
    {route !== 'start' && <header className="ga-header"><a className="ga-brand" href="/" aria-label="Gummy Bear"><img src="/brand/gummy-bear-mark.svg" width="32" height="32" alt=""/>Gummy Bear</a>{isAuthenticated ? <AppButton secondary busy={signingOut} onClick={logout}>Log out</AppButton> : <a className="ga-link-button" href="/app/sign-in">Log in</a>}</header>}
    {/* Keep the working tool mounted across app routes so photo/results survive Back.
        This is a compatibility bridge, removed only after the new flow is verified. */}
    <div hidden={route !== 'start'}><LegacyTool key={sessionEpoch}/></div>
    {route !== 'start' && <main id="app-content" className="ga-content" tabIndex={-1}>
      {screen ? <AccessPanel screen={screen} onScreen={accessRoute} canClaimBonus={access?.canClaimBonus ?? false}/> : route === 'missing' ? <><h1>Let’s get you back to your toys</h1><p>This app page isn’t available.</p><a className="ga-link-button" href="/app">Find a play idea</a></> : isLoading ? <><h1>Opening your account</h1><Notice title="Please wait">Checking your session.</Notice></> : !isAuthenticated ? <><h1>{destinations.find(d => appRoute(d.path) === route)?.label}</h1><EmptyState title="Keep your ideas for next time" action={<a className="ga-link-button" href="/app/sign-in">Log in</a>}>You can try a play idea before creating an account.</EmptyState><a href="/app">Continue with a toy photo</a></> : <>
        {route === 'home' && <><h1>Ready for a little playtime?</h1><p>Start with the toys you already have.</p><a className="ga-link-button" href="/app">Find a Play Idea</a><div className="ga-shortcuts"><a href="/app/toys">My Toys</a><a href="/app/activities">Activities</a></div><EmptyState title="Your next idea starts with a toy">Choose a photo to use the current play tool. Saved toys and activity history aren’t available yet.</EmptyState></>}
        {route === 'toys' && <><h1>My Toys</h1><EmptyState title="Your toy collection starts here" action={<a className="ga-link-button" href="/app">Find an idea from a photo</a>}>Saved toy collections aren’t available yet. You can still use a toy photo to find ideas.</EmptyState></>}
        {route === 'activities' && <><h1>Activities</h1><EmptyState title="Keep your current ideas close" action={<a className="ga-link-button" href="/app">Return to your play ideas</a>}>Your current photo and ideas stay in this open app while you move between these pages. Saved activity history isn’t available yet. Refreshing clears this temporary work.</EmptyState></>}
        {route === 'profile' && <><h1>Profile</h1><section className="ga-card"><h2>Your account</h2><p>Child profiles, reminder preferences and privacy controls are coming next.</p><p>The current tool sends your selected photo for AI analysis. It does not save toy photographs or child profiles.</p>{access && <p>Access: {access.state === 'paid' ? 'Current paid access' : access.state === 'bonus' ? 'One-time bonus available' : 'See your existing access options'}</p>}<a href="/app/payment">View existing payment options</a></section></>}
      </>}
    </main>}
    {isAuthenticated && <nav ref={navigation} className="ga-nav" aria-label="Parent navigation">{destinations.map(d => <a key={d.path} href={d.path} aria-current={appRoute(d.path) === route ? 'page' : undefined}>{d.label}</a>)}</nav>}
  </div>;
}

export default function Application() {
  const url = import.meta.env.VITE_CONVEX_URL;
  // The original development URL is not evidence of a separate project.
  // Local UI verification uses this dummy address and network-intercepted tests.
  const isolated = mayConnectToBackend(url, import.meta.env.DEV);
  const [client] = useState(() => url && isolated ? new ConvexReactClient(url) : null);
  if (!client) return <div className="ga-app"><main className="ga-content"><h1>Local testing needs an isolated connection</h1><p>This build has not connected to a backend. Use the isolated browser-test setup while the separate development project is prepared.</p><a href="/">Visit the website</a></main></div>;
  return <AppErrorBoundary><ConvexAuthProvider client={client}><AppShell/></ConvexAuthProvider></AppErrorBoundary>;
}
