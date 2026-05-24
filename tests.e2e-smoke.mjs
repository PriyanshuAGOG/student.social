import test from 'node:test'
import assert from 'node:assert/strict'

test('middleware file exists for global api protection', async () => {
  const fs = await import('node:fs/promises')
  const content = await fs.readFile('middleware.ts', 'utf8')
  assert.match(content, /CSRF_BLOCKED/)
  assert.match(content, /RATE_LIMITED/)
})
