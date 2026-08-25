import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

// @ts-expect-error -- Node 22's strip-types test runner requires the explicit .ts suffix.
import { createProfileEnsureDeduper } from '../lib/appwrite/profile-ensure-deduper.ts'

test('profile ensure deduper coalesces concurrent requests and caches success', async () => {
  let calls = 0
  let clock = 1_000
  const deduper = createProfileEnsureDeduper<{ $id: string }>({
    ttlMs: 100,
    now: () => clock,
  })
  const operation = async () => {
    calls += 1
    await Promise.resolve()
    return { $id: 'user-1' }
  }

  const profiles = await Promise.all([
    deduper.ensure('user-1', operation),
    deduper.ensure('user-1', operation),
    deduper.ensure('user-1', operation),
  ])

  assert.equal(calls, 1)
  assert.deepEqual(profiles, [{ $id: 'user-1' }, { $id: 'user-1' }, { $id: 'user-1' }])

  await deduper.ensure('user-1', operation)
  assert.equal(calls, 1)

  clock += 101
  await deduper.ensure('user-1', operation)
  assert.equal(calls, 2)
})

test('profile ensure deduper does not cache failures', async () => {
  let calls = 0
  const deduper = createProfileEnsureDeduper<{ $id: string }>()

  await assert.rejects(
    deduper.ensure('user-1', async () => {
      calls += 1
      throw new Error('temporary failure')
    }),
    /temporary failure/,
  )

  const profile = await deduper.ensure('user-1', async () => {
    calls += 1
    return { $id: 'user-1' }
  })

  assert.equal(calls, 2)
  assert.equal(profile.$id, 'user-1')
})

test('notification inbox uses the provisioned timestamp index field', () => {
  const source = fs.readFileSync('app/api/notifications/inbox/route.ts', 'utf8')
  assert.match(source, /Query\.orderDesc\('timestamp'\)/)
  assert.doesNotMatch(source, /Query\.orderDesc\('createdAt'\)/)
})

test('pod courses route uses Appwrite Query strings and provisioned pod course fields', () => {
  const source = fs.readFileSync('app/api/pods/pod-courses/route.ts', 'utf8')
  assert.match(source, /await createAdminClient\(\)/)
  assert.match(source, /Query\.equal\('podId', podId\)/)
  assert.match(source, /podCourse\.courseTitle/)
  assert.doesNotMatch(source, /method:\s*'equal'/)
  assert.doesNotMatch(source, /podCourse\.courseId/)
  assert.doesNotMatch(source, /attribute:\s*'chapterId'/)
})

test('existing profile reads bypass mutation rate limiting', () => {
  const source = fs.readFileSync('app/api/profiles/ensure/route.ts', 'utf8')
  const existingProfileReturn = source.indexOf('profile: existing, created: false')
  const updateRateLimit = source.indexOf("key: 'profiles:ensure:update'")
  assert.ok(existingProfileReturn >= 0)
  assert.ok(updateRateLimit > existingProfileReturn)
})
