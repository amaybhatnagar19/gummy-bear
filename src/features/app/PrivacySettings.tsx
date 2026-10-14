import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PRIVACY_VERSION, privacyCopy } from '../../../shared/privacy';
import { AppButton, Notice } from './components';
import { errorMessage, type PlayFlow } from './usePlayFlow';
export function PrivacySettings({ flow, onDeleted }: { flow: PlayFlow; onDeleted: () => void }) {
  const status = useQuery(api.privacy.status, {});
  const identity = useQuery(api.privacy.identityReadiness, status?.isolatedTesting ? {} : 'skip');
  const withdraw = useMutation(api.privacy.withdrawAcknowledgment);
  const accept = useMutation(api.privacy.acknowledge), family = useMutation(api.privacy.deleteFamily), account = useMutation(api.privacy.requestAccountDeletion), resume = useMutation(api.privacy.resumeDeletion);
  const [acknowledged, setAcknowledged] = useState(false), [confirmation, setConfirmation] = useState(''), [accountConfirmation, setAccountConfirmation] = useState(''), [understood, setUnderstood] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function run(action: () => Promise<unknown>) {
    setBusy(true); setMessage('');
    try { await action(); } catch (e) { setMessage('This step did not complete. ' + errorMessage(e)); } finally { setBusy(false); }
  }
  async function remove(scope: 'family' | 'account', retry = false) {
    // Clear tab data even when the server request cannot finish.
    const warning = await flow.clearTemporary(); onDeleted();
    const result = retry ? await resume({ scope }) : scope === 'account' ? await account({ confirmation: 'DELETE ACCOUNT' }) : await family({ confirmation: 'DELETE FAMILY DATA' });
    setConfirmation(''); setAccountConfirmation(''); setUnderstood(false);
    setMessage(result.status === 'deleting_family' ? 'Family removal is still in progress. Account deletion is not complete. You can check its status and retry here.' : result.status === 'awaiting_policy' ? 'Family information removed. Account deletion is pending: identity, sessions and billing/access records remain until the remaining policy decisions are approved.' : 'Family information deleted. Your account and billing records remain.');
    if (warning.includes('could not')) setMessage(text => `${text} ${warning}`);
  }
  const deletion = status?.accountDeletion ?? status?.familyDeletion;
  return <section className="ga-card"><h2>Privacy and data</h2>
    {message && <Notice title="Privacy update">{message}</Notice>}
    <p>{privacyCopy.photos}</p><p>{privacyCopy.children}</p><p>{privacyCopy.family}</p>
    <details><summary>Third-party processing and retention</summary><p>{privacyCopy.provider}</p><p>Operational logs, analytics, backups and required financial retention are separate policy decisions. These are not erased by clearing this tab or by deleting family information.</p></details>
    <details><summary>Account deletion readiness</summary><p>Identity removal is not enabled. Financial exceptions, operational records and backups still need approved policies.</p>{identity ? <p>{identity.truncated ? 'At least ' : ''}{identity.accounts} sign-in methods and {identity.sessions} sessions remain. Their codes and refresh tokens must be removed in the reviewed deletion sequence. These counts do not mean deletion has completed.</p> : <p>Readiness counts are available only in isolated testing.</p>}</details>
    <p>{privacyCopy.paused}</p><p>Privacy information version: {PRIVACY_VERSION}. This acknowledgment is not a substitute for the owner’s legal-policy approval.</p>
    {status?.acknowledged ? <><p>You acknowledged this privacy version. Optional phone and future messaging choices remain separate.</p><AppButton secondary busy={busy} onClick={()=>void run(async()=>{await flow.clearTemporary();await withdraw({});setMessage('Privacy acknowledgment withdrawn. New AI processing and family saving are paused. Existing family records remain until you delete them. Email reminders are off.');})}>Withdraw privacy acknowledgment</AppButton></> : <><label className="ga-check"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />I have read the privacy information about family saving and deletion.</label><AppButton secondary disabled={!status?.collectionEnabled || !acknowledged || !!status?.accountDeletion} busy={busy} onClick={() => void run(async () => { await accept({ version: PRIVACY_VERSION, accepted: true }); setMessage('Privacy information acknowledged. Optional contact choices remain separate.'); })}>Acknowledge privacy information</AppButton></>}
    <AppButton secondary onClick={() => void run(async () => setMessage(await flow.clearTemporary()))}>Clear temporary photo and ideas</AppButton>
    {deletion && <Notice title={deletion.status === 'deleting_family' ? 'Removal in progress' : deletion.status === 'awaiting_policy' ? 'Account deletion pending' : 'Family information removed'}>{deletion.status === 'awaiting_policy' ? privacyCopy.deletion : deletion.status === 'deleting_family' ? 'Some records may still remain. No completion has been confirmed. If the background step fails or stops, retry it below.' : 'Authentication, payment and historical access records are preserved.'} {deletion.status === 'deleting_family' && <AppButton secondary busy={busy} onClick={() => void run(() => remove(status?.accountDeletion ? 'account' : 'family', true))}>Retry removal</AppButton>}</Notice>}
    <details><summary>Delete family information</summary><p>This removes this account’s child profiles, toy inventory, activities, feedback, attempts, contact preferences, consent choices and linked guest drafts. Authentication, payment and historical access records are preserved.</p><label>Type DELETE FAMILY DATA<input autoComplete="off" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label><AppButton disabled={!status?.isolatedTesting || confirmation !== 'DELETE FAMILY DATA' || !!status?.accountDeletion} busy={busy} onClick={() => void run(() => remove('family'))}>Delete family information</AppButton></details>
    <details><summary>Request account deletion</summary><p>{privacyCopy.deletion}</p><p>Family removal cannot be undone. This does not cancel or refund payments, and does not yet remove the sign-in identity or sessions. We will not say your account is deleted while those steps remain.</p><label>Type DELETE ACCOUNT<input autoComplete="off" value={accountConfirmation} onChange={e => setAccountConfirmation(e.target.value)} /></label><label className="ga-check"><input type="checkbox" checked={understood} onChange={e => setUnderstood(e.target.checked)} />I understand family removal is permanent and account deletion will remain pending.</label><AppButton disabled={!status?.isolatedTesting || accountConfirmation !== 'DELETE ACCOUNT' || !understood || !!status?.accountDeletion} busy={busy} onClick={() => void run(() => remove('account'))}>Request account deletion</AppButton></details>
  </section>;
}
