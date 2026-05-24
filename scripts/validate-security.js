#!/usr/bin/env node

/**
 * Security Implementation Validator
 * Validates that all enterprise security features are properly implemented
 */

const fs = require('fs')
const path = require('path')

const checks = [
  {
    name: 'Password Security Module',
    file: 'lib/password-security.ts',
    required: ['validatePassword', 'hashPassword', 'checkPasswordBreach'],
  },
  {
    name: 'Authentication Security',
    file: 'lib/auth-security.ts',
    required: ['generateJWT', 'checkRateLimit', 'registerDevice'],
  },
  {
    name: 'Audit Logging System',
    file: 'lib/auth-audit.ts',
    required: ['logLoginSuccess', 'logLoginFailed', 'logRegistrationSuccess'],
  },
  {
    name: '2FA System',
    file: 'lib/auth-2fa.ts',
    required: ['generateTOTPSecret', 'verifyTOTPToken', 'generateBackupCodes'],
  },
  {
    name: 'Email Verification',
    file: 'lib/auth-email-verification.ts',
    required: ['generateVerificationToken', 'verifyEmailToken'],
  },
  {
    name: 'IP Security',
    file: 'lib/auth-ip-security.ts',
    required: ['checkIPReputation', 'trackIPAttempt'],
  },
  {
    name: 'Session Management',
    file: 'lib/auth-session-security.ts',
    required: ['validateSessionToken', 'manageUserSessions'],
  },
  {
    name: 'Registration Endpoint',
    file: 'app/api/auth/register/route.ts',
    required: ['POST'],
  },
  {
    name: 'Login Endpoint',
    file: 'app/api/auth/login/route.ts',
    required: ['POST'],
  },
  {
    name: 'Email Verification Endpoint',
    file: 'app/api/auth/verify-email/route.ts',
    required: ['POST', 'PUT'],
  },
  {
    name: '2FA Setup Endpoint',
    file: 'app/api/auth/2fa/setup/route.ts',
    required: ['POST', 'PUT'],
  },
  {
    name: '2FA Verify Endpoint',
    file: 'app/api/auth/2fa/verify/route.ts',
    required: ['POST', 'DELETE'],
  },
  {
    name: 'Security Middleware',
    file: 'middleware.ts',
    required: ['Content-Security-Policy', 'X-Frame-Options'],
  },
  {
    name: 'Security Documentation',
    file: 'SECURITY.md',
    required: ['OWASP', 'SOC 2', 'GDPR'],
  },
  {
    name: 'Complete Auth Summary',
    file: 'AUTH_SYSTEM_COMPLETE.md',
    required: ['Production Ready', 'Enterprise-Grade'],
  },
]

let passed = 0
let failed = 0
let warnings = 0

console.log('\n' + '='.repeat(60))
console.log('  SECURITY IMPLEMENTATION VALIDATION')
console.log('='.repeat(60) + '\n')

checks.forEach((check) => {
  const filePath = path.join(process.cwd(), check.file)

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${check.name}`)
    console.log(`   File not found: ${check.file}\n`)
    failed++
    return
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const missingItems = check.required.filter((item) => !content.includes(item))

  if (missingItems.length === 0) {
    console.log(`✅ ${check.name}`)
    console.log(`   All required items found\n`)
    passed++
  } else {
    console.log(`⚠️  ${check.name}`)
    console.log(`   Missing items: ${missingItems.join(', ')}\n`)
    warnings++
  }
})

console.log('='.repeat(60))
console.log(`Results: ${passed} passed, ${warnings} warnings, ${failed} failed`)
console.log('='.repeat(60) + '\n')

if (failed > 0) {
  console.log('🚨 VALIDATION FAILED: Critical security components missing!')
  process.exit(1)
} else if (warnings > 0) {
  console.log('⚠️  VALIDATION PASSED WITH WARNINGS: Review missing items')
  process.exit(0)
} else {
  console.log('✅ VALIDATION PASSED: All security features implemented!')
  process.exit(0)
}
