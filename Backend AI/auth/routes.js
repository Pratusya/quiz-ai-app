/**
 * Authentication Routes
 * Complete authentication API with local and OAuth authentication
 */

const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const config = require("./config");
const jwtUtils = require("./jwtUtils");
const passwordUtils = require("./passwordUtils");
const oauthProviders = require("./oauthProviders");
const smsUtils = require("./smsUtils");
const emailUtils = require("./emailUtils");
const {
  authenticate,
  optionalAuth,
  trackFailedLogin,
  isLockedOut,
  resetLoginAttempts,
} = require("./middleware");

// Database adapter will be injected
let db = null;
let dbType = null;

/**
 * Initialize auth routes with database connection
 */
function initAuthRoutes(database, type) {
  db = database;
  dbType = type;
  return router;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Find user by email
 */
async function findUserByEmail(email) {
  const query =
    dbType === "postgres"
      ? "SELECT * FROM auth_users WHERE email = $1"
      : "SELECT * FROM auth_users WHERE email = ?";

  if (dbType === "postgres") {
    const result = await db.query(query, [email]);
    return result.rows[0];
  } else {
    return db.prepare(query).get(email);
  }
}

/**
 * Find user by ID
 */
async function findUserById(id) {
  const query =
    dbType === "postgres"
      ? "SELECT * FROM auth_users WHERE id = $1"
      : "SELECT * FROM auth_users WHERE id = ?";

  if (dbType === "postgres") {
    const result = await db.query(query, [id]);
    return result.rows[0];
  } else {
    return db.prepare(query).get(id);
  }
}

/**
 * Find user by OAuth provider
 */
async function findUserByOAuth(provider, providerId) {
  const query =
    dbType === "postgres"
      ? "SELECT * FROM auth_users WHERE oauth_provider = $1 AND oauth_provider_id = $2"
      : "SELECT * FROM auth_users WHERE oauth_provider = ? AND oauth_provider_id = ?";

  if (dbType === "postgres") {
    const result = await db.query(query, [provider, providerId]);
    return result.rows[0];
  } else {
    return db.prepare(query).get(provider, providerId);
  }
}

/**
 * Create new user
 */
async function createUser(userData) {
  const {
    email,
    username,
    password_hash,
    oauth_provider,
    oauth_provider_id,
    avatar_url,
    email_verified,
  } = userData;

  const query =
    dbType === "postgres"
      ? `INSERT INTO auth_users (email, username, password_hash, oauth_provider, oauth_provider_id, avatar_url, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`
      : `INSERT INTO auth_users (email, username, password_hash, oauth_provider, oauth_provider_id, avatar_url, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`;

  if (dbType === "postgres") {
    const result = await db.query(query, [
      email,
      username,
      password_hash,
      oauth_provider,
      oauth_provider_id,
      avatar_url,
      email_verified ? 1 : 0,
    ]);
    return result.rows[0];
  } else {
    const stmt = db.prepare(query);
    const info = stmt.run(
      email,
      username,
      password_hash,
      oauth_provider,
      oauth_provider_id,
      avatar_url,
      email_verified ? 1 : 0
    );
    return findUserById(info.lastInsertRowid);
  }
}

/**
 * Update user
 */
async function updateUser(id, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (dbType === "postgres") {
      fields.push(`${key} = $${paramIndex}`);
    } else {
      fields.push(`${key} = ?`);
    }
    values.push(value);
    paramIndex++;
  }

  // Add updated_at
  if (dbType === "postgres") {
    fields.push(`updated_at = $${paramIndex}`);
  } else {
    fields.push("updated_at = ?");
  }
  values.push(new Date().toISOString());
  paramIndex++;

  // Add ID
  values.push(id);

  const query =
    dbType === "postgres"
      ? `UPDATE auth_users SET ${fields.join(
          ", "
        )} WHERE id = $${paramIndex} RETURNING *`
      : `UPDATE auth_users SET ${fields.join(", ")} WHERE id = ?`;

  if (dbType === "postgres") {
    const result = await db.query(query, values);
    return result.rows[0];
  } else {
    db.prepare(query).run(...values);
    return findUserById(id);
  }
}

/**
 * Store refresh token
 */
async function storeRefreshToken(userId, tokenHash, expiresAt) {
  const query =
    dbType === "postgres"
      ? `INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`
      : `INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`;

  if (dbType === "postgres") {
    await db.query(query, [
      userId,
      tokenHash,
      new Date(expiresAt).toISOString(),
    ]);
  } else {
    db.prepare(query).run(userId, tokenHash, new Date(expiresAt).toISOString());
  }
}

/**
 * Remove user's public data (password, etc)
 */
function sanitizeUser(user) {
  if (!user) return null;
  const {
    password_hash,
    reset_token_hash,
    verification_token_hash,
    ...safeUser
  } = user;
  return safeUser;
}

// ==================== REGISTRATION ====================

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post("/register", async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Validate required fields
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: "Email, username, and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate username
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        error: "Username must be between 3 and 30 characters",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Confirm passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match",
      });
    }

    // Validate password strength
    const passwordValidation = passwordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password does not meet requirements",
        details: passwordValidation.errors,
      });
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists",
      });
    }

    // Hash password
    const password_hash = await passwordUtils.hashPassword(password);

    // Generate email verification token
    const verificationData = passwordUtils.generateVerificationToken();

    // Create user
    const user = await createUser({
      email: email.toLowerCase(),
      username,
      password_hash,
      oauth_provider: null,
      oauth_provider_id: null,
      avatar_url: null,
      email_verified: false,
    });

    // Store verification token
    await updateUser(user.id, {
      verification_token_hash: verificationData.hash,
      verification_token_expires: new Date(
        verificationData.expiresAt
      ).toISOString(),
    });

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);

    // Send verification email
    const emailResult = await emailUtils.sendVerificationEmail(
      email,
      username,
      verificationData.token
    );

    if (emailResult.devMode) {
      console.log(
        `[DEV MODE] Verification token for ${email}: ${verificationData.token}`
      );
    }

    res.status(201).json({
      success: true,
      message: emailResult.devMode
        ? "Account created! Check console for verification token (dev mode)."
        : "Account created successfully. Please check your email for verification.",
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      // Include token in dev mode only
      ...(emailResult.devMode && { verificationToken: verificationData.token }),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create account",
    });
  }
});

// ==================== LOGIN ====================

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Check for lockout
    const lockout = isLockedOut(email.toLowerCase());
    if (lockout.locked) {
      return res.status(429).json({
        success: false,
        error: `Too many login attempts. Please try again in ${lockout.remainingMinutes} minutes.`,
        code: "ACCOUNT_LOCKED",
      });
    }

    // Find user
    const user = await findUserByEmail(email.toLowerCase());

    if (!user) {
      trackFailedLogin(email.toLowerCase());
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check if user has password (might be OAuth only)
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error:
          "This account uses social login. Please sign in with your social account.",
        oauth_provider: user.oauth_provider,
      });
    }

    // Verify password
    const isValidPassword = await passwordUtils.verifyPassword(
      password,
      user.password_hash
    );

    if (!isValidPassword) {
      const attempts = trackFailedLogin(email.toLowerCase());
      const remaining = config.security.maxLoginAttempts - attempts.count;

      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        attemptsRemaining: remaining > 0 ? remaining : 0,
      });
    }

    // Reset failed login attempts
    resetLoginAttempts(email.toLowerCase());

    // Update last login
    await updateUser(user.id, { last_login: new Date().toISOString() });

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);

    res.json({
      success: true,
      message: "Login successful",
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

// ==================== TOKEN REFRESH ====================

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    // Verify refresh token
    const result = jwtUtils.verifyRefreshToken(refreshToken);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error,
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    // Get user
    const user = await findUserById(result.payload.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Revoke old refresh token
    jwtUtils.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = jwtUtils.generateAccessToken(user);
    const newRefreshToken = jwtUtils.generateRefreshToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Token refresh failed",
    });
  }
});

// ==================== LOGOUT ====================

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
router.post("/logout", authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Revoke access token
    jwtUtils.revokeAccessToken(req.token);

    // Revoke refresh token if provided
    if (refreshToken) {
      jwtUtils.revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post("/logout-all", authenticate, async (req, res) => {
  try {
    // Revoke all refresh tokens for this user
    jwtUtils.revokeAllUserTokens(req.user.id);

    res.json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
});

// ==================== CURRENT USER ====================

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
});

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
router.patch("/me", authenticate, async (req, res) => {
  try {
    const { username, avatar_url, email, phone_number } = req.body;
    const updates = {};

    if (username) {
      // Validate username
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
          success: false,
          error: "Username must be between 3 and 30 characters",
        });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          error: "Username can only contain letters, numbers, and underscores",
        });
      }
      updates.username = username;
    }

    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    // Handle email update
    if (email && email !== req.user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }

      // Check if email is already in use
      const existingUser = await findUserByEmail(email.toLowerCase());
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          error: "Email is already in use",
        });
      }

      updates.email = email.toLowerCase();
      updates.email_verified = 0; // Reset email verification
    }

    // Handle phone number update
    if (phone_number !== undefined) {
      if (phone_number) {
        // Normalize phone number
        let normalizedPhone = phone_number.replace(/[^\d+]/g, "");
        if (!normalizedPhone.startsWith("+")) {
          if (normalizedPhone.startsWith("0")) {
            normalizedPhone = normalizedPhone.substring(1);
          }
          normalizedPhone = "+91" + normalizedPhone;
        }

        // Check if phone is already in use
        const existingPhone = await findUserByPhone(normalizedPhone);
        if (existingPhone && existingPhone.id !== req.user.id) {
          return res.status(400).json({
            success: false,
            error: "Phone number is already in use",
          });
        }

        updates.phone_number = normalizedPhone;
        updates.phone_verified = 0; // Reset phone verification
      } else {
        updates.phone_number = null;
        updates.phone_verified = 0;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid fields to update",
      });
    }

    const user = await updateUser(req.user.id, updates);

    res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
});

// ==================== PASSWORD MANAGEMENT ====================

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "New passwords do not match",
      });
    }

    // Validate new password strength
    const passwordValidation =
      passwordUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "New password does not meet requirements",
        details: passwordValidation.errors,
      });
    }

    // Get user
    const user = await findUserById(req.user.id);

    // Check if user has password
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        error: "Cannot change password for social login accounts",
      });
    }

    // Verify current password
    const isValidPassword = await passwordUtils.verifyPassword(
      currentPassword,
      user.password_hash
    );
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const password_hash = await passwordUtils.hashPassword(newPassword);

    // Update password
    await updateUser(user.id, { password_hash });

    // Revoke all refresh tokens (force re-login on other devices)
    jwtUtils.revokeAllUserTokens(user.id);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const user = await findUserByEmail(email.toLowerCase());

    // Always return success to prevent email enumeration
    if (!user || !user.password_hash) {
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetData = passwordUtils.generateResetToken();

    // Store reset token
    await updateUser(user.id, {
      reset_token_hash: resetData.hash,
      reset_token_expires: new Date(resetData.expiresAt).toISOString(),
    });

    // Send password reset email
    const emailResult = await emailUtils.sendPasswordResetEmail(
      user.email,
      user.username,
      resetData.token
    );

    if (emailResult.devMode) {
      console.log(
        `[DEV MODE] Password reset token for ${email}: ${resetData.token}`
      );
    }

    res.json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent.",
      // Include token in dev mode only
      ...(emailResult.devMode && { resetToken: resetData.token }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process request",
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match",
      });
    }

    // Validate password strength
    const passwordValidation =
      passwordUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Password does not meet requirements",
        details: passwordValidation.errors,
      });
    }

    // Find user with valid reset token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const query =
      dbType === "postgres"
        ? `SELECT * FROM auth_users WHERE reset_token_hash = $1 AND reset_token_expires > $2`
        : `SELECT * FROM auth_users WHERE reset_token_hash = ? AND reset_token_expires > ?`;

    let user;
    if (dbType === "postgres") {
      const result = await db.query(query, [
        tokenHash,
        new Date().toISOString(),
      ]);
      user = result.rows[0];
    } else {
      user = db.prepare(query).get(tokenHash, new Date().toISOString());
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const password_hash = await passwordUtils.hashPassword(newPassword);

    // Update password and clear reset token
    await updateUser(user.id, {
      password_hash,
      reset_token_hash: null,
      reset_token_expires: null,
    });

    // Revoke all tokens
    jwtUtils.revokeAllUserTokens(user.id);

    res.json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
});

// ==================== EMAIL VERIFICATION ====================

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    // Find user with valid verification token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const query =
      dbType === "postgres"
        ? `SELECT * FROM auth_users WHERE verification_token_hash = $1 AND verification_token_expires > $2`
        : `SELECT * FROM auth_users WHERE verification_token_hash = ? AND verification_token_expires > ?`;

    let user;
    if (dbType === "postgres") {
      const result = await db.query(query, [
        tokenHash,
        new Date().toISOString(),
      ]);
      user = result.rows[0];
    } else {
      user = db.prepare(query).get(tokenHash, new Date().toISOString());
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
      });
    }

    // Mark email as verified
    await updateUser(user.id, {
      email_verified: dbType === "postgres" ? true : 1,
      verification_token_hash: null,
      verification_token_expires: null,
    });

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email",
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post("/resend-verification", authenticate, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationData = passwordUtils.generateVerificationToken();

    // Store verification token
    await updateUser(user.id, {
      verification_token_hash: verificationData.hash,
      verification_token_expires: new Date(
        verificationData.expiresAt
      ).toISOString(),
    });

    // Send verification email
    const emailResult = await emailUtils.sendVerificationEmail(
      user.email,
      user.username,
      verificationData.token
    );

    if (emailResult.devMode) {
      console.log(
        `[DEV MODE] Verification token for ${user.email}: ${verificationData.token}`
      );
    }

    res.json({
      success: true,
      message: emailResult.devMode
        ? "Verification token logged to console (dev mode)"
        : "Verification email sent successfully",
      // Include token in dev mode only
      ...(emailResult.devMode && { verificationToken: verificationData.token }),
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send verification email",
    });
  }
});

// ==================== OAUTH ROUTES ====================

// State storage for CSRF protection
const oauthStates = new Map();

/**
 * GET /api/auth/:provider
 * Redirect to OAuth provider
 */
router.get("/:provider(google|github)", (req, res) => {
  try {
    const { provider } = req.params;

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");
    oauthStates.set(state, {
      provider,
      createdAt: Date.now(),
      redirectTo: req.query.redirect || "/",
    });

    // Clean up old states
    for (const [key, value] of oauthStates.entries()) {
      if (Date.now() - value.createdAt > 10 * 60 * 1000) {
        // 10 minutes
        oauthStates.delete(key);
      }
    }

    // Get OAuth URL
    const authUrl = oauthProviders.getOAuthUrl(provider, state);

    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("OAuth redirect error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate OAuth",
    });
  }
});

/**
 * GET /api/auth/:provider/callback
 * Handle OAuth callback
 */
router.get("/:provider(google|github)/callback", async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error: oauthError } = req.query;

    // Check for OAuth error
    if (oauthError) {
      return res.redirect(
        `${config.frontend.baseUrl}/login?error=oauth_denied`
      );
    }

    // Verify state
    const stateData = oauthStates.get(state);
    if (!stateData || stateData.provider !== provider) {
      return res.redirect(
        `${config.frontend.baseUrl}/login?error=invalid_state`
      );
    }
    oauthStates.delete(state);

    // Exchange code for tokens and get user info
    const { userInfo } = await oauthProviders.handleOAuthCallback(
      provider,
      code
    );

    // Find or create user
    let user = await findUserByOAuth(provider, userInfo.providerId);

    if (!user) {
      // Check if email already exists
      if (userInfo.email) {
        const existingUser = await findUserByEmail(
          userInfo.email.toLowerCase()
        );

        if (existingUser) {
          // Link OAuth to existing account
          user = await updateUser(existingUser.id, {
            oauth_provider: provider,
            oauth_provider_id: userInfo.providerId,
            avatar_url: existingUser.avatar_url || userInfo.avatar,
          });
        }
      }

      if (!user) {
        // Create new user
        user = await createUser({
          email: userInfo.email?.toLowerCase() || null,
          username:
            userInfo.username ||
            userInfo.name?.replace(/\s+/g, "_").toLowerCase() ||
            `user_${Date.now()}`,
          password_hash: null,
          oauth_provider: provider,
          oauth_provider_id: userInfo.providerId,
          avatar_url: userInfo.avatar,
          email_verified: userInfo.emailVerified,
        });
      }
    } else {
      // Update avatar if changed
      if (userInfo.avatar && userInfo.avatar !== user.avatar_url) {
        user = await updateUser(user.id, { avatar_url: userInfo.avatar });
      }
    }

    // Update last login
    await updateUser(user.id, { last_login: new Date().toISOString() });

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);

    // Redirect to frontend with tokens
    const redirectUrl = new URL("/auth/callback", config.frontend.baseUrl);
    redirectUrl.searchParams.set("accessToken", accessToken);
    redirectUrl.searchParams.set("refreshToken", refreshToken);
    redirectUrl.searchParams.set("redirect", stateData.redirectTo);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`${config.frontend.baseUrl}/login?error=oauth_failed`);
  }
});

// ==================== DELETE ACCOUNT ====================

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete("/account", authenticate, async (req, res) => {
  try {
    const { password, confirmDelete } = req.body;

    if (confirmDelete !== "DELETE") {
      return res.status(400).json({
        success: false,
        error: "Please type DELETE to confirm account deletion",
      });
    }

    const user = await findUserById(req.user.id);

    // If user has password, verify it
    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Password is required to delete account",
        });
      }

      const isValidPassword = await passwordUtils.verifyPassword(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Incorrect password",
        });
      }
    }

    // Revoke all tokens
    jwtUtils.revokeAllUserTokens(user.id);

    // Delete user
    const deleteQuery =
      dbType === "postgres"
        ? "DELETE FROM auth_users WHERE id = $1"
        : "DELETE FROM auth_users WHERE id = ?";

    if (dbType === "postgres") {
      await db.query(deleteQuery, [user.id]);
    } else {
      db.prepare(deleteQuery).run(user.id);
    }

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete account",
    });
  }
});

module.exports = { router, initAuthRoutes };
