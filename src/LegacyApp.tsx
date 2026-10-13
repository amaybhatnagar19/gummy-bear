import React, { useEffect, useRef, useState } from 'react';
import { ConvexReactClient, useAction, useQuery, useMutation, useConvexAuth } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import { ConvexError } from 'convex/values';
import { api } from '../convex/_generated/api';
import { shrinkPhoto } from './photo';
import { AccessPanel, type AccessScreen } from './AccessPanel';
import { getVisitorToken } from './visitor';
import { presentActivities, type PresentedResult } from './activityPresentation';
function Icon({ kind }: { kind: 'camera' | 'photo' }) { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{kind === 'camera' ? <><path d="M8 5l2-2h4l2 2h4v15H4V5z"/><circle cx="12" cy="12" r="4"/></> : <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="M3 17l6-6 4 4 3-3 5 5"/></>}</svg>; }
export function LegacyTool() {
  const discover = useAction(api.play.discover);
  const [visitorToken] = useState(getVisitorToken);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const identifyVisitor = useMutation(api.analytics.identifyVisitor);
  useEffect(() => { if (isAuthenticated) void identifyVisitor({visitorToken}).catch(() => {}); }, [isAuthenticated, identifyVisitor, visitorToken]);
  const access = useQuery(api.access.status, isLoading ? 'skip' : { visitorToken });
  const [screen, setScreen] = useState<AccessScreen>('tool');
  useEffect(() => {
    if (isAuthenticated && access && (screen === 'signUp' || screen === 'signIn')) setScreen(access.state === 'paid' || access.state === 'bonus' ? 'tool' : 'payment');
    if (access?.state === 'paid' && screen === 'payment') setScreen('tool');
  }, [isAuthenticated, access, screen]);
  useEffect(() => {
    if (!access?.paidUntil) return;
    let timer: ReturnType<typeof setTimeout>;
    const checkExpiry = () => {
      const remaining = access.paidUntil! - Date.now();
      if (remaining <= 0) setScreen('payment');
      else timer = setTimeout(checkExpiry, Math.min(2147483647, remaining));
    };
    checkExpiry();
    return () => clearTimeout(timer);
  }, [access?.paidUntil]);
  const camera = useRef<HTMLInputElement>(null), picker = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState(''), [age, setAge] = useState(4), [busy, setBusy] = useState<'photo' | 'ideas' | null>(null), [error, setError] = useState(''), [result, setResult] = useState<PresentedResult | null>(null);
  async function select(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files; const file = files?.[0]; event.target.value = ''; if (!file) return;
    if (files && files.length > 1) { setError('Please choose just one photo.'); return; }
    setBusy('photo'); setError(''); setResult(null); setPhoto('');
    try { setPhoto(await shrinkPhoto(file)); } catch(e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  async function generate() {
    if (!access) return;
    if (!isAuthenticated && access.state === 'signup') { setScreen('signUp'); return; }
    if (isAuthenticated && (access.state === 'payment' || (access.paidUntil !== null && access.paidUntil <= Date.now()))) { setScreen('payment'); return; }
    setBusy('ideas'); setError('');
    try { setResult(presentActivities(await discover({ image: photo, age, visitorToken, responseVersion: 2 }))); }
    catch(e) { const message = e instanceof ConvexError ? String(e.data) : 'We could not connect. Check your internet and try again.'; if (message === 'SIGNUP_REQUIRED') setScreen('signUp'); else if (message === 'PAYMENT_REQUIRED') setScreen('payment'); else setError(message); }
    finally { setBusy(null); }
  }
  return <main><header><a href="/" className="brand"><span className="brand-mark" aria-hidden="true">g</span>Gummy Bear</a><div className="account-controls">{isAuthenticated ? <>{access?.state !== 'paid' && <button onClick={() => setScreen('payment')}>Payment</button>}<button onClick={async () => { await signOut(); setScreen('tool'); }}>Log out</button></> : <button disabled={isLoading} onClick={() => setScreen('signIn')}>Log in</button>}</div></header>
    {screen !== 'tool' ? <AccessPanel key={screen} screen={screen} onScreen={setScreen} canClaimBonus={access?.canClaimBonus ?? false}/> : <>
    <section className="intro"><h1>Their next favorite toy<br/>is already at home.</h1><p>One photo. Up to three fresh ways to play.<br/>Made for your toys and your child’s age.</p></section>
    <div className="workspace"><section className="photo-panel" aria-labelledby="photo-title"><h2 id="photo-title">Let’s see those toys</h2><p className="support">Place a few toys together in good light.</p>
      <div className={'photo-area ' + (photo ? 'has-photo' : '')}>{photo ? <img src={photo} alt="Your selected toy photo"/> : <div><Icon kind="photo"/><p>{busy === 'photo' ? 'Preparing your photo…' : 'A new adventure starts with one photo'}</p><span>{busy === 'photo' ? 'Making it smaller before sending' : 'Just the toys. No faces needed.'}</span></div>}</div>
      <input ref={camera} type="file" accept="image/*" capture="environment" onChange={select} hidden aria-label="Take one toy photo"/><input ref={picker} type="file" accept="image/*" onChange={select} hidden aria-label="Choose one toy photo"/>
      <div className="photo-buttons"><button type="button" disabled={!!busy} onClick={() => camera.current?.click()}><Icon kind="camera"/>Take a photo</button><button type="button" disabled={!!busy} onClick={() => picker.current?.click()}><Icon kind="photo"/>{photo ? 'Change photo' : 'Choose one photo'}</button></div>
      <p className="privacy">You choose one photo. We never ask for gallery access.<br/>Your photo is sent to AI for this reply; we don’t save a toy history.</p>
      <label className="age-label" htmlFor="age">How old is your child?</label><select id="age" value={age} disabled={!!busy} onChange={e => { setAge(Number(e.target.value)); setResult(null); setError(''); }}>{[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} years old</option>)}</select>
      <button className="primary" disabled={!photo || !!busy || !access} onClick={generate}>{busy === 'ideas' ? 'Finding fresh play ideas…' : result?.ideas.length ? 'Find more ideas' : 'Find play ideas'}</button>
      {error && <div className="error" role="alert"><strong>Let’s try that again</strong><p>{error}</p>{photo && <button onClick={generate} disabled={!!busy}>Try again</button>}</div>}
    </section>
    <section className="ideas-panel" aria-labelledby="ideas-title" aria-live="polite" aria-busy={busy === 'ideas'}><h2 id="ideas-title">A little inspiration, just for you</h2>
      {busy === 'ideas' && !result?.ideas.length ? <div className="waiting"><span className="spinner"/><h3>Looking for possibilities…</h3><p>Spotting your toys and finding useful ways to play for age {age}.</p></div> : result?.ideas.length ? <div className="results"><div className="toy-list"><h3>Here’s what I see</h3><ul>{result.toys.map((toy, i) => <li key={i}>{toy}</li>)}</ul><p>If a toy looks wrong, try a closer photo.</p></div><div className="idea-list">{result.ideas.map((idea, i) => <article key={i} className={'idea idea-' + idea.categoryIndex}><span className="category">{idea.categoryLabel}</span><h3>{idea.title}</h3><p>{idea.instructions}</p></article>)}</div><p className="gentle-note">Stay close and use toys that are safe for your child’s age.</p></div> : result ? <div className="waiting"><h3>Let’s try a different photo</h3><p>{result.limitation}</p><button onClick={() => picker.current?.click()}>Choose another photo</button></div> : <div className="waiting"><span className="play-shapes" aria-hidden="true"><i/><i/><i/></span><h3>Old toys. New possibilities.</h3><p>{error ? 'Your ideas will appear here after you try again.' : 'Add a toy photo and choose an age. Your toy names and up to three play ideas will appear here together.'}</p><div className="empty-categories"><span>Quick play</span><span>Creative adventure</span><span>Play together</span></div></div>}
    </section></div></>}<footer>Less toy shopping. More little moments together.</footer></main>;
}
const url = import.meta.env.VITE_CONVEX_URL;
export default function LegacyApplication() { return url ? <ConvexAuthProvider client={new ConvexReactClient(url)}><LegacyTool/></ConvexAuthProvider> : <main><h1>Gummy Bear needs a connection</h1><p>Set CONVEX_URL in .env.local, then restart the page.</p></main>; }
