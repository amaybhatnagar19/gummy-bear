// Publish only reviewed, tracked public assets; leave all source files alone.
import {execFileSync} from 'node:child_process';
import {readFileSync,rmSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
const tracked=execFileSync('git',['ls-files','-z','--','public'],{encoding:'utf8'}).split('\0').filter(Boolean);
const untracked=execFileSync('git',['ls-files','--others','--exclude-standard','-z','--','public'],{encoding:'utf8'}).split('\0').filter(Boolean);
let removed=0;
for(const source of untracked){const output=resolve('dist',relative('public',source));if(existsSync(output)){rmSync(output,{force:true});removed++;}}
for(const source of tracked){const output=resolve('dist',relative('public',source));if(!existsSync(output)||!readFileSync(output).equals(readFileSync(source)))throw new Error('Production artifact differs from a reviewed public asset; release blocked.');}
console.log(`Production assets verified; ${removed} untracked build copies excluded. Source files unchanged.`);
