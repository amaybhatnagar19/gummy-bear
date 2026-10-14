import { productionTarget } from '../../shared/productionTarget.js';
import type { Page } from '@playwright/test';
import { testingBoundary } from '../../shared/testingDeployment.js';

export const testingBackendURL = process.env.GUMMY_TEST_BACKEND_URL || testingBoundary.convexUrl;
if (![testingBoundary.convexUrl, 'https://d1-isolated.invalid'].includes(testingBackendURL)) throw new Error('Browser tests refuse an unverified backend.');
export const testingStorageNamespace = testingBackendURL.replace(/[^a-zA-Z0-9]/g, '');
const expectedHost = new URL(testingBackendURL).hostname;

// Synthetic protocol replies only. This helper never connects to a remote server.
export async function isolate(page: Page, account: 'guest' | 'paid' | 'payment' = 'guest', flow = false, family?: {policyOpen:boolean;children:any[];toys:any[];activities:any[];preferences:any;attempts?:any[]}, failDeletionOnce = false, closedRelease = false, productionBuild = false, legacy = false) {
  const expectedHost=new URL(productionBuild?productionTarget.cloudUrl:testingBackendURL).hostname;
  const testingStorageNamespace=(productionBuild?productionTarget.cloudUrl:testingBackendURL).replace(/[^a-zA-Z0-9]/g,'');
  const calls: string[] = [];
  const privacy:any={version:'v1-privacy-2026-10-14',isolatedTesting:true,collectionEnabled:family?.policyOpen??false,acknowledged:!!family,consents:[],accountDeletion:null,familyDeletion:null};
  const token = `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: 'synthetic-d1-session', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url')}.synthetic`;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
    if(legacy && url.hostname==='fonts.googleapis.com')return route.fulfill({body:'',contentType:'text/css'});
    if (url.hostname !== expectedHost) {
      await route.abort();
      throw new Error('Unexpected outbound browser request blocked.');
    }
    // Serve synthetic refresh responses only; never connect to a backend.
    if (url.pathname === '/api/action' && account !== 'guest') {
      const body = route.request().postDataJSON();
      calls.push(body.path);
      if (body.path === 'auth:signIn') return route.fulfill({ json: { status: 'success', value: { tokens: { token, refreshToken: 'synthetic-d1-refresh' } } } });
    }
    await route.abort();throw new Error('Unexpected backend HTTP request blocked.');
  });
  if (account !== 'guest') {
    await page.addInitScript(({ token, namespace }) => {
      // Match the real provider's URL namespace, without reading a real token.
      const key = namespace;
      if (!sessionStorage.getItem('d1-seeded')) {
        localStorage.setItem(`__convexAuthJWT_${key}`, token);
        localStorage.setItem(`__convexAuthRefreshToken_${key}`, 'synthetic-d1-refresh');
        sessionStorage.setItem('d1-seeded', 'yes');
      }
    }, { token, namespace: testingStorageNamespace });
  }
  await page.routeWebSocket(/.*/, socket => {
    const url = new URL(socket.url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) { socket.connectToServer(); return; }
    if (url.hostname !== expectedHost) { socket.close(); throw new Error('Unapproved backend socket blocked.'); }
    // Exercise the unchanged real Convex/Auth client against a local simulation.
    const familyQueries=new Set<number>(),privacyQueries=new Set<number>();
    let version = { querySet: 0, identity: 0, ts: 'AAAAAAAAAAA=' };
    let clock = 0;
    const transition = (patch: Partial<typeof version>, modifications: unknown[] = []) => {
      const startVersion = { ...version };
      const bytes = Buffer.alloc(8); bytes.writeBigUInt64LE(BigInt(++clock));
      version = { ...version, ...patch, ts: bytes.toString('base64') };
      socket.send(JSON.stringify({ type: 'Transition', startVersion, endVersion: version, modifications }));
    };
    socket.onMessage(raw => {
      const message = JSON.parse(String(raw));
      if (message.type === 'Authenticate') transition({ identity: message.baseVersion + 1 });
      if (message.type === 'ModifyQuerySet') {
        transition({ querySet: message.newVersion }, message.modifications.map((mod: { type: string; queryId: number; udfPath?: string }) => {
          if (mod.type === 'Remove') return { type: 'QueryRemoved', queryId: mod.queryId };
          if (mod.udfPath === 'v1Capabilities:status') return {type:'QueryUpdated',queryId:mod.queryId,value:{isolatedTesting:!closedRelease,personalData:family?.policyOpen??false,liveAIReady:flow,google:false,emailOtp:false,emailReminders:false},logLines:[],journal:null};
          if(closedRelease&&/^(family|privacy):/.test(mod.udfPath??''))throw new Error('Closed release attempted an unfinished family/privacy query.');
          if(mod.udfPath==='privacy:identityReadiness')return {type:'QueryUpdated',queryId:mod.queryId,value:{accounts:1,sessions:1,refreshTokens:1,verificationCodes:0,verifiers:0,truncated:false,identityRemovalEnabled:false},logLines:[],journal:null};
          if (mod.udfPath === 'privacy:status') {privacyQueries.add(mod.queryId);return {type:'QueryUpdated',queryId:mod.queryId,value:privacy,logLines:[],journal:null};}
          if (mod.udfPath === 'family:state') { familyQueries.add(mod.queryId);return {type:'QueryUpdated',queryId:mod.queryId,value:family??{policyOpen:false,children:[],toys:[],activities:[],preferences:null},logLines:[],journal:null}; }
          if (mod.udfPath === 'family:reminders') return {type:'QueryUpdated',queryId:mod.queryId,value:[],logLines:[],journal:null};
          if (mod.udfPath !== 'access:status') throw new Error(`Unexpected D1 query: ${mod.udfPath}`);
          return { type: 'QueryUpdated', queryId: mod.queryId, value: { state: account === 'guest' ? 'trial' : account, uses: 0, canClaimBonus: false, paidUntil: account === 'paid' ? Date.now() + 86400000 : null }, logLines: [], journal: null };
        }));
      }
      if (message.type === 'Mutation') {
        calls.push(message.udfPath);
        if(failDeletionOnce&&message.udfPath==='privacy:requestAccountDeletion'&&calls.filter(name=>name==='privacy:requestAccountDeletion').length===1){socket.send(JSON.stringify({type:'MutationResponse',requestId:message.requestId,success:false,result:'Synthetic deletion failure',ts:version.ts,logLines:[]}));return;}
        if(family&&['family:saveChild','family:saveToy','family:updateActivity','family:savePreferences','family:deleteChild','family:deleteFamilyData','privacy:acknowledge','privacy:deleteFamily','privacy:requestAccountDeletion','privacy:resumeDeletion'].includes(message.udfPath)){
          const args=message.args[0];let result:any=null;
          if(message.udfPath==='family:saveChild'||message.udfPath==='family:saveToy'){
            const rows=message.udfPath==='family:saveChild'?family.children:family.toys;
            const id=args.id??`synthetic-${message.udfPath}-${rows.length}`;const old=rows.find(row=>row._id===id);
            if(old)Object.assign(old,args);else rows.push({_id:id,_creationTime:Date.now(),owner:'synthetic-parent',uploadedAt:Date.now(),...args});result=id;
          }
          if(message.udfPath==='family:updateActivity'){const row=family.activities.find(a=>a._id===args.id);if(!row)throw new Error('Unexpected synthetic activity ID');Object.assign(row,args);if(args.tried){row.triedAt=Date.now();(family.attempts??=[]).push({_id:'synthetic-attempt-'+family.attempts.length,owner:'synthetic-parent',activityId:row._id,at:Date.now(),feedback:args.feedback});}else if(args.feedback){const last=family.attempts?.filter(a=>a.activityId===row._id).at(-1);if(last)last.feedback=args.feedback;}}
          if(message.udfPath==='family:savePreferences')family.preferences={_id:'synthetic-preferences',owner:'synthetic-parent',photoRetention:'none',...args};
          if(message.udfPath==='family:deleteChild')family.children=family.children.filter(c=>c._id!==args.id);
          if(message.udfPath==='privacy:acknowledge'){privacy.acknowledged=true;family.policyOpen=true;}
          if(['privacy:deleteFamily','privacy:requestAccountDeletion'].includes(message.udfPath)){family.children=[];family.toys=[];family.activities=[];family.attempts=[];family.preferences=null;family.policyOpen=false;privacy.acknowledged=false;result={status:message.udfPath==='privacy:requestAccountDeletion'?'awaiting_policy':'finished_family',familyDeleted:true,accountDeleted:false,deletedCount:3,requestedAt:Date.now()};privacy[message.udfPath==='privacy:requestAccountDeletion'?'accountDeletion':'familyDeletion']=result;}
          if(message.udfPath==='privacy:resumeDeletion')result=privacy.accountDeletion??privacy.familyDeletion;
          if(message.udfPath==='family:deleteFamilyData'){family.children=[];family.toys=[];family.activities=[];family.preferences=null;}
          socket.send(JSON.stringify({type:'MutationResponse',requestId:message.requestId,success:true,result,ts:version.ts,logLines:[]}));
          transition({},[...[...familyQueries].map(queryId=>({type:'QueryUpdated',queryId,value:family,logLines:[],journal:null})),...[...privacyQueries].map(queryId=>({type:'QueryUpdated',queryId,value:privacy,logLines:[],journal:null}))]);return;
        }
        if (message.udfPath !== 'analytics:identifyVisitor') throw new Error(`Unexpected D1 mutation: ${message.udfPath}`);
        socket.send(JSON.stringify({ type: 'MutationResponse', requestId: message.requestId, success: true, result: null, ts: version.ts, logLines: [] }));
      }
      if (message.type === 'Action') {
        calls.push(message.udfPath);
        if (flow && message.udfPath === 'recognition:recognize') { socket.send(JSON.stringify({type:'ActionResponse',requestId:message.requestId,success:true,result:{toys:['brown teddy'],recognizedAt:Date.now()},logLines:[]}));return; }
        if (flow && message.udfPath === 'v1Ideas:generate') { if(message.args[0].image!=='')throw new Error('Confirmed-toy generation must not resend a photo'); const toy=message.args[0].confirmedToys[0]; const count=calls.filter(c=>c==='v1Ideas:generate').length;socket.send(JSON.stringify({type:'ActionResponse',requestId:message.requestId,success:count===1,result:count===1?{schemaVersion:2,outcome:'success',limitation:null,toys:[toy],activities:[{category:'creative_adventure',title:'A tiny journey',durationMinutes:5,materials:[toy],toyReferences:[toy],steps:[`Hold the ${toy} and tell a pretend travel story.`,`Take turns describing where the ${toy} goes next.`],parentRole:'Sit together and help your child take turns.',safetyNotes:['Use an intact age-appropriate toy.']}]}:'Synthetic timeout. Your previous ideas are still here.',logLines:[]}));return; }
        if(legacy&&message.udfPath==='play:discover'){const args=message.args[0];if(Object.keys(args).some(k=>!['image','age','visitorToken'].includes(k)))throw new Error('Legacy request contract changed');socket.send(JSON.stringify({type:'ActionResponse',requestId:message.requestId,success:true,result:{toys:['synthetic teddy'],ideas:[{title:'Teddy trip',instructions:'Move the teddy along the sofa.'},{title:'Teddy story',instructions:'Tell a story together.'},{title:'Teddy greeting',instructions:'Wave hello together.'}],raw:'synthetic'},logLines:[]}));return;}
        if (message.udfPath !== 'auth:signOut') throw new Error(`D1 must not call AI or create accounts: ${message.udfPath}`);
        socket.send(JSON.stringify({ type: 'ActionResponse', requestId: message.requestId, success: true, result: null, logLines: [] }));
      }
    });
  });
  return calls;
}

