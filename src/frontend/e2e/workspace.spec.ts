import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = '../../artifacts/workspace';
test.beforeAll(() => mkdirSync(out, { recursive: true }));

test('guest routes, navigation, responsive UI and console are healthy', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [], bad: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 500) bad.push(`${r.status()} ${r.url()}`); });
  for (const size of [{ n: 'mobile', width: 390, height: 844 }, { n: 'tablet', width: 768, height: 1024 }, { n: 'desktop', width: 1440, height: 1000 }]) {
    await page.setViewportSize(size);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /იპოვე|Find|Найд/i })).toBeVisible();
    await expect(page.getByText(/კატეგორიები|Categories|Категории/)).toBeVisible();
    await page.screenshot({ path: `${out}/home-${size.n}.png`, fullPage: true });
  }
  for (const path of ['/login', '/register', '/explore', '/forgot-password', '/does-not-exist']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: `${out}/${path.slice(1)}-desktop.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.bottom-nav .add').click();
  await expect(page.locator('.mobile-sheet')).toBeVisible();
  await page.getByRole('link', { name: /დაკარგულის|Report lost|потер/i }).click();
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  writeFileSync(`${out}/guest-diagnostics.json`, JSON.stringify({ errors, bad }, null, 2));
  expect(errors).toEqual([]); expect(bad).toEqual([]);
});

test('Person registration, logout and login work through the UI', async ({ page }) => {
  const email = `phase7-person-${Date.now()}@example.test`, password = 'Corrective123!';
  await page.goto('/register');
  await page.locator('input[name=firstName]').fill('Phase');
  await page.locator('input[name=lastName]').fill('Seven');
  await page.locator('input[name=email]').fill(email);
  await page.locator('input[name=phone]').fill('+995 555 111 222');
  await page.locator('input[name=password]').fill(password);
  await page.locator('input[name=confirm]').fill(password);
  await page.locator('input[name=terms]').check();
  await page.getByRole('button', { name: /ანგარიშ|Create your account|Создайте/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page).toHaveURL('/login');
  await page.locator('input[name=email]').fill(email);
  await page.locator('input[name=password]').fill(password);
  await page.getByRole('button', { name: /შესვლა|Log in|Войти/, exact: true }).click();
  await expect(page).toHaveURL('/');
});

test('Organization registration exposes organization profile fields', async ({ page }) => {
  const email = `phase7-org-${Date.now()}@example.test`;
  await page.goto('/register');
  await page.getByRole('button', { name: /ორგანიზაცია|Organization|Организация/ }).click();
  await page.locator('input[name=organizationName]').fill('Phase Seven Org');
  await page.locator('input[name=responsiblePerson]').fill('Responsible Tester');
  await page.locator('input[name=email]').fill(email);
  await page.locator('input[name=phone]').fill('+995 555 333 444');
  await page.locator('input[name=password]').fill('Corrective123!');
  await page.locator('input[name=confirm]').fill('Corrective123!');
  await page.locator('input[name=terms]').check();
  await page.getByRole('button', { name: /ანგარიშ|Create your account|Создайте/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.locator('input[name=email]').fill(email);
  await page.locator('input[name=password]').fill('Corrective123!');
  await page.getByRole('button', { name: /შესვლა|Log in|Войти/, exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/profile');
  await expect(page.locator('input[name=org]')).toHaveValue('Phase Seven Org');
  await page.screenshot({ path: `${out}/profile-organization.png`, fullPage: true });
});
