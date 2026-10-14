import { Notice } from './components';
import { destinations, type AppRoute, appRoute } from './navigation';
export function ReleaseUnavailable({route,signed,access}:{route:AppRoute;signed:boolean;access?:{state:string;paidUntil?:number|null}}){
 if(route==='missing')return <><h1>Let’s get you back to Gummy Bear</h1><p>This app page isn’t available.</p><a href="/app">Open the app</a> · <a href="/">Visit the website</a></>;
 const family=['home','toys','activities','profile','rediscover'].includes(route);
 const title=family?(destinations.find(d=>appRoute(d.path)===route)?.label??'Rediscover toys'):'New play ideas are paused';
 return <><h1>{title}</h1><Notice title="Not available in this release">Photo recognition and new AI activities are paused. Toy inventory, activity history and child profiles aren’t open yet. You don’t need to upload a photo or enter child details.</Notice>
 {route==='profile'&&signed&&<section className="ga-card"><h2>Your existing account</h2><p>Your sign-in and recorded access are unchanged.</p>{access?.state==='paid'&&<p>Paid access is recorded{access.paidUntil?` until ${new Date(access.paidUntil).toLocaleDateString()}`:''}. New AI ideas remain paused.</p>}<p>Account-deletion controls aren’t available in this release. Contact the owner for account questions.</p></section>}
 {!signed&&<p><a className="ga-link-button" href="/app/sign-in">Log in to an existing account</a></p>}
 <p className="ga-release-links"><a href="/">Visit the website</a>{signed&&route!=='home'&&<a href="/app/home">Back to Home</a>}</p></>;
}
