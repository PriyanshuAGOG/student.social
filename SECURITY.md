# Enterprise Security Implementation Guide

## Overview

This document describes the comprehensive security measures implemented in the PeerSpark authentication system. This is a production-grade, enterprise-level auth system built to OWASP Top 10 and SOC 2 compliance standards.

---

## 1. Password Security

### Requirements
- **Minimum Length**: 8 characters
- **Uppercase**: At least one (A-Z)
- **Lowercase**: At least one (a-z)
- **Numbers**: At least one (0-9)
- **Special Characters**: At least one (!@#$%^&*)

### Features
- Real-time password strength validation
- Password breach detection (checks against HaveIBeenPwned)
- Password history tracking (prevent reuse)
- Secure hashing with bcrypt (salt rounds: 12)
- Entropy calculation (minimum 50 bits)

### Files
- `lib/password-security.ts` - Password validation and hashing
- `lib/auth-route-utils.ts` - Password validation utilities

---

## 2. Two-Factor Authentication (2FA)

### Supported Methods
1. **TOTP (Time-based One-Time Password)**
   - 256-bit entropy secrets
   - 30-second time windows (±30 seconds tolerance)
   - Compatible with Google Authenticator, Authy, Microsoft Authenticator

2. **Backup Codes**
   - 10 backup codes per account
   - SHA-256 hashed for storage
   - One-time use only

### Implementation
- Secrets encrypted using AES-256-GCM
- QR code generation for easy scanning
- Automatic session invalidation if 2FA required

### Files
- `lib/auth-2fa.ts` - 2FA implementation
- `app/api/auth/2fa/*` - 2FA endpoints

---

## 3. Session Management

### Session Features
- **Token Rotation**: Automatic refresh token rotation
- **Concurrent Sessions**: Maximum 5 concurrent sessions per user
- **Session Timeout**: 24-hour idle timeout
- **Device Tracking**: All active sessions tracked by device
- **Token Blacklist**: Revoked tokens cannot be reused

### Token Specs
- **Access Token**: 30 minutes expiry
- **Refresh Token**: 7 days expiry
- **Token Size**: 256+ bits of entropy

### Security Headers
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag (HTTPS only)
- SameSite=Strict (CSRF protection)

### Files
- `lib/auth-session-security.ts` - Session management
- `middleware.ts` - Request security validation

---

## 4. IP Security & Reputation

### Features
- **IP Blocking**: Automatic blocking after suspicious activity
- **Reputation Scoring**: Event-based scoring system
- **Geographic Validation**: Detect impossible travel
- **Bot Detection**: User-Agent pattern matching
- **VPN/Proxy Detection**: Integration points for MaxMind/AbuseIPDB

### Scoring System
| Activity | Score |
|----------|-------|
| Failed login | 5 |
| Rate limit exceeded | 10 |
| Password spray | 20 |
| SQL injection attempt | 30 |
| Brute force attempt | 20 |
| Bot signature | 15 |
| Tor exit node | 10 |

**Auto-block threshold**: 100 points (48-hour block)

### Files
- `lib/auth-ip-security.ts` - IP reputation system
- `lib/auth-security.ts` - Rate limiting

---

## 5. Audit Logging

### Logged Events
- ✅ User registration
- ✅ Email verification
- ✅ Login success/failure
- ✅ Logout
- ✅ Password changes
- ✅ 2FA enable/disable
- ✅ Session creation/revocation
- ✅ Device registration/verification
- ✅ Suspicious activity
- ✅ IP blocking
- ✅ Data access
- ✅ Permission changes

### Retention
- **Default**: 365 days (1 year)
- **GDPR Compliance**: Automatic purge after retention period
- **Export**: JSON and CSV formats for compliance audits

### Files
- `lib/auth-audit-comprehensive.ts` - Audit logging
- `lib/auth-audit.ts` - Audit utilities

---

## 6. Security Headers (OWASP)

### Implemented Headers

```
Content-Security-Policy: Strict CSP with no unsafe-inline for scripts
X-Frame-Options: DENY (prevent clickjacking)
X-Content-Type-Options: nosniff (prevent MIME sniffing)
X-XSS-Protection: 1; mode=block (XSS protection for older browsers)
Strict-Transport-Security: max-age=31536000; preload (HTTPS enforcement)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: Restrict browser features
```

### Files
- `middleware.ts` - Security header implementation

---

## 7. Error Handling & Information Disclosure

### Principles
- ✅ No sensitive data in error messages
- ✅ Detailed errors logged (not shown to user)
- ✅ Generic user-facing error messages
- ✅ Correlation IDs for debugging

### Examples
```
❌ Bad:  "No user found with email user@example.com"
✅ Good: "Invalid email or password"

❌ Bad:  "Database connection failed: postgres://..."
✅ Good: "Service temporarily unavailable. Please try again."
```

### Files
- `lib/auth-route-utils.ts` - Error response formatting
- `app/api/auth/*` - All auth endpoints

---

## 8. Rate Limiting

### Configured Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/register | 5 | 1 hour |
| POST /api/auth/login | 10 | 1 hour |
| POST /api/auth/verify-otp | 5 | 15 minutes |
| POST /api/auth/2fa/verify | 5 | 15 minutes |

### Implementation
- Per-IP limiting
- Per-user limiting
- Automatic unblock after time window
- HTTP 429 response with Retry-After header

### Files
- `lib/auth-security.ts` - Rate limiting logic
- `middleware.ts` - Request middleware

---

## 9. CSRF Protection

### Features
- ✅ Origin validation for API mutations
- ✅ Host header verification
- ✅ Correlation IDs for request tracking
- ✅ SameSite cookie attribute

### Implementation
```typescript
// All mutations require Origin header validation
if (originHost !== host) {
  return 403 Forbidden
}
```

### Files
- `middleware.ts` - CSRF validation

---

## 10. Data Protection

### Encryption
- ✅ Passwords: bcrypt with 12 salt rounds
- ✅ TOTP Secrets: AES-256-GCM
- ✅ Backup Codes: SHA-256 hashes
- ✅ HTTPS only (TLS 1.3)

### At Rest
- Database encryption (handled by Appwrite)
- No plaintext sensitive data
- Encrypted fields encrypted before storage

### In Transit
- TLS 1.3 minimum
- HSTS enforcement (1 year + preload)
- Perfect forward secrecy

### Files
- `lib/password-security.ts` - Encryption/hashing
- `lib/auth-2fa.ts` - Secret encryption
- `middleware.ts` - HTTPS enforcement

---

## 11. Authentication Flow

### Registration
```
1. User submits email + password + name
2. Password validated (strength, breach check)
3. Email validated (format, not already used)
4. Rate limit checked (5 per hour per IP)
5. User created in Appwrite
6. Verification email sent
7. User must verify email before login
```

### Login
```
1. Email + password submitted
2. Rate limit checked (10 per hour per IP)
3. IP reputation checked
4. Credentials validated
5. If 2FA enabled: Send OTP/TOTP prompt
6. Session created with device tracking
7. Access token issued
```

### Session Refresh
```
1. Refresh token submitted
2. Token version checked (revocation list)
3. Token not expired
4. New access token issued
5. Refresh token rotated (old one blacklisted)
```

### Files
- `app/api/auth/register/route.ts` - Registration
- `app/api/auth/login/route.ts` - Login
- `app/api/auth/refresh/route.ts` - Token refresh

---

## 12. Compliance Standards

### OWASP Top 10
- ✅ A01: Broken Access Control (session management)
- ✅ A02: Cryptographic Failures (encryption at rest/transit)
- ✅ A03: Injection (parameterized queries, input validation)
- ✅ A04: Insecure Design (2FA, rate limiting)
- ✅ A05: Security Misconfiguration (security headers)
- ✅ A06: Vulnerable Components (dependency updates)
- ✅ A07: Authentication Failures (strong auth, 2FA)
- ✅ A08: Software Data Integrity Failures (token signing)
- ✅ A09: Logging Failures (comprehensive audit logs)
- ✅ A10: SSRF (request validation)

### SOC 2 Controls
- ✅ C1: User authentication and password management
- ✅ C2: System access controls
- ✅ C3: Logical security monitoring
- ✅ C4: Comprehensive logging and monitoring
- ✅ C5: Encryption and key management
- ✅ C6: Data protection and privacy

### GDPR Compliance
- ✅ Right to erasure (automatic cleanup)
- ✅ Data portability (audit log export)
- ✅ Breach notification (audit alerts)
- ✅ Data minimization (only necessary data collected)

### Files
- `lib/auth-audit-comprehensive.ts` - Audit trails
- `middleware.ts` - Monitoring
- `lib/password-security.ts` - Data protection

---

## 13. Deployment Checklist

Before deploying to production:

```
Authentication
☐ NEXT_PUBLIC_APPWRITE_ENDPOINT configured
☐ NEXT_PUBLIC_APPWRITE_PROJECT_ID configured
☐ APPWRITE_API_KEY configured (server-only)
☐ Email verification enabled
☐ Password policies configured

Security
☐ HTTPS enabled
☐ HSTS header configured
☐ CSP headers validated
☐ CORS properly configured
☐ Security headers tested

2FA & Sessions
☐ 2FA OTP service configured
☐ Email service configured
☐ Session cleanup scheduled (daily)
☐ Audit log retention configured

Monitoring
☐ Error alerts configured
☐ Rate limit monitoring active
☐ Suspicious activity alerts enabled
☐ Audit log backup configured
☐ Database backups enabled

Testing
☐ Password validation tested
☐ Rate limiting tested
☐ 2FA flow tested
☐ Session management tested
☐ Error handling tested
```

---

## 14. Monitoring & Alerts

### Critical Events (Immediate Alert)
- Multiple failed login attempts from same IP (5+ in 5 min)
- User password changed from new location
- 2FA disabled/enabled
- Session revoked manually
- Account locked/suspended
- IP address blocked
- Brute force detected

### Weekly Reports
- Failed login attempts
- New devices registered
- Session usage patterns
- Rate limit violations
- Suspicious IP addresses

### Monthly Audit
- User authentication summary
- Security event analysis
- Compliance report generation
- Data retention validation

### Files
- `lib/auth-audit-comprehensive.ts` - Event generation
- Implement: Dashboard for monitoring

---

## 15. Incident Response

### Possible Incidents

**Compromised Account**
```
1. Force password change
2. Revoke all sessions
3. Disable 2FA temporarily
4. Send security alert email
5. Review login history
6. Monitor for suspicious activity
```

**Brute Force Attack**
```
1. Block IP address (48 hours)
2. Increase rate limits
3. Alert security team
4. Review logs for success
5. Notify affected users
```

**Data Breach**
```
1. Force password reset for all users
2. Disable all sessions
3. Clear TOTP secrets
4. Issue new backup codes
5. Enable mandatory 2FA
6. Audit database for unauthorized access
7. Notify users (24 hours)
```

---

## 16. Regular Security Maintenance

### Daily
- Monitor authentication logs
- Check for failed login spikes
- Review suspicious activity alerts

### Weekly
- Audit IP reputation scores
- Review rate limit violations
- Check session cleanup jobs

### Monthly
- Penetration test (or after changes)
- Security audit
- Dependency vulnerability scan
- Compliance audit log review

### Quarterly
- Full security review
- Threat model update
- Password policy review
- 2FA method evaluation

### Annually
- SOC 2 audit
- GDPR compliance review
- Incident response drill
- Staff security training

---

## 17. Resources & References

### OWASP
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Top 10 2021](https://owasp.org/Top10/)

### Standards
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [RFC 2617 - HTTP Authentication](https://tools.ietf.org/html/rfc2617)

### Libraries Used
- **bcrypt**: Password hashing (industry standard)
- **speakeasy**: TOTP implementation
- **qrcode**: QR code generation
- **node-appwrite**: Appwrite SDK

---

## 18. Support & Contact

For security issues:
1. **Do NOT** open a public issue
2. Email: security@peerspark.app
3. Include: Description, reproduction steps, impact

For questions about this implementation:
- Review code comments in `/lib/auth-*` files
- Check test files in `/app/api/auth/*`
- Reference this document for design decisions

---

**Last Updated**: May 24, 2026
**Security Level**: Enterprise Grade
**Status**: Production Ready
