import { useAction, useMutation } from 'convex/react';
import { useState, useRef, useEffect } from 'react';
import { ConvexError } from 'convex/values';
import { api } from '../../../convex/_generated/api';
import type { Activity } from '../../../shared/activityContract';
import type { Id } from '../../../convex/_generated/dataModel';
import { shrinkPhoto } from '../../photo';
import { PRIVACY_VERSION } from '../../../shared/privacy';
import { getVisitorToken } from '../../visitor';
export function errorMessage(error: unknown) {
  if(error instanceof ConvexError&&String(error.data)==='SIGNUP_REQUIRED')return 'You’ve used your two guest turns. Your previous ideas are still here. Sign in to keep them when account creation is enabled.';
  if(error instanceof ConvexError&&String(error.data)==='PAYMENT_REQUIRED')return 'Your previous ideas are still here. Review your existing access options before requesting another idea.';
  const photoErrors=new Set(['Pick a photo, such as a JPEG or PNG.','This photo is too large. Choose one under 25 MB.','This photo could not be opened. Try a JPEG or PNG photo.','Your browser could not prepare the photo.','This photo is too detailed. Try a closer photo with fewer toys.']);
  return error instanceof ConvexError ? String(error.data) : error instanceof Error && photoErrors.has(error.message) ? error.message : 'We couldn’t complete this request. Check your connection and try again.';
}
export function usePlayFlow(go: (path: string) => void) {
  const [invitation, setInvitation] = useState(() => sessionStorage.getItem('gummy-testing-invitation') ?? '');
  const recognize = useAction(api.recognition.recognize),
    generate = useAction(api.v1Ideas.generate),
    record = useMutation(api.family.recordSuggestions),
    retain = useMutation(api.guest.retain),
    claim = useMutation(api.guest.claim), discard=useMutation(api.guest.discard);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [temporaryConsent, setTemporaryConsent] = useState(false);
  const [resultAge,setResultAge]=useState<number|undefined>();
  const [photoUploadedAt,setPhotoUploadedAt]=useState<number|undefined>();
  const [toyIds, setToyIds] = useState<Id<'toys'>[]>([]);
  const [photo, setPhoto] = useState(''),
    [toys, setToys] = useState<string[]>([]),
    [age, setAge] = useState(0),
    [activities, setActivities] = useState<Activity[]>([]),
    [ids, setIds] = useState<Id<'activities'>[]>([]),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const previous = useRef<Activity[]>([]),
    sequence = useRef(0);
  const [capability,setCapability] = useState(() => sessionStorage.getItem('gummy-guest-capability') ?? Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''));
  useEffect(() => {
    const leave = () => setPhoto('');
    addEventListener('pagehide', leave);
    return () => removeEventListener('pagehide', leave);
  }, []);
  function confirmToys() { setPhoto(''); go('/app/age'); }
  async function select(file: File) {
    const seq = ++sequence.current;
    setPhoto(''); setPhotoConsent(false);
    setBusy('photo');
    setError('');
    try {
      const image = await shrinkPhoto(file);
      if (seq !== sequence.current) return;
      setPhoto(image);setPhotoUploadedAt(undefined);
      setToyIds([]);
      setToys([]);
      go('/app');
    } catch (e) {
      if (seq === sequence.current) setError(errorMessage(e));
    } finally {
      if (seq === sequence.current) setBusy('');
    }
  }
  async function recognizePhoto() {
    if (!photo || !photoConsent) { setError('Review the separate AI photo-processing information before continuing.'); return; }
    const seq = ++sequence.current;
    setBusy('recognition');
    setError('');
    try {
      const names = await recognize({
        image: photo,
        invitation: invitation || undefined
      });
      if (seq !== sequence.current) return;
      setToys(names.toys);setPhotoUploadedAt(names.recognizedAt);
      go('/app/recognize');
      if (!names.toys.length) setNotice('We couldn’t identify a toy. You can tell us what it is or choose a clearer photo.');
    } catch (e) {
      if (seq === sequence.current) setError(errorMessage(e));
    } finally {
      if (seq === sequence.current) setBusy('');
    }
  }
  async function ideas(children: Id<'children'>[], signed: boolean, policyOpen: boolean) {
    if(age<2||age>8){setError('Gummy Bear supports ages 2–8. Choose another child or update the age before requesting ideas.');return;}
    const seq = ++sequence.current;
    setPhoto('');
    setBusy('ideas');
    setError('');
    setNotice('');
    try {
      const result = await generate({
        invitation: invitation || undefined,
        // Confirmed toy names are sufficient; do not resend the photo.
        image: '',
        age,
        confirmedToys: toys.map(x => x.trim()).filter(Boolean),
        visitorToken: getVisitorToken(),
        previous: previous.current.slice(-100),
        children,
        toyIds
      });
      if (seq !== sequence.current) return;
      if (!result.activities.length) {
        setNotice(result.limitation ?? 'Try a different toy or adjust the details.');
        return;
      }
      setActivities(result.activities);setResultAge(age);
      previous.current = [...previous.current, ...result.activities].slice(-100);
      setIds(result.activityIds??[]);
      go('/app/ideas');
      if (policyOpen) {
        try {
          if (signed && !result.activityIds) {
            const recorded = await record({
              activities: result.activities,
              age,
              children,
              toyIds
            });
            if (recorded.length === result.activities.length) setIds(recorded);else setNotice('Your ideas are ready. Repeated suggestions were not stored again.');
          } else if(!signed && temporaryConsent) {
            await retain({
              invitation,
              privacyVersion: PRIVACY_VERSION,
              capability,
              activities: result.activities,
              age
            });
            sessionStorage.setItem('gummy-guest-capability', capability);sessionStorage.setItem('gummy-testing-invitation',invitation);
          }
        } catch (e) {
          setNotice('Your ideas are ready, but weren’t saved. ' + errorMessage(e));
        }
      }
    } catch (e) {
      if (seq === sequence.current) setError(errorMessage(e));
    } finally {
      if (seq === sequence.current) setBusy('');
    }
  }
  function cancel() {
    ++sequence.current;
    setBusy('');
    setPhoto('');
    setNotice('You’ve stopped waiting. The temporary photo has been cleared. The server may finish the request; your existing ideas are unchanged.');
  }
  async function link() {
    try {
      const count = await claim({
        capability
      });
      sessionStorage.removeItem('gummy-guest-capability');
      sessionStorage.removeItem('gummy-link-requested');
      setNotice(count ? 'Your guest ideas are now linked to this account.' : 'These ideas have already been linked.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  function reset() {
    sessionStorage.removeItem('gummy-testing-invitation');setInvitation('');
    setCapability(Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''));
    sessionStorage.removeItem('gummy-guest-capability');
    sessionStorage.removeItem('gummy-link-requested');
    ++sequence.current;
    setPhoto('');
    setPhotoConsent(false);setTemporaryConsent(false);setPhotoUploadedAt(undefined);setAge(0);setResultAge(undefined);
    setToyIds([]);
    setToys([]);
    setActivities([]);
    setIds([]);
    previous.current = [];
    setError('');
    setNotice('');
    setBusy('');
  }
  function useSaved(activity:Activity,id:Id<'activities'>,toyIds:Id<'toys'>[],age:number){setActivities([activity]);setIds([id]);setResultAge(age);setToys(activity.toyReferences);setToyIds(toyIds);setPhoto('');setAge(age);setError('');setNotice('Your saved idea is unchanged. Choose the age for a different idea.');go('/app/age');}
  async function clearTemporary(){let warning='';if(sessionStorage.getItem('gummy-guest-capability'))try{await discard({capability});}catch{warning='The photo and ideas are cleared from this tab. The temporary server draft could not be deleted now and will expire after 24 hours.';}reset();return warning||'Temporary photo and guest ideas cleared.';}
  return {
    confirmToys, photoConsent, setPhotoConsent, temporaryConsent, setTemporaryConsent,
    useSaved,
    resultAge,
    photoUploadedAt,
    clearTemporary,
    invitation,
    setInvitation,
    toyIds,
    setToyIds,
    photo,
    setPhoto,
    toys,
    setToys,
    age,
    setAge,
    activities,
    ids,
    busy,
    error,
    setError,
    notice,
    setNotice,
    select,
    recognizePhoto,
    ideas,
    cancel,
    link,
    reset
  };
}
export type PlayFlow = ReturnType<typeof usePlayFlow>;
