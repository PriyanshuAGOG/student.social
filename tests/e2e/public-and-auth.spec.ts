import { expect, test } from '@playwright/test'

test('public landing page renders without client errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).not.toBeEmpty()
  expect(errors).toEqual([])
})

test('every public navigation and footer route keeps the shared responsive shell', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const routes = ['/about', '/demo', '/blog', '/help', '/contact', '/support', '/status', '/privacy', '/terms', '/cookies', '/dmca', '/accessibility', '/community-guidelines']

  for (const route of routes) {
    const response = await page.goto(route)
    expect(response?.ok(), route).toBeTruthy()
    await expect(page.locator('.ss-public'), route).toBeVisible()
    await expect(page.locator('.site-nav'), route).toBeVisible()
    await expect(page.locator('.site-footer'), route).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${route} has horizontal overflow`).toBeLessThanOrEqual(0)
  }
})

test('desktop browsers do not receive an Android install banner', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1_200)
  await expect(page.getByText('Get the Student.social Android app')).toHaveCount(0)
})

test('Android mobile receives the signed native-app download', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36',
  })
  const page = await context.newPage()
  await page.goto('/')
  const download = page.getByRole('link', { name: 'Download Android app' })
  await expect(download).toBeVisible()
  await expect(download).toHaveAttribute('href', /^https:\/\/studentssocial\.vercel\.app\/downloads\/student-social-latest\.apk\?v=3$/)
  await context.close()
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
