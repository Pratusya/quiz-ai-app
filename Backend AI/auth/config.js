/**
 * Authentication Configuration
 * Centralized configuration for JWT and OAuth providers
 */

require("dotenv").config();

module.exports = {
  // JWT Configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "your-super-secure-jwt-secret-key-change-in-production",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "your-super-secure-refresh-secret-key-change-in-production",
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    issuer: "quiz-ai",
    audience: "quiz-ai-users",
  },

  // Password Hashing Configuration
  bcrypt: {
    saltRounds: 12,
  },

  // OAuth Providers Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:5000/api/auth/google/callback",
      scopes: ["openid", "profile", "email"],
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri:
        process.env.GITHUB_REDIRECT_URI ||
        "http://localhost:5000/api/auth/github/callback",
      scopes: ["user:email", "read:user"],
    },
  },

  // SMS/Phone Authentication Configuration
  // Phone OTP is handled by Firebase (client-side) - 10K free/month
  sms: {
    provider: process.env.SMS_PROVIDER || "dev", // dev mode (Firebase handles OTP)
    otpExpiry: 5 * 60 * 1000, // 5 minutes
    otpLength: 6,
    maxAttempts: 3,
  },

  // Security Configuration
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: true,
    tokenBlacklistEnabled: true,
  },

  // Frontend URLs
  frontend: {
    baseUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    loginSuccessRedirect: "/",
    loginFailureRedirect: "/login?error=auth_failed",
  },
};
