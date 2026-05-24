# Authentication System Testing Guide

## Quick Start

The authentication system is now enterprise-grade with comprehensive error handling and security features.

### Test Registration

1. Navigate to `/register`
2. Fill in the form with:
   - **Name**: Your full name
   - **Email**: test@example.com
   - **Password**: Must be 12+ chars with uppercase, lowercase, number, and special char
   - Example: `SecurePass123!`

3. **Expected Behaviors**:
   - ✅ Valid input → Registration successful (201)
   - ❌ Weak password → "Password does not meet security requirements"
   - ❌ Invalid email → "Email address is not valid"
   - ❌ Duplicate email → "An account with this email already exists"
   - ❌ Rate limit (5+ attempts/hour) → "Too many registration attempts"

### Test Login

1. Navigate to `/login`
2. Fill in the form with:
   - **Email**: test@example.com (from registration)
   - **Password**: SecurePass123!

3. **Expected Behaviors**:
   - ✅ Valid credentials → Login successful with JWT token (200)
   - ❌ Wrong password → "Invalid email or password"
   - ❌ 5 failed attempts → "Account is temporarily locked"
   - ❌ Rate limit (5+ failures/15min) → "Too many login attempts from this IP"

## Detailed Testing Scenarios

### Scenario 1: Valid Registration Flow

```bash
# 1. Valid Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePassword123!",
    "name": "Alice Smith"
  }'

# Expected Response (201):
{
  "success": true,
  "userId": "user_id_123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "message": "Registration successful. Please verify your email."
}
```

### Scenario 2: Weak Password Detection

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "weak",
    "name": "Bob Jones"
  }'

# Expected Response (400):
{
  "success": false,
  "error": "Password does not meet security requirements",
  "code": "WEAK_PASSWORD",
  "timestamp": "2026-05-24T14:45:00.000Z",
  "details": {
    "feedback": [
      "Password must be at least 12 characters long",
      "Password must contain at least one uppercase letter",
      "Password must contain at least one number",
      "Password must contain at least one special character"
    ]
  }
}
```

### Scenario 3: Valid Login Flow

```bash
# 1. Successful Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }'

# Expected Response (200):
{
  "success": true,
  "userId": "user_id_123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "sessionId": "session_id_456",
  "accessToken": "eyJhbGc...",
  "expiresIn": 1800,
  "message": "Login successful"
}

# Note: Session cookie also set:
# Set-Cookie: peerspark_session=encoded_value; HttpOnly; Secure; SameSite=Strict
```

### Scenario 4: Account Lockout After Failed Attempts

```bash
# Attempt 1 (wrong password)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "wrong1"}'
# Response: 401 INVALID_CREDENTIALS, remaining: 4

# Attempt 2-4 (wrong password)
# Same as above...

# Attempt 5 (wrong password)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "wrong5"}'

# Expected Response (429):
{
  "success": false,
  "error": "Account is temporarily locked due to too many failed attempts",
  "code": "ACCOUNT_LOCKED",
  "lockedUntil": "2026-05-24T15:00:00.000Z",
  "errorId": "auth_1234567890_abc123",
  "timestamp": "2026-05-24T14:45:00.000Z"
}

# Subsequent attempts will get same response until lockout expires
```

### Scenario 5: Rate Limiting on Registration

```bash
# Execute registration 5+ times in < 1 hour from same IP

# 6th Request:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user6@example.com",
    "password": "SecurePassword123!",
    "name": "User Six"
  }'

# Expected Response (429):
{
  "success": false,
  "error": "Too many registration attempts. Please try again later.",
  "code": "RATE_LIMITED",
  "timestamp": "2026-05-24T14:45:00.000Z",
  "details": {
    "retryAfter": 3600
  }
}

# Response Headers:
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 2026-05-24T15:45:00.000Z
# Retry-After: 3600
```

### Scenario 6: Session Validation

```bash
# Get access token from login response
TOKEN="eyJhbGc..."

# Validate session
curl -X GET http://localhost:3000/api/auth/validate-session \
  -H "Authorization: Bearer ${TOKEN}"

# Expected Response (200):
{
  "success": true,
  "userId": "user_id_123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "sessionId": "session_id_456",
  "isNewDevice": false,
  "expiresAt": "2026-05-24T15:15:00.000Z",
  "timestamp": "2026-05-24T14:45:00.000Z"
}
```

### Scenario 7: Token Refresh

```bash
# Refresh access token
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Authorization: Bearer ${TOKEN}"

# Expected Response (200):
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "expiresIn": 1800,
  "tokenType": "Bearer",
  "timestamp": "2026-05-24T14:45:00.000Z"
}
```

### Scenario 8: Logout

```bash
# Logout and invalidate token
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer ${TOKEN}"

# Expected Response (200):
{
  "success": true,
  "message": "Logout successful",
  "userId": "user_id_123",
  "timestamp": "2026-05-24T14:45:00.000Z"
}

# Effects:
# - JWT token added to blacklist
# - Session cookie cleared
# - Appwrite session deleted
```

### Scenario 9: Invalid Token After Logout

```bash
# Try to use invalidated token
curl -X GET http://localhost:3000/api/auth/validate-session \
  -H "Authorization: Bearer ${INVALID_TOKEN}"

# Expected Response (401):
{
  "success": false,
  "error": "Token has been revoked",
  "code": "BLACKLISTED_TOKEN",
  "errorId": "auth_1234567890_def456",
  "timestamp": "2026-05-24T14:46:00.000Z"
}
```

## Password Strength Testing

### Valid Passwords (Will Pass)
- `Secure123!Pass` (12 chars, mixed case, numbers, special)
- `MyPassword456@` (13 chars, mixed case, numbers, special)
- `C0mplex#Pwd_Secure` (18 chars, comprehensive)
- `Test@1234567` (12 chars, minimal but valid)

### Invalid Passwords (Will Fail)
- `short` (too short)
- `nouppercase123!` (missing uppercase)
- `NOLOWERCASE123!` (missing lowercase)
- `NoNumbers!` (missing numbers)
- `NoSpecial123` (missing special characters)
- `password123` (matches common pattern)

## Error Codes Reference

### Registration Errors
- `INVALID_JSON` (400): Malformed JSON in request
- `VALIDATION_ERROR` (400): Missing or invalid fields
- `INVALID_EMAIL` (400): Invalid email format
- `WEAK_PASSWORD` (400): Password doesn't meet requirements
- `PASSWORD_BREACHED` (400): Password found in breach database
- `USER_EXISTS` (400): Email already registered
- `RATE_LIMITED` (429): Too many registration attempts
- `AUTH_ENV_MISSING` (500): Server misconfiguration

### Login Errors
- `INVALID_JSON` (400): Malformed JSON in request
- `VALIDATION_ERROR` (400): Missing or invalid fields
- `INVALID_CREDENTIALS` (401): Wrong email or password
- `ACCOUNT_LOCKED` (429): Account locked after failed attempts
- `RATE_LIMITED` (429): Too many login attempts
- `USER_NOT_FOUND` (401): User doesn't exist
- `SERVER_CONFIG_ERROR` (500): Server misconfiguration

### Session Errors
- `NO_TOKEN` (401): Missing authorization header
- `INVALID_TOKEN` (401): Malformed or expired token
- `BLACKLISTED_TOKEN` (401): Token has been revoked
- `USER_NOT_FOUND` (401): User no longer exists

## Browser Developer Tools Debugging

### Check Request/Response
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "register", "login", "validate-session", etc.
4. Click the request to view:
   - Request body
   - Response body
   - Status code
   - Headers (including X-RateLimit-*)

### Check Cookies
1. Open DevTools (F12)
2. Go to Application tab
3. Click Cookies → http://localhost:3000
4. Look for `peerspark_session` (should be HttpOnly, Secure, SameSite=Strict)

### Check Local Storage
1. Open DevTools (F12)
2. Go to Application tab
3. Click Local Storage → http://localhost:3000
4. Check for any auth-related keys

## Performance Benchmarks

Expected response times:
- Register (valid): 100-200ms
- Register (weak password): 50-100ms
- Login (valid): 80-150ms
- Login (invalid credentials): 80-150ms
- Session validation: 50-100ms
- Token refresh: 50-100ms

## Monitoring & Logging

### Console Logs (Development)
Watch for `[v0]` prefixed logs:
```
[v0] Attempting to create user: test@example.com
[v0] User created successfully: user_id_123
[v0] Session created for user: user_id_123
[v0] Login failed for user: user_id_123
[v0] User logged out from IP: 192.168.1.1
```

### Audit Logs
Check audit trail for suspicious activity:
- Multiple registrations from same IP
- Multiple failed logins
- Account lockouts
- New device logins
- Brute force patterns

## Troubleshooting

### Issue: "Registration failed with 400"
**Solution**: Check the response `code` field:
- `WEAK_PASSWORD`: Follow password requirements (12 chars, mixed case, numbers, special)
- `INVALID_EMAIL`: Use valid email format (user@example.com)
- `USER_EXISTS`: Email already registered
- `RATE_LIMITED`: Wait before trying again

### Issue: "Account locked after login attempt"
**Solution**: 
- Account auto-unlocks after 15 minutes
- Check `lockedUntil` field in response for exact time
- Use correct password next time

### Issue: "Invalid token" error
**Solution**:
- Token expires after 30 minutes
- Use refresh-token endpoint to get new token
- Check that token is in Authorization header as "Bearer {token}"

### Issue: "Too many attempts" error
**Solution**:
- Rate limits reset after window expires (check `X-RateLimit-Reset` header)
- Registration: 5 per hour per IP
- Login: 5 per 15 minutes per IP
- Use different IP or wait for window to expire

## Security Testing

### Test CSRF Protection
```bash
# Attempt without CSRF token (if required)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Pass123!", "name": "Test"}'
# Should still work (CSRF per-endpoint depends on implementation)
```

### Test Security Headers
```bash
curl -I http://localhost:3000/api/auth/register

# Should include:
# Cache-Control: no-store, no-cache, must-revalidate
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
```

### Test HTTPS Requirement
- Production should enforce HTTPS
- Cookies should have Secure flag in production
- Verify with curl -k for self-signed certs

## Load Testing

Use Apache Bench or Artillery for load testing:

```bash
# Simple load test (10 concurrent, 100 requests)
ab -c 10 -n 100 -p data.json \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/auth/login

# Note: Rate limiting will kick in
# Expected to see some 429 responses
```

## Automation Testing

For automated testing, use Jest, Cypress, or Playwright:

```javascript
// Example Cypress test
describe('Authentication', () => {
  it('should register a new user', () => {
    cy.visit('/register')
    cy.get('input[name="name"]').type('Test User')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('SecurePass123!')
    cy.get('button').contains('Create Account').click()
    cy.url().should('include', '/verify-email')
  })

  it('should login with valid credentials', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('SecurePass123!')
    cy.get('button').contains('Sign In').click()
    cy.url().should('include', '/dashboard')
  })

  it('should lock account after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      cy.visit('/login')
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('wrong_password')
      cy.get('button').contains('Sign In').click()
    }
    cy.get('[role="alert"]').should('contain', 'temporarily locked')
  })
})
```

---

**Last Updated**: May 24, 2026
**Version**: 1.0.0
**Status**: Production Ready
