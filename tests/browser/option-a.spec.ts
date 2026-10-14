import {test,expect} from '@playwright/test';
import {isolate} from './isolatedBackend';
test('D1.2 landing remains responsive; every Get Started opens preserved app',async({page},info)=>{
 await isolate(page,'guest',false,undefined,false,false,true,true);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('favorite toy');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const a of await page.getByRole('link',{name:'Get Started',exact:true}).all())await expect(a).toHaveAttribute('href','/app');}
 await page.getByRole('link',{name:'Get Started',exact:true}).first().click();await expect(page.getByRole('button',{name:'Find play ideas'})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Find play ideas'})).toBeVisible();await page.goBack();await expect(page.getByRole('heading',{level:1})).toContainText('favorite toy');await page.screenshot({path:info.outputPath('landing-desktop.png'),fullPage:true});
});
test('existing paid session opens original tool and legacy response contract works with mocked AI',async({page},info)=>{
 const calls=await isolate(page,'paid',false,undefined,false,false,true,true);await page.goto('/app');await expect(page.getByRole('button',{name:'Log out'})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Log out'})).toBeVisible();
 await page.locator('input[type=file]').last().setInputFiles('public/images/toy-teddy-640.webp');await expect(page.getByRole('button',{name:'Find play ideas'})).toBeEnabled();await page.getByRole('button',{name:'Find play ideas'}).click();await expect(page.getByText('Teddy trip',{exact:true})).toBeVisible();expect(calls).toContain('play:discover');expect(calls.some(x=>/family|v1|recognition|testingAccess/.test(x))).toBe(false);for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.setViewportSize({width:390,height:844});await page.screenshot({path:info.outputPath('legacy-mobile.png'),fullPage:true});
});
test('existing password form, payment path and QR are retained without real sign-in or payment',async({page})=>{
 await isolate(page,'payment',false,undefined,false,false,true,true);await page.goto('/app');await page.getByRole('button',{name:'Payment',exact:true}).click();await expect(page.locator('img[src="/payments/upi-qr.png"]')).toBeVisible();await expect(page.getByText(/99/).first()).toBeVisible();await expect(page.getByRole('button',{name:/bonus/i})).toHaveCount(0);
});
test('guest authentication choices and original trial tool remain visible',async({page})=>{
 await isolate(page,'guest',false,undefined,false,false,true,true);await page.goto('/app');await page.getByRole('button',{name:'Log in',exact:true}).click();await expect(page.getByLabel('Email',{exact:true})).toBeVisible();await expect(page.getByLabel('Password',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Create an account'})).toBeVisible();await expect(page.getByRole('button',{name:'Continue with Google'})).toHaveCount(0);
});
