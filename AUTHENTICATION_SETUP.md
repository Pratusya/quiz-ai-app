# 🔐 Custom Authentication System Setup Guide

This guide explains how to set up and configure the custom authentication system that replaces Clerk.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [OAuth Configuration](#oauth-configuration)
6. [Security Features](#security-features)
7. [API Reference](#api-reference)

---

## Overview

The Quiz AI application now uses a custom-built authentication system with the following capabilities:

- Email/password authentication with secure hashing
- OAuth 2.0 social login (Google, GitHub, Facebook)
- JWT-based sessions with access and refresh tokens
- Password strength validation
- Account lockout protection
- Email verification (email sending needs to be configured)

---

## Features

### 🔑 Authentication Methods

- **Email/Password**: Traditional registration and login
- **Google OAuth**: Sign in with Google account
- **GitHub OAuth**: Sign in with GitHub account
- **Facebook OAuth**: Sign in with Facebook account

### 🛡️ Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Short-lived access tokens (15min), long-lived refresh tokens (7 days)
- **Token Blacklisting**: Revoke tokens on logout
- **Rate Limiting**: Prevent brute force attacks
- **Account Lockout**: 5 failed attempts = 15 min lockout
- **CSRF Protection**: State parameter for OAuth flows
- **Security Headers**: XSS, clickjacking, and MIME sniffing protection

### 📋 Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## Backend Setup

### 1. Install Dependencies

```bash
cd "Backend AI"
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```env
# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secure-64-char-secret
JWT_REFRESH_SECRET=your-super-secure-64-char-refresh-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# OAuth (configure as needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... (see .env.example for all options)
```

### 3. Generate Secure JWT Secrets

Run this command to generate secure secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the Server

```bash
npm start
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd "Quiz AI"
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Server

```bash
npm run dev
```

---

## OAuth Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Go to "OAuth consent screen" and configure
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: Quiz AI
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and generate Client Secret
5. Add to `.env`

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app (Consumer type)
3. Add Facebook Login product
4. Go to Facebook Login → Settings
5. Add Valid OAuth Redirect URI: `http://localhost:5000/api/auth/facebook/callback`
6. Copy App ID and App Secret to `.env`

---

## Security Features

### JWT Token Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│ Client  │────►│ Login   │────►│  Server  │
└─────────┘     └─────────┘     └──────────┘
     │                               │
     │◄─────── Access Token ─────────│
     │◄─────── Refresh Token ────────│
     │                               │
     │─── Request + Access Token ───►│
     │                               │
     │◄─────── Response ─────────────│
     │                               │
     │ (Token Expired)               │
     │                               │
     │─── Refresh Token ────────────►│
     │                               │
     │◄─────── New Access Token ─────│
```

### Password Storage

Passwords are hashed using bcrypt with 12 salt rounds, making them computationally expensive to crack.

### Token Blacklisting

When a user logs out, their tokens are added to a blacklist to prevent reuse.

---

## API Reference

### Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

### Change Password

```http
POST /api/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewPass789!",
  "confirmPassword": "NewPass789!"
}
```

### OAuth Login

```http
GET /api/auth/google
GET /api/auth/github
GET /api/auth/facebook
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Delete Account

```http
DELETE /api/auth/account
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "password": "YourPassword123!",
  "confirmDelete": "DELETE"
}
```

---

## Frontend Components

### Available Components

| Component        | Path               | Description                         |
| ---------------- | ------------------ | ----------------------------------- |
| `Login`          | `/login`           | Login page with social options      |
| `Register`       | `/register`        | Registration with password strength |
| `ForgotPassword` | `/forgot-password` | Request password reset              |
| `ResetPassword`  | `/reset-password`  | Reset password with token           |
| `AuthCallback`   | `/auth/callback`   | OAuth redirect handler              |
| `UserDropdown`   | -                  | User menu with logout               |

### Using Auth Context

```jsx
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout, register } =
    useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Welcome, {user.username}!</div>;
}
```

---

## Production Checklist

- [ ] Change JWT secrets to strong random values
- [ ] Configure proper CORS origins
- [ ] Set up HTTPS
- [ ] Configure email service for verification/reset emails
- [ ] Set up proper OAuth redirect URIs for production domain
- [ ] Enable rate limiting on production
- [ ] Set `NODE_ENV=production`
- [ ] Consider using Redis for token blacklist in high-traffic scenarios

---

## Troubleshooting

### "Token expired" errors

The access token expires after 15 minutes. The frontend should automatically refresh it using the refresh token.

### OAuth redirect issues

Make sure the redirect URIs in your OAuth provider settings exactly match the ones in your `.env` file.

### Password validation failures

Ensure passwords meet all requirements: 8+ chars, uppercase, lowercase, number, special character.

### CORS errors

Check that `CLIENT_URL` and `FRONTEND_URL` are correctly set in backend `.env`.

---

## Support

For issues or questions, please open a GitHub issue or check the existing documentation.
