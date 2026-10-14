import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
export type AccessScreen = 'tool' | 'signUp' | 'signIn' | 'payment';
export function AccessPanel({ screen, onScreen, canClaimBonus, allowSignup = true, isolatedTesting = false }: { screen: Exclude<AccessScreen, 'tool'>; onScreen: (s: AccessScreen) => void; canClaimBonus: boolean; allowSignup?: boolean; isolatedTesting?: boolean }) {
  const { signIn } = useAuthActions(), claim = useMutation(api.access.claimBonus);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [qrMissing, setQrMissing] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { await signIn('password', { email: String(form.get('email')).trim().toLowerCase(), password: String(form.get('password')), flow: screen === 'signUp' ? 'signUp' : 'signIn' }); }
    catch { setError(screen === 'signUp' ? 'We could not create your account. This email may already be registered; try logging in.' : 'That email or password did not work. Please check both and try again.'); }
    finally { setBusy(false); }
  }
  async function freeTurn() { setBusy(true); setError(''); try { await claim({}); onScreen('tool'); } catch { setError('Your last free turn is already claimed, or the connection failed. Please try again.'); } finally { setBusy(false); } }
  if(screen==='payment'&&isolatedTesting)return <section className="access-panel"><h1>Testing access is separate from payments</h1><p>Real payment collection is unavailable here. An invitation provides a limited testing allowance after the owner approves live AI. Existing paid records and entitlements are unchanged.</p><button onClick={()=>onScreen('tool')}>Back to my toys</button></section>;
  if(screen==='signUp'&&!allowSignup)return <section className="access-panel"><h1>{isolatedTesting?'Keep your ideas here for now':'New accounts are paused'}</h1><p>{isolatedTesting?'New testing accounts are paused until the personal-data retention and deletion policy is approved. Your current ideas stay in this tab.':'Use an existing account to log in. New registration is not available in this release.'}</p><button onClick={()=>onScreen('tool')}>Back to my toys</button><button onClick={()=>onScreen('signIn')}>Log in to an existing account</button></section>;
  return <section className="access-panel" aria-busy={busy}>
    {screen === 'payment' ? <><h1>A little more playtime</h1><p className="price">₹99 a month</p><p>Scan this UPI QR to pay. Add your signup email to the payment note so the owner can match your payment to your account.</p>
      {qrMissing ? <div className="qr-empty" role="status">The payment QR is not available yet. Please check back before paying.</div> : <img className="upi-qr" src="/payments/upi-qr.png" alt="Gummy Bear UPI payment QR code" onError={() => setQrMissing(true)}/>}
      <p>Access opens after the owner confirms your payment. No automatic charge or renewal.</p>
      {canClaimBonus && <button className="primary" disabled={busy} onClick={freeTurn}>{busy ? 'Opening your last free turn…' : 'Use free one last time'}</button>}
      <button disabled={busy} onClick={() => onScreen('tool')}>Back to my toys</button>
    </> : <><h1>{screen === 'signUp' ? 'Keep the play going' : 'Welcome back'}</h1><p>{screen === 'signUp' ? 'Create an account to continue after your two free turns.' : 'Log in with your email and password.'}</p>
      <form onSubmit={submit}><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required disabled={busy}/>
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={screen === 'signUp' ? 'new-password' : 'current-password'} minLength={screen === 'signUp' ? 8 : undefined} required disabled={busy}/>
      {screen === 'signUp' && <p className="support">Use at least 8 characters. No email verification needed.</p>}
      <button className="primary" disabled={busy}>{busy ? 'Please wait…' : screen === 'signUp' ? 'Sign up' : 'Log in'}</button></form>
      {(allowSignup||screen==='signUp')&&<button disabled={busy} onClick={() => {setError(''); onScreen(screen === 'signUp' ? 'signIn' : 'signUp');}}>{screen === 'signUp' ? 'Already have an account? Log in' : 'Create an account'}</button>}<button disabled={busy} onClick={() => onScreen('tool')}>Back to my toys</button>
    </>}
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
