import fs from 'node:fs'
import path from 'node:path'

const METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
const PUBLIC_AUTH_MUTATIONS = new Set([
  'app/api/auth/login/route.ts:POST',
  'app/api/auth/register/route.ts:POST',
  'app/api/auth/request-password-reset/route.ts:POST',
  'app/api/auth/confirm-password-reset/route.ts:POST',
  'app/api/auth/verify-email/route.ts:POST',
  'app/api/auth/logout/route.ts:POST',
  'app/api/auth/refresh-token/route.ts:POST',
])
const OWNERSHIP_NOT_APPLICABLE = new Set([
  'app/api/ai/chat/route.ts:POST',
  'app/api/messages/direct-room/route.ts:POST',
])
const BODY_NOT_REQUIRED = new Set([
  'app/api/auth/logout/route.ts:POST',
  'app/api/auth/refresh-token/route.ts:POST',
  'app/api/notifications/[id]/read/route.ts:PATCH',
  'app/api/notifications/[id]/route.ts:DELETE',
  'app/api/pods/[id]/join/route.ts:POST',
  'app/api/pods/[id]/leave/route.ts:POST',
  'app/api/resources/[id]/like/route.ts:POST',
])

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  })
}

const rows = []
for (const file of walk('app/api').filter((name) => name.endsWith('route.ts'))) {
  const source = fs.readFileSync(file, 'utf8')
  for (const method of METHODS) {
    if (!new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(source)) continue
    const route = file.split(path.sep).join('/')
    const key = `${route}:${method}`
    const publicAuth = PUBLIC_AUTH_MUTATIONS.has(key)
    const actorBound = /auth\.userId|\{\s*userId\s*\}\s*=\s*requireUser|requireOwnership\(|requireRoomMember\(|requireSessionParticipant\(|assertPodRole\(|members\.includes/.test(source)
    rows.push({
      route,
      method,
      authentication: publicAuth || /requireUser\(|withAdminApi\(|requireAdmin/.test(source),
      authenticationMode: publicAuth ? 'public-auth-contract' : 'session',
      sameOrigin: 'global-proxy',
      durableRateLimit: 'global-proxy',
      validation: BODY_NOT_REQUIRED.has(key) || /parseJsonBody\(|safeParse\(|\.parse\(|z\.object\(|formData\(|validateInput\(|mutation-security:\s*validated/.test(source),
      ownership: publicAuth || OWNERSHIP_NOT_APPLICABLE.has(key) || actorBound || /ownerId|authorId|instructorId|userId\s*!==/.test(source),
    })
  }
}

const gaps = rows.filter((row) => !row.authentication || !row.validation || !row.ownership)
console.table(rows)
console.log(JSON.stringify({ mutations: rows.length, routesWithGaps: gaps.length, gaps }, null, 2))

if (process.argv.includes('--strict') && gaps.length) process.exitCode = 1
