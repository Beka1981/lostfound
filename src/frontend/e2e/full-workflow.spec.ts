import { test, expect, Page, APIRequestContext } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
test.setTimeout(300_000);
const password='Corrective123!';
const categoryId='33333333-3333-3333-3333-333333333333';
const photo='/var/www/myapi/design/design.png';

async function register(request:APIRequestContext,email:string,firstName:string){
  const response=await request.post('/api/v1/auth/register',{data:{accountType:0,email,password,firstName,lastName:'Phase7'}});
  if(!response.ok())throw new Error(await response.text());const body=await response.json();await response.dispose();return body;
}
async function authenticate(page:Page,auth:any){await page.goto('/login',{waitUntil:'domcontentloaded'});await page.evaluate(a=>{localStorage.setItem('accessToken',a.accessToken);localStorage.setItem('refreshToken',a.refreshToken);localStorage.setItem('accessExpiresAtUtc',a.expiresAtUtc)},auth);}
const headers=(auth:any)=>({Authorization:`Bearer ${auth.accessToken}`});

test('two-user listing, search, favorite, messaging, claim, exchange, rating and QR workflow',async({page,request})=>{
  const stamp=Date.now();
  const lostTitle=`Phase Seven Black Backpack ${stamp}`;
  const foundTitle=`Found Black Backpack ${stamp}`;
  const owner=await register(request,`phase7-owner-${stamp}@example.test`,'Owner');
  const finder=await register(request,`phase7-finder-${stamp}@example.test`,'Finder');

  await authenticate(page,owner);
  console.log('workflow: owner authenticated');
  await page.goto('/create?type=lost',{waitUntil:'domcontentloaded',timeout:15_000});
  await page.locator('select[name=category] option').first().waitFor({state:'attached',timeout:10_000});
  console.log('workflow: lost editor ready');
  await page.locator('select[name=category]').selectOption(categoryId);
  await page.locator('input[name=title]').fill(lostTitle);
  await page.locator('textarea[name=description]').fill('Black backpack with books and a water bottle near Vake Park entrance.');
  await page.locator('input[name=color]').fill('Black');await page.locator('input[name=brand]').fill('Herschel');
  await page.locator('input[name=location]').fill('Vake Park, Tbilisi');
  await page.locator('input[name=occurred]').fill('2026-08-20T08:30');
  await page.locator('input[name=reward]').fill('100');
  await page.getByRole('textbox',{name:/კითხვა 1|Question 1/i}).fill('What book is inside?');
  await page.locator('#item-photos').setInputFiles(photo);
  console.log('workflow: lost photo selected');
  await expect(page.locator('.photo-previews img')).toHaveCount(1);
  await page.locator('button.publish').click();
  console.log('workflow: lost submitted');
  await expect(page).toHaveURL(/\/items\/[0-9a-f-]+$/,{timeout:30_000});
  const lostId=page.url().split('/').pop()!;
  await expect(page.getByRole('heading',{name:lostTitle})).toBeVisible();
  await expect(page.locator('.gallery img').first()).toBeVisible();
  await page.screenshot({path:'../../artifacts/workspace/item-details-desktop.png',fullPage:true});

  await authenticate(page,finder);
  await page.goto('/create?type=found',{waitUntil:'domcontentloaded',timeout:15_000});
  await page.locator('select[name=category] option').first().waitFor({state:'attached',timeout:10_000});
  await page.locator('select[name=category]').selectOption(categoryId);
  await page.locator('input[name=title]').fill(foundTitle);
  await page.locator('textarea[name=description]').fill('Found a black Herschel backpack with books at Vake Park entrance.');
  await page.locator('input[name=color]').fill('Black');await page.locator('input[name=brand]').fill('Herschel');
  await page.locator('input[name=location]').fill('Vake Park, Tbilisi');
  await page.locator('input[name=occurred]').fill('2026-08-20T09:00');
  await page.locator('#item-photos').setInputFiles(photo);
  await page.locator('button.publish').click();
  await expect(page).toHaveURL(/\/items\/[0-9a-f-]+$/,{timeout:30_000});
  const foundId=page.url().split('/').pop()!;

  await page.goto('/explore?q='+encodeURIComponent(String(stamp))+'&type=Lost&categoryId='+categoryId+'&location=Vake&brand=Herschel&color=Black&sort=newest');
  await expect(page.getByText(lostTitle)).toBeVisible();
  await page.getByRole('button',{name:'List'}).click();
  await expect(page.locator('.list-view')).toBeVisible();
  await page.screenshot({path:'../../artifacts/workspace/explore-desktop.png',fullPage:true});
  await page.goto(`/items/${lostId}`);
  await Promise.all([page.waitForResponse(r=>r.url().includes(`/api/v1/favorites/${lostId}`)&&r.request().method()==='POST'),page.locator('.secondary-actions button').first().click()]);
  await page.goto('/favorites');await expect(page.getByText(lostTitle)).toBeVisible();
  await page.screenshot({path:'../../artifacts/workspace/favorites-desktop.png',fullPage:true});
  await page.goto('/my-listings');await expect(page.getByText(foundTitle)).toBeVisible();
  await page.screenshot({path:'../../artifacts/workspace/my-listings-desktop.png',fullPage:true});
  await page.goto(`/items/${foundId}/edit`);await expect(page.locator('input[name=title]')).toHaveValue(foundTitle);
  await page.locator('input[name=title]').fill(`${foundTitle} Updated`);await page.locator('button.publish').click();
  await expect(page).toHaveURL(`/items/${foundId}`);await expect(page.getByRole('heading',{name:`${foundTitle} Updated`})).toBeVisible();

  await page.goto(`/items/${lostId}`);await page.getByRole('button',{name:/შეტყობინება|Message/i}).click();
  await expect(page).toHaveURL(/\/messages\/[0-9a-f-]+/);const conversationId=page.url().split('/').pop()!;
  await page.locator('input[name=body]').fill('I found this backpack near the park.');await page.getByRole('button',{name:/გაგზავნა|Send/i}).click();
  await expect(page.getByText('I found this backpack near the park.')).toBeVisible();
  await page.screenshot({path:'../../artifacts/workspace/messages-desktop.png',fullPage:true});

  await page.goto(`/items/${lostId}/claim`);await expect(page.getByText('What book is inside?')).toBeVisible();
  await page.locator('textarea').fill('A blue travel guide');await page.getByRole('button',{name:/მოთხოვნის გაგზავნა|Submit claim/i}).click();
  await expect(page.getByText(/უსაფრთხოდ გაიგზავნა|safely submitted/i)).toBeVisible();
  const mineResponse=await request.get('/api/v1/claims/mine',{headers:headers(finder)});const mine=await mineResponse.json();await mineResponse.dispose();const claimId=mine.items.find((x:any)=>x.itemId===lostId).id;

  await authenticate(page,owner);await page.goto(`/claims/${claimId}`);await expect(page.getByText('A blue travel guide')).toBeVisible();
  await page.getByRole('button',{name:/მიღება|Accept/i}).click();
  await expect(page.getByRole('link',{name:/უსაფრთხო გადაცემ|secure handover/i})).toBeVisible();
  const claimResponse=await request.get(`/api/v1/claims/${claimId}`,{headers:headers(owner)});const claim=await claimResponse.json();await claimResponse.dispose();const exchangeId=claim.exchangeId;
  await page.goto(`/exchanges/${exchangeId}`);await page.getByRole('button',{name:/უსაფრთხო კოდის|secure code/i}).click();
  await expect(page.locator('.code-box strong')).toHaveText(/\d{6}/);const code=await page.locator('.code-box strong').innerText();

  await authenticate(page,finder);await page.goto(`/exchanges/${exchangeId}`);await page.locator('input[name=code]').fill(code);await page.getByRole('button',{name:/დაბრუნების დადასტურება|Confirm return/i}).click();
  await expect(page.getByText(/დაბრუნება დასრულდა|Return completed/i)).toBeVisible();
  await page.getByRole('link',{name:/შეფასებები|Ratings/i}).click();await page.getByRole('radio',{name:'5 ★'}).check();await page.getByRole('button',{name:/გაგზავნა|Submit/i}).click();await expect(page.getByText(/შეფასება შენახულია|rating was saved/i)).toBeVisible();

  await page.goto('/qr-tags');await page.locator('input[name=label]').fill('Phase 7 Backpack Tag');await page.locator('textarea[name=description]').fill('Please contact the owner safely.');await page.getByRole('button',{name:/QR[ -]ნიშნის შექმნა|Create QR tag/i}).click();
  await expect(page.locator('.rendered-qr')).toBeVisible();const qrResponse=await request.get('/api/v1/qr-tags',{headers:headers(finder)});const qr:any=await qrResponse.json();await qrResponse.dispose();expect(qr.length).toBeGreaterThan(0);
  const tokenResponse=await request.post(`/api/v1/qr-tags/${qr[0].id}/rotate`,{headers:headers(finder)});const token=(await tokenResponse.json()).token;await tokenResponse.dispose();
  await page.goto(`/qr/${token}`);await expect(page.getByText('Phase 7 Backpack Tag')).toBeVisible();
  await page.locator('textarea[name=message]').fill('Scanned near Rustaveli.');await page.getByRole('button',{name:/უსაფრთხო კავშირი|Safely contact/i}).click();await expect(page.getByText(/პირადი კონტაქტის|without revealing/i)).toBeVisible();
  const revoke=await request.post(`/api/v1/qr-tags/${qr[0].id}/revoke`,{headers:headers(finder)});await revoke.dispose();await page.reload();await expect(page.getByText(/მიუწვდომელია|unavailable/i)).toBeVisible();

  const report=await request.post('/api/v1/reports',{headers:headers(finder),data:{itemId:lostId,reason:'other',details:'Controlled Phase 7 moderation test'}});expect(report.ok()).toBeTruthy();
  await report.dispose();const deleted=await request.delete(`/api/v1/items/${foundId}`,{headers:headers(finder)});expect(deleted.ok()).toBeTruthy();await deleted.dispose();
  expect(conversationId).toMatch(/[0-9a-f-]{36}/);
});
