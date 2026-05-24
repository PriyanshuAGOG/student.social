# Enterprise-Level Authentication Security

This document outlines the comprehensive security implementation for the Student Social authentication system. The system implements industry-standard security practices to protect user accounts and data.

## Overview

The authentication system includes:
- **JWT-based Session Management** with token expiry and refresh
- **Rate Limiting** on all auth endpoints
- **Account Lockout** after failed login attempts
- **Device Fingerprinting** to detect unusual access
- **Password Security** with strength validation and breach detection
- **CSRF Protection** with token validation
- **Comprehensive Audit Logging** for all auth events
- **Email Verification** with time-limited tokens
- **Secure Password Storage** using bcrypt

## Architecture

### Core Security Modules

#### 1. Auth Security (`lib/auth-security.ts`)
Implements:
- JWT token generation and verification (HS256)
- Rate limiting with configurable windows and lockouts
- CSRF token generation and validation
- Device fingerprinting
- Account lockout management
- Token blacklisting

#### 2. Password Security (`lib/password-security.ts`)
Implements:
- Password strength validation
- Password history tracking
- Breach detection (via common password list)
- Password entropy calculation
- Email validation with disposable email detection

#### 3. Audit Logging (`lib/auth-audit.ts`)
Implements:
- Structured event logging
- IP address and user-agent tracking
- Suspicious activity detection
- Audit trail export (JSON/CSV)
- Pattern-based fraud detection

#### 4. Auth Route Utils (`lib/auth-route-utils.ts`)
Implements:
- Request parsing and validation
- Error response formatting with security headers
- Client IP extraction
- User-agent parsing
- Rate limit header injection

## Security Features

### 1. Rate Limiting

**Registration**: 5 attempts per hour per IP
- Prevents account enumeration
- Blocks automated signup attacks

**Login**: 5 failed attempts per 15 minutes per IP
- Global IP-based limit to prevent brute force
- User-based lockout after failures

**Password Reset**: 3 attempts per 24 hours per email
- Prevents email bombing
- Limits reset attack surface

**Email Verification**: 5 attempts per 24 hours per email
- Prevents verification spam

### 2. Account Lockout

- Triggered after 5 failed login attempts
- Initial lockout: 15 minutes
- Exponential backoff: Subsequent lockouts double duration
- Maximum lockout: 60 minutes
- Automatic unlock after duration expires
- Optional: Email notification of lockout

### 3. Password Security

**Requirements**:
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Features**:
- Passwords hashed with bcrypt (12 rounds)
- Password history prevents reuse of last 5 passwords
- Breach detection blocks commonly compromised passwords
- Entropy calculation (minimum 40 bits for acceptable strength)
- Real-time strength feedback

### 4. JWT Session Management

**Token Structure**:
```
Header: {alg: "HS256", typ: "JWT"}
Payload: {
  userId: string,
  sessionId: string,
  deviceFingerprint: string,
  iat: number,
  exp: number,
  jti: string (unique token ID for blacklisting)
}
Signature: HMAC-SHA256(secret)
```

**Expiry**:
- Access Token: 30 minutes
- Refresh Token: 7 days
- Remember Me: 30 days

**Security**:
- HS256 (HMAC) signing with 32+ character secret
- Token blacklisting on logout
- Device fingerprint included in token
- JTI (JWT ID) enables revocation

### 5. Device Fingerprinting

**Components**:
- User-Agent string
- Client IP address
- SHA256 hash of combined values

**Features**:
- Tracks known devices per user
- Flags new device logins
- Optional email alert for new devices
- Device can be unregistered by user

**Use Cases**:
- Detect account takeover
- Verify multi-device usage
- Suspicious activity detection

### 6. CSRF Protection

- Session-based CSRF tokens
- 1-hour token expiry
- Automatic cleanup of expired tokens
- Timing-safe comparison to prevent timing attacks

### 7. Audit Logging

**Logged Events**:
- Registration attempts (success/failure)
- Login attempts (success/failure)
- Account lockouts
- Password resets
- Email verifications
- Device registrations
- Token refreshes
- Logout events
- Suspicious activities

**Information Captured**:
- Event type and timestamp
- User ID and email
- Client IP address
- User-Agent
- Device fingerprint
- HTTP status code
- Error codes and messages
- Operation duration

**Suspicious Pattern Detection**:
- Multiple failed logins from same IP
- Login attempts from many IPs for single user
- Rapid registration from same IP
- Failed email verification attempts
- Brute force patterns

**Export**:
- JSON format for data analysis
- CSV format for reporting
- Queryable by user, IP, event type, severity

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/register`
Register new user with validation and rate limiting.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** (201):
```json
{
  "success": true,
  "userId": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "message": "Registration successful. Please verify your email."
}
```

**Error Codes**:
- `VALIDATION_ERROR`: Missing/invalid fields
- `INVALID_EMAIL`: Email format or disposable email
- `WEAK_PASSWORD`: Password doesn't meet requirements
- `PASSWORD_BREACHED`: Password found in breach database
- `USER_EXISTS`: Email already registered
- `RATE_LIMITED`: Too many registration attempts
- `SERVER_CONFIG_ERROR`: Server misconfiguration

#### `POST /api/auth/login`
Authenticate user and create session.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "userId": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "accessToken": "jwt_token_here",
  "expiresIn": 1800,
  "message": "Login successful"
}
```

**Headers**:
- `Set-Cookie: peerspark_session=...` (HttpOnly, Secure, SameSite=Strict)

**Error Codes**:
- `INVALID_CREDENTIALS`: Wrong email or password
- `ACCOUNT_LOCKED`: Too many failed attempts
- `RATE_LIMITED`: Too many login attempts
- `USER_NOT_FOUND`: User doesn't exist
- `DEVICE_VERIFICATION_FAILED`: New unverified device
- `SERVER_CONFIG_ERROR`: Server misconfiguration

#### `POST /api/auth/logout`
Invalidate session and clear cookies.

**Request**:
```
Authorization: Bearer jwt_token_here
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Effects**:
- JWT token added to blacklist
- Session cookie cleared
- Appwrite session deleted
- Device fingerprint cleared

#### `GET /api/auth/validate-session`
Verify current session validity.

**Request**:
```
Authorization: Bearer jwt_token_here
```

**Response** (200):
```json
{
  "success": true,
  "userId": "user123",
  "email": "user@example.com",
  "sessionId": "session123",
  "isNewDevice": false,
  "expiresAt": "2026-05-24T15:30:00.000Z"
}
```

**Error Codes**:
- `NO_TOKEN`: Missing authorization header
- `INVALID_TOKEN`: Malformed or expired token
- `BLACKLISTED_TOKEN`: Token has been revoked
- `USER_NOT_FOUND`: User no longer exists

#### `POST /api/auth/refresh-token`
Generate new access token.

**Request**:
```
Authorization: Bearer current_jwt_token_here
```

**Response** (200):
```json
{
  "success": true,
  "accessToken": "new_jwt_token_here",
  "expiresIn": 1800,
  "tokenType": "Bearer"
}
```

**Error Codes**:
- `NO_TOKEN`: Missing authorization header
- `INVALID_TOKEN`: Cannot refresh invalid token
- `BLACKLISTED_TOKEN`: Token has been revoked
- `USER_NOT_FOUND`: User no longer exists

## Security Headers

All auth responses include:
- `Cache-Control: no-store, no-cache, must-revalidate`
- `Pragma: no-cache`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-RateLimit-Remaining: n` (on rate-limited responses)
- `X-RateLimit-Reset: timestamp`
- `Retry-After: seconds`

## Environment Variables

### Required
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Appwrite server endpoint
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Appwrite project ID
- `APPWRITE_API_KEY`: Appwrite server API key
- `APPWRITE_SESSION_COOKIE_SECRET`: Secret for signing session cookies
- `JWT_SIGNING_KEY`: Secret for signing JWT tokens (min 32 chars)

### Recommended
- `PASSWORD_BREACH_CHECK_ENABLED`: Enable breach detection
- `DEVICE_FINGERPRINTING_ENABLED`: Enable device tracking
- `AUDIT_LOGGING_ENABLED`: Enable audit trail
- All rate limit and lockout configuration

## Database Schema

### User Object (Appwrite)
```
{
  $id: string,
  email: string (unique),
  name: string,
  password: string (hashed by Appwrite),
  emailVerification: boolean,
  $createdAt: ISO timestamp,
  $updatedAt: ISO timestamp
}
```

### Session Tracking (In-Memory)
```
{
  userId: string,
  sessionId: string,
  deviceFingerprint: string,
  userAgent: string,
  ipAddress: string,
  createdAt: timestamp,
  lastActivity: timestamp,
  expiresAt: timestamp
}
```

### Audit Log
```
{
  id: string,
  timestamp: ISO timestamp,
  eventType: enum,
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  statusCode: number,
  errorCode: string,
  errorMessage: string,
  severity: enum,
  metadata: object
}
```

## Implementation Checklist

- [x] JWT token generation and validation
- [x] Rate limiting on all auth endpoints
- [x] Account lockout with exponential backoff
- [x] Device fingerprinting
- [x] Password strength validation
- [x] Password history tracking
- [x] Breach detection
- [x] CSRF protection
- [x] Audit logging
- [x] Error handling with security
- [x] Security headers
- [x] Session validation
- [x] Token refresh mechanism
- [x] Device management
- [x] Suspicious activity detection
- [ ] Email verification (requires email service)
- [ ] Two-factor authentication (optional)
- [ ] IP blocking/reputation (optional)
- [ ] External audit log service (optional)

## Best Practices

### For Developers

1. **Always validate input** - Use Zod schemas consistently
2. **Log security events** - Use audit logging for all auth events
3. **Handle errors securely** - Don't expose internal error details
4. **Use HTTPS** - Enforce in production
5. **Keep secrets secure** - Never commit keys to repository
6. **Test rate limiting** - Verify limits work as expected
7. **Monitor audit logs** - Review suspicious activity regularly

### For Users

1. **Use strong passwords** - Follow password requirements
2. **Verify new devices** - Respond to device verification emails
3. **Monitor account activity** - Check login history
4. **Report suspicious activity** - Contact support if compromised
5. **Update password regularly** - Every 90 days recommended
6. **Enable 2FA** - When available

## Troubleshooting

### "Invalid JSON" Error
- Ensure request body is valid JSON
- Check Content-Type header is application/json

### "Validation Error"
- Check all required fields are present
- Validate email format
- Verify password meets requirements

### "Rate Limited"
- Wait for the retry-after period
- Use X-RateLimit-Reset header to check when limit resets
- For repeated issues, report abuse to support

### "Account Locked"
- Account auto-unlocks after lockout duration
- Check X-RateLimit-Reset header for unlock time
- Contact support if locked account is not yours

### Password Strength Issues
- Use 12+ characters
- Include uppercase, lowercase, numbers, special chars
- Avoid dictionary words and personal information
- Check the password strength feedback for specific issues

## Compliance

This system implements security measures aligned with:
- **OWASP Top 10**: Protection against common vulnerabilities
- **NIST Guidelines**: Password and session management
- **GDPR**: User data protection and audit logging
- **SOC 2**: Security controls and monitoring

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - TOTP (Time-based One-Time Password)
   - Email-based 2FA
   - SMS-based 2FA

2. **Biometric Authentication**
   - WebAuthn/FIDO2
   - Fingerprint recognition
   - Face recognition

3. **Advanced Threat Detection**
   - Machine learning for anomaly detection
   - Behavioral analysis
   - Adaptive authentication

4. **External Integrations**
   - Sentry for error tracking
   - Datadog for audit logs
   - Google Safe Browsing for IP reputation

## Support

For security issues or questions:
- Report vulnerabilities privately to security@studentssocial.app
- Check `/docs/SECURITY.md` for implementation details
- Review audit logs for suspicious activity
- Contact support for account recovery assistance

---

**Last Updated**: May 2026
**Security Level**: Enterprise
**Compliance**: OWASP, NIST, GDPR, SOC 2
