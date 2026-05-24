# 🔐 Authentication Quick Start

## What Changed?

Your authentication system has been completely rebuilt with enterprise-grade security. All 400 Bad Request errors are now fixed with specific error codes.

---

## 🚀 Quick Setup

### 1. Environment Variables
```bash
# Copy example file
cp .env.example .env.local

# Generate secure secrets
JWT_SIGNING_KEY=$(openssl rand -base64 32)
APPWRITE_SESSION_COOKIE_SECRET=$(openssl rand -base64 32)

# Add to .env.local
echo "JWT_SIGNING_KEY=$JWT_SIGNING_KEY" >> .env.local
echo "APPWRITE_SESSION_COOKIE_SECRET=$APPWRITE_SESSION_COOKIE_SECRET" >> .env.local
```

### 2. Run Dev Server
```bash
pnpm dev
```

---

## 🧪 Test It

### Valid Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

# Response (201):
# {"success": true, "userId": "...", "email": "test@example.com"}
```

### Invalid Password
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "name": "Test"
  }'

# Response (400):
# {"error": "Password does not meet security requirements", "code": "WEAK_PASSWORD"}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Response (200):
# {"success": true, "accessToken": "...", "userId": "..."}
```

### Validate Session
```bash
curl -X GET http://localhost:3000/api/auth/validate-session \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Response (200):
# {"success": true, "userId": "...", "email": "test@example.com"}
```

---

## 📋 Password Requirements

✅ **Valid**: `SecurePass123!` (12 chars, uppercase, lowercase, number, special)
❌ **Invalid**: `weak` (too short, missing requirements)

Requirements:
- **Minimum 12 characters**
- **Uppercase letter** (A-Z)
- **Lowercase letter** (a-z)
- **Number** (0-9)
- **Special character** (!@#$%^&*...)

---

## 🛡️ Security Features

| Feature | What It Does |
|---------|-------------|
| **Rate Limiting** | 5 registration attempts per hour per IP |
| **Account Lockout** | 5 failed logins = 15-60 min lockout |
| **JWT Tokens** | Secure 30-minute sessions |
| **Device Fingerprinting** | Detects new devices |
| **Password Validation** | Enforces strong passwords |
| **Breach Detection** | Blocks common passwords |
| **Audit Logging** | Tracks all auth events |

---

## ⚠️ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `WEAK_PASSWORD` | Password doesn't meet requirements | Use 12+ chars with uppercase, lowercase, number, special char |
| `USER_EXISTS` | Email already registered | Use different email |
| `INVALID_CREDENTIALS` | Wrong password | Verify password is correct |
| `ACCOUNT_LOCKED` | 5 failed login attempts | Wait 15 minutes for auto-unlock |
| `RATE_LIMITED` | Too many attempts | Wait for rate limit window to expire |

---

## 📚 Full Documentation

- **`AUTH_FIXES_COMPLETE.md`** - Complete overview
- **`docs/SECURITY.md`** - Security implementation details
- **`docs/TESTING_AUTH.md`** - Testing examples and scenarios
- **`docs/AUTH_IMPLEMENTATION_SUMMARY.md`** - Implementation details
- **`.env.example`** - All configuration options

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/validate-session` | Verify JWT token |
| POST | `/api/auth/refresh-token` | Get new token |

---

## 📞 Need Help?

1. Check the full documentation:
   - `AUTH_FIXES_COMPLETE.md` (overview)
   - `docs/SECURITY.md` (detailed guide)
   - `docs/TESTING_AUTH.md` (examples)

2. Check error response:
   - `code` field has error type
   - `details` field has additional info
   - `errorId` for support tracking

3. Monitor audit logs:
   - Check `/lib/auth-audit.ts` for logging implementation
   - All auth events are logged with IP, timestamp, user-agent

---

**Version**: 1.0.0 Production Ready
**Status**: ✅ Complete
**Security Level**: Enterprise Grade
