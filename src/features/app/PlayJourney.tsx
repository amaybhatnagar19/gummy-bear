import { useRef, useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { errorMessage } from './usePlayFlow';
import type { Doc } from '../../../convex/_generated/dataModel';
import type { Id } from '../../../convex/_generated/dataModel';
import { AppButton, Notice } from './components';
import { ActivityCard } from './ActivityCard';
import type { PlayFlow } from './usePlayFlow';
export function PlayJourney({
  flow,
  step,
  go,
  signed,
  policyOpen,
  children,
  entries = [],
  liveAIReady
}: {
  flow: PlayFlow;
  step: string;
  go: (path: string) => void;
  signed: boolean;
  policyOpen: boolean;
  children: Id<'children'>[];
  entries?: Doc<'activities'>[];
  liveAIReady?: boolean;
}) {
  const saveToy = useMutation(api.family.saveToy);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  useEffect(()=>setDuplicateConfirmed(false),[flow.photo]);
  async function addToys() {
    const added: string[] = [];
    try {
      for (const name of flow.toys) {
        await saveToy({
          name: name.trim(),uploadedAt:flow.photoUploadedAt,
          status: 'in_use',
          outgrown: false,
          damaged: false,
          unsafe: false,
          children,
          duplicateConfirmed
        });
        added.push(name);
      }
      flow.setNotice('Confirmed toys added to My Toys.');
    } catch (e) {
      flow.setNotice((added.length ? `Added ${added.join(', ')}. ` : '') + errorMessage(e));
    }
  }
  const camera = useRef<HTMLInputElement>(null),
    picker = useRef<HTMLInputElement>(null);
  const select = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void flow.select(file);
  };
  const title = step === 'recognize' ? 'Is this the right toy?' : step === 'age' ? 'How old is your child?' : step === 'ideas' ? 'Here are some ideas to try.' : 'Let’s see those toys';
  return <><h1 id="photo-title" tabIndex={-1}>{title}</h1>{liveAIReady===false&&<Notice title="Live AI is paused in testing">Your photo stays in this tab. The owner needs to approve the privacy policy and testing budget before AI processing can begin.</Notice>}{flow.error && <Notice title="We couldn’t load new ideas" error>{flow.error} {flow.activities.length?'Your previous ideas are still here.':flow.photo?'Your photo and details are still here.':'Choose another photo and try again.'}</Notice>}{flow.notice && <Notice title="A little update">{flow.notice}</Notice>}
 {flow.busy && <Notice title={flow.busy === 'ideas' ? 'Thinking of ways to play…' : flow.busy === 'recognition' ? 'Looking at your toys…' : 'Preparing your photo…'}>This may take a moment. <AppButton secondary onClick={flow.cancel}>Stop waiting</AppButton></Notice>}
 {step === 'start' && <><p>One photo. A fresh way to play with toys you already own.</p><section className="ga-upload">{flow.photo ? <img src={flow.photo} alt="Your selected toy photo" /> : <><img src="/images/gummy-bear-character.webp" alt="" width="100" height="115" /><p>Just the toys. No faces needed.</p></>}<input ref={camera} type="file" hidden accept="image/*" capture="environment" aria-label="Take one toy photo" onChange={select} /><input ref={picker} type="file" hidden accept="image/*" aria-label="Choose one toy photo" onChange={select} /><div className="ga-actions"><AppButton secondary busy={!!flow.busy} onClick={() => camera.current?.click()}>Take a photo</AppButton><AppButton secondary busy={!!flow.busy} onClick={() => picker.current?.click()}>{flow.photo ? 'Change photo' : 'Choose one photo'}</AppButton>{flow.photo && <AppButton secondary onClick={() => {
            flow.cancel();
            flow.setPhoto('');
            flow.setToys([]);
          }}>Remove photo</AppButton>}</div></section><AppButton secondary onClick={()=>void flow.clearTemporary().then(flow.setNotice)}>Clear temporary work</AppButton><p>You select one photo; we don’t request your whole gallery. Photos are reduced on your device, sent for AI analysis only when you continue, and aren’t stored in the toy inventory. AI needs an internet connection.</p><details><summary>Invited testing access</summary><p>Live AI stays paused until the owner approves its budget. Use your invitation only in this testing app.</p><label>Testing invitation<input type="password" autoComplete="off" value={flow.invitation} maxLength={64} onChange={e => flow.setInvitation(e.target.value.trim())} /></label></details><AppButton busy={!!flow.busy} disabled={liveAIReady!==true||!flow.photo || !navigator.onLine} onClick={() => void flow.recognizePhoto()}>Recognize toys</AppButton></>}
 {step === 'recognize' && (flow.photo ? <><img className="ga-thumbnail" src={flow.photo} alt="Your selected toy photo" /><p>These names are guesses. Correct or remove anything that looks wrong. A photo can’t confirm that a toy is safe.</p>{flow.toys.map((toy, i) => <div className="ga-recognition" key={i}><label>Toy {i + 1}<input value={toy} maxLength={119} onChange={e => flow.setToys(flow.toys.map((t, j) => i === j ? e.target.value : t))} /></label><AppButton secondary onClick={() => flow.setToys(flow.toys.filter((_, j) => j !== i))}>Remove toy {i + 1}</AppButton></div>)}<div className="ga-actions"><AppButton secondary disabled={flow.toys.length >= 12} onClick={() => flow.setToys([...flow.toys, ''])}>Add a toy name</AppButton><AppButton disabled={!flow.toys.length || flow.toys.some(t => !t.trim())} onClick={() => go('/app/age')}>Confirm toys</AppButton><a href="/app">Try another photo</a></div>{signed && <section className="ga-card"><h2>Keep these toys</h2><label className="ga-check"><input type="checkbox" checked={duplicateConfirmed} onChange={e => setDuplicateConfirmed(e.target.checked)} />These are separate toys, even if a name is already in My Toys.</label><AppButton disabled={!policyOpen || flow.toys.some(t => !t.trim()) || !flow.toys.length} onClick={() => void addToys()}>Add confirmed toys to My Toys</AppButton></section>}</> : <Notice title="Let’s start with a photo">This temporary photo wasn’t retained after refresh. <a href="/app">Choose a toy photo</a>.</Notice>)}
 {step === 'age' && (flow.toys.length ? <><p>We use their age to make ideas more relevant. For Play Together, use the youngest child’s age.</p><label htmlFor="age">How old is your child?</label><select id="age" value={flow.age} disabled={!!flow.busy || children.length > 0} onChange={e => flow.setAge(Number(e.target.value))}><option value={0} disabled>Choose an age</option>{[2, 3, 4, 5, 6, 7, 8].map(n => <option value={n} key={n}>{n} years old</option>)}</select><p>{flow.toys.join(', ')}</p><AppButton busy={!!flow.busy} disabled={liveAIReady!==true||!navigator.onLine||flow.age<2||flow.age>8} onClick={() => void flow.ideas(children, signed, policyOpen)}>Find play ideas</AppButton><a href={flow.photo ? '/app/recognize' : '/app/toys'}>Back to toy details</a></> : <Notice title="Let’s choose a toy first"><a href="/app">Add a toy photo</a>.</Notice>)}
 {step === 'ideas' && (flow.activities.length ? <><p>Choose what fits your day. Ideas suggested for age {flow.resultAge}. Showing {flow.activities.length} useful {flow.activities.length === 1 ? 'idea' : 'ideas'}.</p>{flow.activities.map((activity, i) => <ActivityCard key={i} activity={activity} id={flow.ids[i]} age={flow.resultAge} saved={entries.find(e => e._id === flow.ids[i])?.saved} favorite={entries.find(e => e._id === flow.ids[i])?.favorite} onNotice={flow.setNotice} onDetails={() => go(`/app/idea/${i}`)} />)}<AppButton busy={!!flow.busy} disabled={liveAIReady!==true||!navigator.onLine||flow.age<2||flow.age>8} onClick={() => void flow.ideas(children, signed, policyOpen)}>Try something different</AppButton>{!signed && <section className="ga-card"><h2>Want to keep these ideas?</h2><p>Your current ideas stay in this tab. Signing up is optional.</p><div className="ga-actions"><a className="ga-link-button" href="/app/sign-up">Save my ideas</a><AppButton secondary onClick={() => flow.setNotice('Keep enjoying these ideas. No account is needed to read them.')}>Not now</AppButton></div></section>}</> : <Notice title="Your next idea starts with a toy"><a href="/app">Choose a photo</a>. Temporary results aren’t retained after refresh.</Notice>)}
 </>;
}
