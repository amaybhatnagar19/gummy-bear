import {readFileSync,rmSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const preservedAssets={
 'assets/index-ARx4V7n1.js':'24b7f85334a8369b8e7d1b00fa353d8098c23674cf44f20e8f6fb61342d65a92',
 'assets/index-CdxPm9Ml.css':'98f60af8a5d7cd3451dc15a8e66f37b63a60a9e40b4adba030c5aec75dea8cc1',
 'payments/upi-qr.png':'5977dba6e47430fca03e432de60dbe93d902bae535e690c9ed95e2a75a1e5344'
};
export function removePlatformMetadata(dir){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  const path=`${dir}/${entry.name}`;
  if(['.DS_Store','Thumbs.db'].includes(entry.name))rmSync(path,{force:true});
  else if(entry.isDirectory())removePlatformMetadata(path);
 }
}
export function verifyOptionA(dir){
 for(const [path,hash]of Object.entries(preservedAssets))if(createHash('sha256').update(readFileSync(`${dir}/${path}`)).digest('hex')!==hash)throw new Error('Preserved production asset changed: '+path);
 if(existsSync(`${dir}/sw.js`)||existsSync(`${dir}/manifest.webmanifest`))throw new Error('Option A must not publish the redesigned PWA worker or manifest.');
 for(const path of readdirSync(`${dir}/assets`).filter(n=>n.endsWith('.js')&&n!=='index-ARx4V7n1.js'))if(/v1Capabilities|recognition:recognize|v1Ideas:generate|awaiting_policy/.test(readFileSync(`${dir}/assets/${path}`,'utf8')))throw new Error('Unfinished V1 code in Option A artifact.');
}
if(process.argv[1]?.endsWith('/prepare-option-a.mjs')){
 const dir='dist-option-a';removePlatformMetadata(dir);
 for(const path of ['sw.js','manifest.webmanifest','pwa'])rmSync(`${dir}/${path}`,{recursive:true,force:true});
 const unknown=execFileSync('git',['ls-files','--others','--exclude-standard','-z','--','public'],{encoding:'utf8'}).split('\0').filter(Boolean);
 for(const path of unknown){const rel=path.slice('public/'.length);if(!(rel in preservedAssets))rmSync(`${dir}/${rel}`,{force:true,recursive:true});}
 verifyOptionA(dir);console.log('Option A production app, styles and QR match the captured live hashes. No V1 backend or worker published.');
}
