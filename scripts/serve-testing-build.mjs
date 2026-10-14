import './prepare-testing-build.mjs';
import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve,extname,sep,basename } from 'node:path';
import { testingBoundary } from '../shared/testingDeployment.js';
const root=resolve(fileURLToPath(new URL('../dist-v1-testing/',import.meta.url)));
const hash=data=>createHash('sha256').update(data).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url??'/', 'http://127.0.0.1').pathname);
  if(path.includes('/payments')||path.includes('/.')||path.includes('/@fs')||path.includes('..')){res.writeHead(403);res.end('Unavailable in isolated testing');return;}
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+sep)&&file!==root)throw new Error('Outside root');
  const boundary=JSON.parse(await readFile(resolve(root,'.testing-build-boundary.json'),'utf8'));
  if(boundary.backend!==testingBoundary.convexUrl)throw new Error('Unverified backend');
  let body,contentType=types[extname(file)]??'application/octet-stream';
  try{if(!(await stat(file)).isFile())throw new Error('Missing');body=await readFile(file);}
  catch{if(path==='/'||path==='/app'||path.startsWith('/app/')){body=await readFile(resolve(root,'index.html'));contentType='text/html';}else{res.writeHead(404);res.end();return;}}
  if(contentType==='text/html'&&hash(body)!==boundary.htmlHash)throw new Error('Unverified HTML');
  if(extname(file)==='.js'&&path.startsWith('/assets/')&&hash(body)!==boundary.scripts[basename(file)])throw new Error('Unverified script');
  res.writeHead(200,{'Content-Type':contentType,'Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(503);res.end('The testing build is not verified yet. Finish npm run build:testing before opening it.');}
}).listen(5176,'127.0.0.1',()=>console.log('Verified testing build on http://127.0.0.1:5176.'));
