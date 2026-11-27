import { expect, test, type Page } from '@playwright/test';
const password = 'Passw0rd123!';
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e9)}@example.com`;

async function signup(page: Page) {
  const email = unique();
  await page.goto('/register');
  await page.getByLabel('Full name').fill('E2E Student');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: /Hello, E2E/ })).toBeVisible();
  return email;
}

// All tests create their own account in the dedicated e2e.db, not dev.db.
test('guests cannot access protected pages and can register', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).toHaveURL(/login/);
  await signup(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Hello, E2E/ })).toBeVisible();
});

test('create a subject, create/complete/submit a task, and export a report', async ({ page }) => {
  await signup(page);
  await page.getByRole('link', { name: 'Subjects' }).click();
  await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible();
  await page.getByRole('button', { name: 'Add subject' }).first().click();
  await page.getByRole('dialog').getByLabel('Subject name').fill('Computer Science');
  await page.getByRole('dialog').getByLabel('Subject code').fill('CS101');
  await page.getByRole('dialog').getByRole('button', { name: 'Add subject' }).click();
  await expect(page.getByRole('heading', { name: 'Computer Science' })).toBeVisible();

  await page.getByRole('link', { name: 'My tasks' }).click();
  await page.getByRole('button', { name: 'New task' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Task title').fill('Finish the laboratory report');
  await dialog.getByLabel('Subject').selectOption({ label: 'Computer Science' });
  await dialog.getByLabel('Priority').selectOption('HIGH');
  await dialog.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText('Finish the laboratory report')).toBeVisible();
  await page.getByRole('combobox', { name: 'Change status for Finish the laboratory report' }).selectOption('COMPLETED');
  await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();

  await page.getByRole('link', { name: 'Submissions' }).click();
  await page.getByRole('tab', { name: 'Ready to submit' }).click();
  await expect(page.getByText('Finish the laboratory report')).toBeVisible();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Link to your work').fill('https://example.org/my-work');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm submission' }).click();
  await expect(page.getByText('Submission saved.')).toBeVisible();
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page.getByRole('heading', { name: 'Reports & insights' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await download).suggestedFilename()).toBe('tasks.csv');
});

test('calendar, notifications, and account settings are interactive', async ({ page }) => {
  await signup(page);
  await page.getByRole('link', { name: 'Calendar' }).click();
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.getByRole('link', { name: 'Notifications' }).click();
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();
  await page.getByLabel('Full name').fill('Updated E2E Student');
  await page.getByRole('button', { name: 'Save profile changes' }).click();
  await expect(page.getByText('Your profile has been updated.')).toBeVisible();
  await page.getByLabel('Current password').fill(password);
  await page.getByLabel('New password', { exact: true }).fill('ChangedPass123!');
  await page.getByLabel('Confirm new password').fill('ChangedPass123!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Your password was changed successfully.')).toBeVisible();
});

test('mobile navigation opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signup(page);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Subjects' }).click();
  await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible();
});
