import {lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
const path=location.pathname.replace(/\/$/,'')||'/';
if(path==='/app'||path.startsWith('/app/')){
 document.title='Gummy Bear · Find fresh play ideas';
 const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/index-CdxPm9Ml.css';document.head.appendChild(style);
 const script=document.createElement('script');script.type='module';script.src='/assets/index-ARx4V7n1.js';
 script.onerror=()=>{const root=document.getElementById('root')!;root.textContent='Gummy Bear could not open. Refresh this page to try again.';};
 document.body.appendChild(script);
}else{
 const Landing=lazy(()=>import('./features/landing/LandingPage'));
 createRoot(document.getElementById('root')!).render(path==='/'?<Suspense fallback={<p role="status">Opening Gummy Bear…</p>}><Landing/></Suspense>:<main><h1>Let’s get you back to Gummy Bear.</h1><a href="/">Visit the website</a> or <a href="/app">open the app</a>.</main>);
}
// No V1 client, provider, family flow or new worker is initialized in this release.
