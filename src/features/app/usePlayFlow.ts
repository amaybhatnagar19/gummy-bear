import { useAction,useMutation } from 'convex/react';
import { useState,useRef } from 'react';
import { ConvexError } from 'convex/values';
import { api } from '../../../convex/_generated/api';
import type { Activity } from '../../../shared/activityContract';
import type { Id } from '../../../convex/_generated/dataModel';
import { shrinkPhoto } from '../../photo';
import { getVisitorToken } from '../../visitor';
export function errorMessage(error:unknown) { return error instanceof ConvexError ? String(error.data) : error instanceof Error ? error.message : 'We couldn’t connect. Your previous ideas are still here. Try again.'; }
export function usePlayFlow(go:(path:string)=>void) {
 const [invitation,setInvitation]=useState(()=>sessionStorage.getItem('gummy-testing-invitation')??'');
 const recognize=useAction(api.recognition.recognize),generate=useAction(api.v1Ideas.generate),record=useMutation(api.family.recordSuggestions),retain=useMutation(api.guest.retain),claim=useMutation(api.guest.claim);
 const [toyIds,setToyIds]=useState<Id<'toys'>[]>([]);
 const [photo,setPhoto]=useState(''),[toys,setToys]=useState<string[]>([]),[age,setAge]=useState(4),[activities,setActivities]=useState<Activity[]>([]),[ids,setIds]=useState<Id<'activities'>[]>([]),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const previous=useRef<Activity[]>([]),sequence=useRef(0);const [capability]=useState(()=>sessionStorage.getItem('gummy-guest-capability')??Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''));
 async function select(file:File){const seq=++sequence.current;setBusy('photo');setError('');try{const image=await shrinkPhoto(file);if(seq!==sequence.current)return;setPhoto(image);setToyIds([]);setToys([]);go('/app');}catch(e){if(seq===sequence.current)setError(errorMessage(e));}finally{if(seq===sequence.current)setBusy('');}}
 async function recognizePhoto(){if(!photo)return;const seq=++sequence.current;setBusy('recognition');setError('');try{const names=await recognize({image:photo,invitation:invitation||undefined});if(seq!==sequence.current)return;setToys(names);go('/app/recognize');if(!names.length)setNotice('We couldn’t identify a toy. You can tell us what it is or choose a clearer photo.');}catch(e){if(seq===sequence.current)setError(errorMessage(e));}finally{if(seq===sequence.current)setBusy('');}}
 async function ideas(children:Id<'children'>[],signed:boolean,policyOpen:boolean){const seq=++sequence.current;setBusy('ideas');setError('');setNotice('');try{const result=await generate({invitation:invitation||undefined,image:photo,age,confirmedToys:toys.map(x=>x.trim()).filter(Boolean),visitorToken:getVisitorToken(),previous:previous.current.slice(-100),children,toyIds});if(seq!==sequence.current)return;if(!result.activities.length){setNotice(result.limitation??'Try a different toy or adjust the details.');return;}setActivities(result.activities);previous.current=[...previous.current,...result.activities].slice(-100);setIds([]);go('/app/ideas');if(policyOpen){try{if(signed){const recorded=await record({activities:result.activities,age,children,toyIds});if(recorded.length===result.activities.length)setIds(recorded);else setNotice('Your ideas are ready. Repeated suggestions were not stored again.');}else {await retain({capability,activities:result.activities,age});sessionStorage.setItem('gummy-guest-capability',capability);}}catch(e){setNotice('Your ideas are ready, but weren’t saved. '+errorMessage(e));}}}catch(e){if(seq===sequence.current)setError(errorMessage(e));}finally{if(seq===sequence.current)setBusy('');}}
 function cancel(){++sequence.current;setBusy('');setNotice('You’ve stopped waiting. The server may finish the request; your existing ideas are unchanged.');}
 async function link(){try{const count=await claim({capability});sessionStorage.removeItem('gummy-guest-capability');sessionStorage.removeItem('gummy-link-requested');setNotice(count?'Your guest ideas are now linked to this account.':'These ideas have already been linked.');}catch(e){setError(errorMessage(e));}}
 function reset(){sessionStorage.removeItem('gummy-guest-capability');sessionStorage.removeItem('gummy-link-requested');++sequence.current;setPhoto('');setToyIds([]);setToys([]);setActivities([]);setIds([]);previous.current=[];setError('');setNotice('');setBusy('');}
 return {invitation,setInvitation,toyIds,setToyIds,photo,setPhoto,toys,setToys,age,setAge,activities,ids,busy,error,setError,notice,setNotice,select,recognizePhoto,ideas,cancel,link,reset};
}
export type PlayFlow=ReturnType<typeof usePlayFlow>;
