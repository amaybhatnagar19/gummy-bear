import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('Option A retains exact served production app/style/QR bytes and backend URL',async()=>{
 const {preservedAssets}=await import('../../scripts/prepare-option-a.mjs');
 for(const [path,hash]of Object.entries(preservedAssets))expect(createHash('sha256').update(readFileSync(`public/${path}`)).digest('hex')).toBe(hash);
 expect(readFileSync('public/assets/index-ARx4V7n1.js','utf8')).toContain('https://sensible-avocet-370.convex.cloud');
});
test('Option A publication is static upload only; explicit production and existing component',async()=>{
 const {optionAUploadArguments}=await import('../../scripts/release-option-a.mjs');
 expect(optionAUploadArguments).toEqual(['node_modules/@convex-dev/static-hosting/dist/cli/index.js','upload','--dist','dist-option-a','--prod','--component','staticHosting']);
 expect(readFileSync('src/optionA.tsx','utf8')).not.toMatch(/serviceWorker\.register|features\/app|convex\/react/);
});

test('Option A removes ignored platform metadata only from a generated artifact',async()=>{const{mkdtempSync,mkdirSync,writeFileSync,existsSync,rmSync}=await import('node:fs');const{tmpdir}=await import('node:os');const dir=mkdtempSync(tmpdir()+'/gummy-option-a-');try{mkdirSync(dir+'/assets');writeFileSync(dir+'/.DS_Store','synthetic');writeFileSync(dir+'/assets/Thumbs.db','synthetic');writeFileSync(dir+'/assets/keep.js','reviewed');const{removePlatformMetadata}=await import('../../scripts/prepare-option-a.mjs');removePlatformMetadata(dir);expect(existsSync(dir+'/.DS_Store')).toBe(false);expect(existsSync(dir+'/assets/Thumbs.db')).toBe(false);expect(existsSync(dir+'/assets/keep.js')).toBe(true);}finally{rmSync(dir,{recursive:true,force:true});}});
