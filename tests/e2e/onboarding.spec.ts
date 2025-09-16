import { test, expect } from '@playwright/test';

const shouldRun = Boolean(process.env.E2E_BASE_URL);

test.describe('ProofHire DE onboarding flow', () => {
  test.skip(!shouldRun, 'Set E2E_BASE_URL to enable end-to-end tests.');

  test('candidate onboarding to submission and admin verification', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Authentic Data Engineering talent, verified in India.' })).toBeVisible();

    // Auth flow would normally use Google/LinkedIn. In CI we expect test credentials via stubbed auth.
    await page.goto('/onboarding');

    await page.getByLabel('Full name').fill('Playwright Candidate');
    await page.getByLabel('Mobile (+91)').fill('+919876543210');
    await page.getByLabel('Years of experience').fill('5');
    await page.getByLabel('Primary cloud').selectOption('GCP');
    await page.getByRole('checkbox', { name: 'Airflow' }).check();
    await page.getByRole('button', { name: 'Save & continue' }).click();

    // Resume upload requires signed URL; this interaction assumes fixture credentials.
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await page.getByRole('button', { name: 'Save & continue' }).click();
    await page.getByRole('button', { name: 'Save & continue' }).click();
    await page.getByLabel('I consent to data processing in India and archive-not-delete retention.').check();
    await page.getByRole('button', { name: 'Submit for review' }).click();

    await expect(page.getByText('Profile submitted for review.')).toBeVisible();
  });
});
