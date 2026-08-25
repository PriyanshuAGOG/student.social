import { expect, test } from '@playwright/test'

test('public landing page renders without client errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).not.toBeEmpty()
  expect(errors).toEqual([])
})

test('protected API rejects an anonymous mutation', async ({ request }) => {
  const response = await request.post('/api/instructor/grading-queue', {
    data: { submissionId: 'not-owned', grade: 90, feedback: '' },
    headers: { origin: 'http://127.0.0.1:3000' },
  })
  expect([401, 503]).toContain(response.status())
})

test('canonical Pods2 page is the authenticated destination', async ({ page }) => {
  await page.goto('/app/pods')
  await expect(page).toHaveURL(/\/(login|app\/pods)/)
})
