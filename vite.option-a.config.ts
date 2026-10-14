import {defineConfig,loadEnv} from 'vite';
import {validateProductionBuild} from './scripts/production-preflight.mjs';
export default defineConfig(()=>{
 validateProductionBuild(loadEnv('production',process.cwd(),''));
 return {build:{outDir:'dist-option-a'},plugins:[{name:'option-a-entry',transformIndexHtml:{order:'pre',handler(html){return html.replace('/src/main.tsx','/src/optionA.tsx').replace(/<link rel="manifest"[^>]*>/,'').replace(/<link rel="apple-touch-icon"[^>]*>/,'');}}}]};
});
