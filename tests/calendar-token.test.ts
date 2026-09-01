import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error -- Node 22's strip-types test runner requires the explicit .ts suffix.
import {
  decryptCalendarToken,
  decryptCalendarTokenWithFallback,
  encryptCalendarToken,
  generateCalendarToken,
  hashCalendarToken,
} from '../lib/calendar/token.ts'

test('calendar tokens round-trip with the active key', () => {
  const token = generateCalendarToken()
  const encrypted = encryptCalendarToken(token, 'active-key')

  assert.equal(decryptCalendarToken(encrypted, 'active-key'), token)
  assert.match(token, /^pscal_v1_[A-Za-z0-9_-]+$/)
})

test('legacy calendar tokens can be recovered and re-keyed without changing the link', () => {
  const token = generateCalendarToken()
  const encryptedWithLegacyKey = encryptCalendarToken(token, 'legacy-key')
  const recovered = decryptCalendarTokenWithFallback(encryptedWithLegacyKey, ['active-key', 'legacy-key'])
  const migrated = encryptCalendarToken(recovered.token, 'active-key')

  assert.equal(recovered.keyIndex, 1)
  assert.equal(decryptCalendarToken(migrated, 'active-key'), token)
  assert.equal(hashCalendarToken(recovered.token, 'active-secret'), hashCalendarToken(token, 'active-secret'))
})

test('malformed calendar token payloads fail closed', () => {
  assert.throws(() => decryptCalendarToken('invalid', 'active-key'))
  assert.throws(() => decryptCalendarTokenWithFallback('invalid', ['active-key', 'legacy-key']))
})
