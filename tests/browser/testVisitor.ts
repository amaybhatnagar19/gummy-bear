import { execFileSync } from 'node:child_process';
import { expect, type Page } from '@playwright/test';
export async function labelTestVisitor(page:Page){
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('gummy-bear-visitor'))).toBeTruthy();
  const visitorToken=await page.evaluate(()=>localStorage.getItem('gummy-bear-visitor'));
  execFileSync('npx',['convex','run','--codegen','disable',...(process.env.GUMMY_TEST_URL?['--prod']:[]),'analytics:markTestVisitor',JSON.stringify({visitorToken})],{encoding:'utf8'});
}
