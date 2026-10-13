import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ConvexReactClient, useConvexAuth, useQuery } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import { AuthChoices } from './AuthChoices';
import { InstallGuide } from './InstallGuide';
import { usePlayFlow } from './usePlayFlow';
import { PlayJourney } from './PlayJourney';
import { FamilyScreens, type FamilyState } from './FamilyScreens';
import { ActivityCard } from './ActivityCard';
import type { Id } from '../../../convex/_generated/dataModel';
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
  const [selected, setSelected] = useState<Id<'children'>[]>([]);
  const capabilities=useQuery(api.v1Capabilities.status,{});
  const state = useQuery(api.family.state, isAuthenticated ? {} : 'skip') as FamilyState | undefined;
  const reminders = useQuery(api.family.reminders, isAuthenticated ? {manual:route==='rediscover'} : 'skip') ?? [];
  const page = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  function go(href: string) {
    if (!isAppPath(href) || href === location.pathname) return;
    history.pushState(null, '', href); setPath(location.pathname);
  }
  const flow = usePlayFlow(go);
  useEffect(() => { if (sessionEpoch) {flow.reset();setSelected([]);} }, [sessionEpoch]);
  useEffect(() => { if(state && selected.length) {const chosen=state.children.filter(c=>selected.includes(c._id)); if(chosen.length) flow.setAge(Math.min(...chosen.map(c=>c.age)));} }, [state,selected]);
  useEffect(()=>{if(isAuthenticated&&capabilities?.personalData&&sessionStorage.getItem('gummy-link-requested')==='yes')void flow.link();},[isAuthenticated,capabilities?.personalData]);
  function follow(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest('a');
    const href = anchor?.getAttribute('href');
    if (href && isAppPath(href) && !anchor?.hasAttribute('download') && (!anchor?.target || anchor.target === '_self')) {
      if((href==='/app/sign-up'||href==='/app/sign-in')&&flow.activities.length)sessionStorage.setItem('gummy-link-requested','yes');
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
      const heading = page.current?.querySelector<HTMLElement>('.ga-content h1');
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
    {<header className="ga-header"><a className="ga-brand" href="/" aria-label="Gummy Bear"><img src="/brand/gummy-bear-mark.svg" width="32" height="32" alt=""/>Gummy Bear</a>{isAuthenticated ? <div className="ga-actions">{access?.state!=='paid'&&<AppButton secondary onClick={()=>go('/app/payment')}>Payment</AppButton>}<AppButton secondary busy={signingOut} onClick={logout}>Log out</AppButton></div> : <AppButton secondary onClick={()=>go('/app/sign-in')}>Log in</AppButton>}</header>}
    <main id="app-content" className="ga-content" tabIndex={-1}>
      {screen ? <>{screen!=='payment'&&<AuthChoices/>}<AccessPanel screen={screen} onScreen={accessRoute} canClaimBonus={access?.canClaimBonus ?? false}/></> : ['start','recognize','age','ideas'].includes(route) ? <PlayJourney flow={flow} step={route} go={go} signed={isAuthenticated} policyOpen={capabilities?.personalData??false} children={selected} entries={state?.activities}/> : route==='idea' ? flow.activities[Number(path.split('/').pop())] ? <><h1>{flow.activities[Number(path.split('/').pop())].title}</h1><ActivityCard activity={flow.activities[Number(path.split('/').pop())]} id={flow.ids[Number(path.split('/').pop())]} saved={state?.activities.find(e=>e._id===flow.ids[Number(path.split('/').pop())])?.saved} favorite={state?.activities.find(e=>e._id===flow.ids[Number(path.split('/').pop())])?.favorite} intended={state?.activities.find(e=>e._id===flow.ids[Number(path.split('/').pop())])?.intended} tried={!!state?.activities.find(e=>e._id===flow.ids[Number(path.split('/').pop())])?.triedAt} rating={state?.activities.find(e=>e._id===flow.ids[Number(path.split('/').pop())])?.feedback} detail onNotice={flow.setNotice}/>{flow.notice&&<Notice title="A little update">{flow.notice}</Notice>}<a href="/app/ideas">Back to ideas</a></> : <><h1>This temporary idea isn’t here</h1><a href="/app">Find a new play idea</a></> : route === 'missing' ? <><h1>Let’s get you back to your toys</h1><p>This app page isn’t available.</p><a className="ga-link-button" href="/app">Find a play idea</a></> : isLoading ? <><h1>Opening your account</h1><Notice title="Please wait">Checking your session.</Notice></> : !isAuthenticated ? <><h1>{destinations.find(d => appRoute(d.path) === route)?.label??'Rediscover toys'}</h1><EmptyState title="Keep your ideas for next time" action={<a className="ga-link-button" href="/app/sign-in">Log in</a>}>You can try a play idea before creating an account.</EmptyState><a href="/app">Continue with a toy photo</a></> : !state ? <><h1>Opening your family space</h1><Notice title="Please wait">Loading your toys and ideas.</Notice></> : <FamilyScreens state={state} route={route} path={path} flow={flow} go={go} selected={selected} setSelected={setSelected} reminders={reminders}/>}
    <InstallGuide/>
    </main>
    {isAuthenticated && <nav ref={navigation} className="ga-nav" aria-label="Parent navigation">{destinations.map(d => <a key={d.path} href={d.path} aria-current={appRoute(d.path) === route ? 'page' : undefined}>{d.label}</a>)}</nav>}
  </div>;
}

export default function Application() {
  const url = import.meta.env.VITE_CONVEX_URL;
  // Development allows only the verified separate testing project or the
  // dummy address used by network-intercepted browser tests.
  const isolated = mayConnectToBackend(url, import.meta.env.DEV);
  const [client] = useState(() => url && isolated ? new ConvexReactClient(url) : null);
  if (!client) return <div className="ga-app"><main className="ga-content"><h1>Local testing needs an isolated connection</h1><p>This build has not connected to a backend. Use the isolated browser-test setup while the separate development project is prepared.</p><a href="/">Visit the website</a></main></div>;
  return <AppErrorBoundary><ConvexAuthProvider client={client}><AppShell/></ConvexAuthProvider></AppErrorBoundary>;
}
