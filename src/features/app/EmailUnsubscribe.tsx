import {useState} from 'react';
import {useMutation} from 'convex/react';
import {api} from '../../../convex/_generated/api';
import {AppButton,Notice} from './components';
export function EmailUnsubscribe(){
 const [token]=useState(()=>{const value=new URLSearchParams(location.hash.slice(1)).get('token')??'';history.replaceState(null,'',location.pathname);return value;});
 const unsubscribe=useMutation(api.privacy.unsubscribeEmail);
 const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');
 async function confirm(){setBusy(true);setError('');try{await unsubscribe({token});setDone(true);}catch{setError('This step did not complete. Check your connection and try again.');}finally{setBusy(false);}}
 return <><h1>Turn off email reminders</h1><p>Email delivery remains disabled. This page prepares the unsubscribe flow for a future approved service.</p>
 {done ? <Notice title="Email preferences updated">If this link was valid, email reminders are now off. Your toys and in-app reminder preference are unchanged.</Notice> : <><p>Confirm below to turn off reminders for this link. Opening the page alone does not change your preferences.</p><AppButton busy={busy} disabled={!/^[a-f0-9]{64}$/.test(token)} onClick={()=>void confirm()}>Turn off email reminders</AppButton>{!token&&<p>This link has no reminder proof. Use Profile to review your preferences.</p>}</>}
 {error&&<Notice title="Please try again" error>{error}</Notice>}<a href="/app">Back to Gummy Bear</a></>;
}
