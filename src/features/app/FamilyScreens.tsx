import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { ActivityCard } from './ActivityCard';
import { AppButton, EmptyState, Notice } from './components';
import { errorMessage, type PlayFlow } from './usePlayFlow';
export type FamilyState = {
  ownerId?:Id<'users'>;
  policyOpen: boolean;
  children: Doc<'children'>[];
  toys: Doc<'toys'>[];
  activities: Doc<'activities'>[];
  attempts?:Doc<'attempts'>[];
  preferences: Doc<'preferences'> | null;
};
export function FamilyScreens({
  state,
  route,
  path,
  flow,
  go,
  selected,
  setSelected,
  reminders
}: {
  state: FamilyState;
  route: string;
  path: string;
  flow: PlayFlow;
  go: (path: string) => void;
  selected: Id<'children'>[];
  setSelected: (ids: Id<'children'>[]) => void;
  reminders: (Doc<'toys'> & {
    canDonate: boolean;
  })[];
}) {
  const saveChild = useMutation(api.family.saveChild),
    saveToy = useMutation(api.family.saveToy),
    savePreferences = useMutation(api.family.savePreferences),
    deleteChild = useMutation(api.family.deleteChild),
    deleteData = useMutation(api.family.deleteFamilyData),
    dismiss = useMutation(api.family.dismissReminder);
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [label, setLabel] = useState(''),
    [childAge, setChildAge] = useState(4),
    [dob, setDob] = useState(''),
    [interests, setInterests] = useState(''),
    [editingChild, setEditingChild] = useState<Id<'children'> | undefined>(),
    [name, setName] = useState(''),
    [duplicateConfirmed,setDuplicateConfirmed]=useState(false),
    [toyFilter,setToyFilter]=useState('all'),
    [activityFilter,setActivityFilter]=useState('all'),
    [search, setSearch] = useState(''),
    [confirmation, setConfirmation] = useState('');
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(success);
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const toyId = path.match(/^\/app\/toys\/([^/]+)$/)?.[1],
    activityId = path.match(/^\/app\/activities\/([^/]+)$/)?.[1];
  const toy = state.toys.find(t => t._id === toyId),
    entry = state.activities.find(a => a._id === activityId);
  function useToy(t: Doc<'toys'>) {
    flow.setToys([t.name]);
    flow.setToyIds([t._id]);
    flow.setPhoto('');
    go('/app/age');
  }
  const familyPicker = <fieldset><legend>Who’s playing?</legend>{state.children.length ? state.children.map(child => <label className="ga-check" key={child._id}><input type="checkbox" checked={selected.includes(child._id)} onChange={e => setSelected(e.target.checked ? [...selected, child._id] : selected.filter(id => id !== child._id))} />{child.label} · {child.age} years</label>) : <p>You can use an age without adding a child profile.</p>}{selected.length > 1 && <p>Play Together uses the youngest child’s age for safety.</p>}</fieldset>;
  return <>{message && <Notice title="A little update">{message}</Notice>}{!state.policyOpen && <Notice title="Family saving is paused">The retention and deletion policy needs approval before real family information can be saved. You can still explore the screens and keep temporary ideas in this tab.</Notice>}
 {route === 'home' && <><h1>Ready for a little playtime?</h1><p>Start with the toys you already have.</p>{familyPicker}<a className="ga-link-button" href="/app">Find a Play Idea</a>{sessionStorage.getItem('gummy-guest-capability')&&<AppButton secondary disabled={!state.policyOpen} onClick={()=>void flow.link()}>Link temporary ideas from this tab</AppButton>}<div className="ga-shortcuts"><a href="/app/toys">My Toys</a><a href="/app/activities">Activities</a></div>{state.activities.length ? <><h2>Recent activities</h2>{state.activities.slice(0, 2).map(a => <ActivityCard key={a._id} activity={a.activity} age={a.age} id={a._id} saved={a.saved} favorite={a.favorite} onNotice={setMessage} onDetails={() => go(`/app/activities/${a._id}`)} />)}</> : <EmptyState title="Your next idea starts with a toy">Choose a toy photo. Once saving is enabled, your suggestions will be kept here.</EmptyState>}{reminders.length > 0 && <><h2>Want to revisit a familiar toy?</h2>{reminders.map(t => <section className="ga-card" key={t._id}><h3>{t.name}</h3><p>This is a chance to rediscover a toy, not a claim about how often it’s used at home.</p><AppButton onClick={() => go(`/app/toys/${t._id}`)}>Explore options</AppButton><AppButton secondary onClick={() => void run(() => dismiss({
            id: t._id
          }), 'Reminder dismissed.')}>Not now</AppButton></section>)}</>}</>}
 {route === 'toys' && (toyId ? toy ? <ToyEditor key={toy._id} toy={toy} children={state.children} disabled={!state.policyOpen || busy} onSave={patch => void run(() => saveToy({
      ...patch,
      id: toy._id,
      duplicateConfirmed: true
    }), 'Toy updated.')} onPlay={() => useToy(toy)} /> : <><h1>Toy unavailable</h1><p>This toy may have been removed or belongs to another account.</p><a href="/app/toys">Back to My Toys</a></> : <><h1>My Toys</h1><p>Add toys as you go. Shared toys can belong to several children.</p><a className="ga-link-button" href="/app">Add from a photo</a><form className="ga-card" onSubmit={e => {
        e.preventDefault();
        void run(async () => {
          await saveToy({
            name,
            status: 'in_use',
            outgrown: false,
            damaged: false,
            unsafe: false,
            children: selected
          });
          setName('');setDuplicateConfirmed(false);
        }, 'Toy added.');
      }}><label>Toy name<input value={name} maxLength={119} required onChange={e => {setName(e.target.value);setDuplicateConfirmed(false);}} /></label><label className="ga-check"><input type="checkbox" checked={duplicateConfirmed} onChange={e=>setDuplicateConfirmed(e.target.checked)}/>Keep this as a separate toy if the name is already in My Toys.</label><AppButton disabled={!state.policyOpen} busy={busy}>Add a toy by name</AppButton></form>{familyPicker}<label>Search toys<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Toy status<select value={toyFilter} onChange={e => setToyFilter(e.target.value)}>{['all', 'in_use', 'stored', 'donated', 'removed'].map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label>{state.toys.filter(t => (toyFilter === 'all' ? t.status !== 'removed' : t.status === toyFilter) && t.name.toLowerCase().includes(search.toLowerCase()) && (!selected.length || !t.children.length || t.children.some(id => selected.includes(id)))).map(t => <a className="ga-card ga-toy" key={t._id} href={`/app/toys/${t._id}`}><h2>{t.name}</h2><p>{t.status.replace('_', ' ')}{t.outgrown ? ' · Outgrown' : ''}</p><p>{t.children.length ? state.children.filter(c => t.children.includes(c._id)).map(c => c.label).join(', ') : 'Shared family toy'}</p></a>)}{state.toys.length>0&&!state.toys.some(t=>(toyFilter==='all'?t.status!=='removed':t.status===toyFilter)&&t.name.toLowerCase().includes(search.toLowerCase())&&(!selected.length||!t.children.length||t.children.some(id=>selected.includes(id))))&&<EmptyState title="No toys match these choices">Try a different search, status or child selection.</EmptyState>}{!state.toys.length && <EmptyState title="Your toy collection starts here">Add a toy whenever you’re ready.</EmptyState>}<a href="/app/rediscover">Rediscover familiar toys</a></>)}
 {route === 'activities' && (activityId ? entry ? <><h1>{entry.activity.title}</h1><ActivityCard activity={entry.activity} age={entry.age} id={entry._id} saved={entry.saved} favorite={entry.favorite} intended={entry.intended} tried={!!entry.triedAt} rating={entry.feedback} detail onNotice={setMessage} /><AppButton onClick={()=>{const ids=selected.length?selected:entry.children;setSelected(ids);const ages=state.children.filter(c=>ids.includes(c._id)).map(c=>c.age);flow.useSaved(entry.activity,entry._id,entry.toyIds??[],ages.length?Math.min(...ages):entry.age);}}>Try something different</AppButton><section className="ga-card"><h2>Your reported attempts</h2><p>These dates record when you told us, rather than an automatic record of offline play.</p>{(state.attempts??[]).filter(a=>a.activityId===entry._id).map(a=><p key={a._id}>Reported {new Date(a.at).toLocaleString()}{a.feedback?` · ${a.feedback.replaceAll('_',' ')}`:''}</p>)}</section><a href="/app/activities">Back to Activities</a></> : <><h1>Activity unavailable</h1><a href="/app/activities">Back to Activities</a></> : <><h1>Activities</h1><p>Saving and viewing aren’t evidence that your child tried an idea.</p>{familyPicker}<label>Show activities<select value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>{['all', 'saved', 'favorite', 'intended', 'tried'].map(f => <option key={f} value={f}>{f === 'tried' ? 'Parent reports tried' : f}</option>)}</select></label>{state.activities.filter(a=>(!selected.length||!a.children.length||a.children.some(id=>selected.includes(id)))).filter(a => activityFilter === 'all' || (activityFilter === 'tried' ? !!a.triedAt : !!a[activityFilter as 'saved' | 'favorite' | 'intended'])).map(a => <ActivityCard key={a._id} activity={a.activity} age={a.age} id={a._id} saved={a.saved} favorite={a.favorite} onNotice={setMessage} onDetails={() => go(`/app/activities/${a._id}`)} />)}{state.activities.length>0&&!state.activities.some(a=>(!selected.length||!a.children.length||a.children.some(id=>selected.includes(id)))&&(activityFilter==='all'||(activityFilter==='tried'?!!a.triedAt:!!a[activityFilter as 'saved'|'favorite'|'intended'])))&&<EmptyState title="No ideas match these choices">Choose another filter or find a new idea.</EmptyState>}{!state.activities.length && <EmptyState title="No saved ideas yet" action={<a className="ga-link-button" href="/app">Find an idea</a>}>When saving is enabled, suggestions, favorites and parent-reported attempts will appear here.</EmptyState>}</>)}
 {route === 'rediscover' && <><h1>Rediscover familiar toys</h1><p>A fresh look at toys in your collection. We don’t know how often toys are played with offline.</p>{reminders.length ? reminders.map(t => <section className="ga-card" key={t._id}><h2>{t.name}</h2><p>{t.acquiredAt ? 'You supplied its acquisition date.' : 'Acquisition date unknown. You decide whether now is a good time to revisit it.'}</p><AppButton disabled={t.unsafe || t.damaged} onClick={() => useToy(t)}>Reuse at Home</AppButton>{t.canDonate ? <details><summary>Explore Donation</summary><p>Check that the toy is intact, clean, safe, complete and accepted by your chosen local organization. Consider siblings and sentimental value first. Keep recalled, unsafe or damaged toys out of donations. Nothing changes ownership until you explicitly update its status.</p><a href={`/app/toys/${t._id}`}>Review condition and status</a></details> : <p>Donation guidance is unavailable because this toy is marked unsafe or damaged.</p>}<AppButton secondary onClick={() => void run(() => dismiss({
          id: t._id
        }), 'Reminder dismissed.')}>Not now</AppButton></section>) : <EmptyState title="Nothing to rediscover yet">Known newly acquired toys are excluded for two months. Donated and removed toys are excluded.</EmptyState>}</>}
 {route === 'profile' && <><h1>Profile</h1><section className="ga-card"><h2>Children</h2>{state.children.map(c => <div key={c._id}><p>{c.label} · {c.age} years · {c.interests.join(', ')}</p><AppButton secondary onClick={() => {
            setEditingChild(c._id);
            setLabel(c.label);
            setChildAge(c.age);
            setDob(c.dob ?? '');
            setInterests(c.interests.join(', '));
          }}>Edit {c.label}</AppButton><details><summary>Remove {c.label}</summary><p>This removes the profile and its toy/activity assignments. It does not remove the toys or activity records.</p><AppButton disabled={!state.policyOpen} busy={busy} onClick={() => void run(() => deleteChild({
              id: c._id
            }), 'Child profile removed.')}>Confirm removal</AppButton></details></div>)}<form onSubmit={e => {
          e.preventDefault();
          void run(async () => {
            await saveChild({
              id: editingChild,
              label,
              age: childAge,
              dob: dob || undefined,
              interests: interests.split(',').map(i => i.trim()).filter(Boolean)
            });
            setLabel('');
            setDob('');
            setInterests('');
            setEditingChild(undefined);
          }, 'Child profile saved.');
        }}><label>Child nickname<input required maxLength={40} value={label} onChange={e => setLabel(e.target.value)} /></label><label>Child age<select value={childAge} onChange={e => setChildAge(Number(e.target.value))}>{[2, 3, 4, 5, 6, 7, 8].map(a => <option key={a} value={a}>{a} years</option>)}</select></label><label>Birth date (optional)<input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={e => setDob(e.target.value)} /></label><label>Interests (optional, separated by commas)<input value={interests} onChange={e => setInterests(e.target.value)} /></label><p>Age is enough; a birth date is optional. Personal-data saving remains gated by the approved retention policy.</p><AppButton disabled={!state.policyOpen} busy={busy}>{editingChild ? 'Save child changes' : 'Add child'}</AppButton></form></section><section className="ga-card"><h2>Reminders</h2><label>In-app reminder frequency<select disabled={!state.policyOpen || busy} value={state.preferences?.reminders ?? 'off'} onChange={e => void run(() => savePreferences({
            reminders: e.target.value as 'off' | 'weekly' | 'monthly',
            emailOptIn: false
          }), 'Reminder preference saved.')}><option value="off">Off</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><p>Email reminders are not enabled. Email delivery and consent wording need approval before opt-in is available.</p><a href="/app/rediscover">Rediscover toys manually</a></section><section className="ga-card"><h2>Privacy and data</h2><p>Gummy Bear doesn’t save original toy photos to your account. AI processing has separate provider retention rules that must be reviewed before testing. Your selected image stays in this tab until you remove it or leave; AI processing needs a connection. Family records are only enabled after the retention policy is approved.</p><AppButton secondary onClick={() => {
          void flow.clearTemporary().then(setMessage);
        }}>Clear temporary photo and ideas</AppButton><details><summary>Delete family information</summary><p>This deletes child profiles, inventory, suggestions, saved ideas, feedback, attempts and preferences for this account. Authentication, payment and historical access records are preserved. Full account deletion requires an approved retention policy and is not available yet.</p><label>Type DELETE FAMILY DATA<input value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label><AppButton disabled={!state.policyOpen || confirmation !== 'DELETE FAMILY DATA'} busy={busy} onClick={() => void run(async () => {
            await deleteData({
              confirmation: 'DELETE FAMILY DATA'
            });
            flow.reset();
            setSelected([]);
            setConfirmation('');
          }, 'Family information deleted. Your account and billing records remain.')}>Delete family information</AppButton></details></section><ContactSettings key={`${state.preferences?.phone ?? ''}-${state.preferences?.phoneConsent ?? false}-${state.preferences?.futureWhatsAppOptIn ?? false}`} preferences={state.preferences} policyOpen={state.policyOpen} onNotice={setMessage} /><section className="ga-card"><h2>Your account</h2><p>Existing password accounts and paid entitlements are preserved. Google and email-code sign-in await provider configuration.</p><a href="/app/payment">View existing payment options</a></section></>}
 </>;
}
type ToyPatch = {
  name: string;
  status: 'in_use' | 'stored' | 'donated' | 'removed';
  outgrown: boolean;
  damaged: boolean;
  unsafe: boolean;
  children: Id<'children'>[];
  acquiredAt?: number;
};
function ToyEditor({
  toy,
  children,
  disabled,
  onSave,
  onPlay
}: {
  toy: Doc<'toys'>;
  children: Doc<'children'>[];
  disabled: boolean;
  onSave: (patch: ToyPatch) => void;
  onPlay: () => void;
}) {
  const [name, setName] = useState(toy.name),
    [status, setStatus] = useState(toy.status),
    [outgrown, setOutgrown] = useState(toy.outgrown),
    [damaged, setDamaged] = useState(toy.damaged),
    [unsafe, setUnsafe] = useState(toy.unsafe),
    [assigned, setAssigned] = useState(toy.children),
    [date, setDate] = useState(toy.acquiredAt ? new Date(toy.acquiredAt).toISOString().slice(0, 10) : '');
  return <><h1>{toy.name}</h1><p>Added to My Toys {new Date(toy._creationTime).toLocaleDateString()}.{toy.uploadedAt?` Photo analyzed ${new Date(toy.uploadedAt).toLocaleDateString()}.`:''} Acquisition date and reported attempts are separate.</p><form className="ga-card" onSubmit={e => {
      e.preventDefault();
      onSave({
        name,
        status,
        outgrown,
        damaged,
        unsafe,
        children: assigned,
        acquiredAt: date ? Date.parse(date) : undefined
      });
    }}><label>Toy name<input required maxLength={119} value={name} onChange={e => setName(e.target.value)} /></label><label>Ownership status<select value={status} onChange={e => setStatus(e.target.value as typeof status)}>{['in_use', 'stored', 'donated', 'removed'].map(s => <option value={s} key={s}>{s.replace('_', ' ')}</option>)}</select></label><p>Status changes only when you press Confirm toy changes. You can reverse them later.</p>{[['Outgrown', outgrown, setOutgrown], ['Damaged', damaged, setDamaged], ['Unsafe or recalled', unsafe, setUnsafe]].map(([label, value, set]) => <label className="ga-check" key={String(label)}><input type="checkbox" checked={value as boolean} onChange={e => (set as (b: boolean) => void)(e.target.checked)} />{String(label)}</label>)}<fieldset><legend>Child assignments</legend>{children.map(c => <label className="ga-check" key={c._id}><input type="checkbox" checked={assigned.includes(c._id)} onChange={e => setAssigned(e.target.checked ? [...assigned, c._id] : assigned.filter(id => id !== c._id))} />{c.label}</label>)}<p>No assignment means a shared family toy.</p></fieldset><label>Acquired on (optional)<input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)} /></label><AppButton disabled={disabled}>Confirm toy changes</AppButton></form><AppButton disabled={toy.damaged || toy.unsafe || ['donated', 'removed'].includes(toy.status)} onClick={onPlay}>Find play ideas</AppButton><a href="/app/toys">Back to My Toys</a></>;
}
function ContactSettings({
  preferences,
  policyOpen,
  onNotice
}: {
  preferences: Doc<'preferences'> | null;
  policyOpen: boolean;
  onNotice: (text: string) => void;
}) {
  const save = useMutation(api.family.saveContact);
  const [phone, setPhone] = useState(preferences?.phone ?? ''),
    [consent, setConsent] = useState(preferences?.phoneConsent ?? false),
    [future, setFuture] = useState(preferences?.futureWhatsAppOptIn ?? false),
    [busy, setBusy] = useState(false);
  return <section className="ga-card"><h2>Optional contact preferences</h2><p>No phone number is required. No WhatsApp messages are sent. Future messaging consent is separate from email reminders and can be withdrawn.</p><form onSubmit={async e => {
      e.preventDefault();
      setBusy(true);
      try {
        await save({
          phone: phone.trim() || undefined,
          phoneConsent: phone ? consent : false,
          futureWhatsAppOptIn: phone ? future : false
        });
        onNotice('Optional contact preferences saved.');
      } catch (e) {
        onNotice(errorMessage(e));
      } finally {
        setBusy(false);
      }
    }}><label>Phone number (optional)<input type="tel" value={phone} autoComplete="tel" placeholder="+ country code and number" onChange={e => setPhone(e.target.value)} /></label><label className="ga-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I agree to store this optional phone number.</label><label className="ga-check"><input type="checkbox" checked={future} onChange={e => setFuture(e.target.checked)} />I’d like to opt in separately to future WhatsApp updates, if offered.</label><AppButton disabled={!policyOpen} busy={busy}>Save contact preferences</AppButton></form></section>;
}
