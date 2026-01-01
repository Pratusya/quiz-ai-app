/**
 * Password Utilities
 * Secure password hashing, validation, and verification
 */

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const config = require("./config");

/**
 * Validate password strength
 * Returns an object with isValid boolean and array of errors
 */
function validatePasswordStrength(password) {
  const errors = [];
  const { security } = config;

  if (!password || typeof password !== "string") {
    return { isValid: false, errors: ["Password is required"] };
  }

  if (password.length < security.passwordMinLength) {
    errors.push(
      `Password must be at least ${security.passwordMinLength} characters long`
    );
  }

  if (security.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (security.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (security.passwordRequireNumber && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (
    security.passwordRequireSpecial &&
    !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password",
    "123456",
    "12345678",
    "qwerty",
    "abc123",
    "password1",
    "admin",
    "letmein",
    "welcome",
    "monkey",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push(
      "This password is too common. Please choose a stronger password"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordStrength(password) {
  let score = 0;

  if (!password) return 0;

  // Length score
  score += Math.min(password.length * 4, 40);

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score += 15;

  // Bonus for mixed characters
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 2, 15);

  return Math.min(score, 100);
}

/**
 * Hash password securely using bcrypt
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate password reset token
 */
function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

  return {
    token, // Send this to the user
    hash, // Store this in database
    expiresAt,
  };
}

/**
 * Verify reset token
 */
function verifyResetToken(token, storedHash) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return hash === storedHash;
}

/**
 * Generate email verification token
 */
function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

  return {
    token, // Send this to the user
    hash, // Store this in database
    expiresAt,
  };
}

/**
 * Verify email verification token
 */
function verifyEmailToken(token, storedHash) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return hash === storedHash;
}

module.exports = {
  validatePasswordStrength,
  calculatePasswordStrength,
  hashPassword,
  verifyPassword,
  generateResetToken,
  verifyResetToken,
  generateVerificationToken,
  verifyEmailToken,
};
