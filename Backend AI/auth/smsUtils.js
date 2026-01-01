/**
 * SMS/Phone Authentication Utilities
 * Handles OTP generation and verification
 *
 * NOTE: Phone OTP is now handled by Firebase on the client-side
 * Firebase gives 10,000 free verifications/month
 * This file provides backup local OTP verification for the backend
 */

const crypto = require("crypto");
const config = require("./config");

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

/**
 * Generate a secure OTP
 */
function generateOTP(length = 6) {
  const digits = "0123456789";
  let otp = "";

  // Use crypto for secure random number generation
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }

  return otp;
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone) {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, "");

  // If no country code, assume India (+91)
  if (!normalized.startsWith("+")) {
    // Remove leading 0 if present
    if (normalized.startsWith("0")) {
      normalized = normalized.substring(1);
    }
    // Add India country code by default
    normalized = "+91" + normalized;
  }

  return normalized;
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  // E.164 format: + followed by 10-15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  return e164Regex.test(normalized);
}

/**
 * Store OTP for verification
 */
function storeOTP(phone, otp) {
  const normalized = normalizePhoneNumber(phone);
  const expiresAt = Date.now() + config.sms.otpExpiry;

  otpStore.set(normalized, {
    otp,
    expiresAt,
    attempts: 0,
  });

  // Auto-cleanup after expiry
  setTimeout(() => {
    otpStore.delete(normalized);
  }, config.sms.otpExpiry + 1000);
}

/**
 * Verify OTP
 */
function verifyOTP(phone, otp) {
  const normalized = normalizePhoneNumber(phone);
  const stored = otpStore.get(normalized);

  if (!stored) {
    return { valid: false, error: "OTP expired or not found" };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalized);
    return { valid: false, error: "OTP has expired" };
  }

  stored.attempts++;

  if (stored.attempts > config.sms.maxAttempts) {
    otpStore.delete(normalized);
    return { valid: false, error: "Too many incorrect attempts" };
  }

  if (stored.otp !== otp) {
    return {
      valid: false,
      error: "Invalid OTP",
      attemptsRemaining: config.sms.maxAttempts - stored.attempts,
    };
  }

  // OTP is valid, remove it
  otpStore.delete(normalized);
  return { valid: true };
}

/**
 * Send OTP (Development mode)
 * Phone OTP is now handled by Firebase on the client-side (10K free/month)
 * This is kept for backward compatibility and testing
 */
async function sendOTP(phone) {
  if (!isValidPhoneNumber(phone)) {
    return { success: false, error: "Invalid phone number format" };
  }

  const otp = generateOTP(config.sms.otpLength);
  const normalized = normalizePhoneNumber(phone);

  // Store OTP locally (for verification)
  storeOTP(normalized, otp);

  // Development mode - log the OTP
  console.log(`[DEV MODE] OTP for ${normalized}: ${otp}`);

  return {
    success: true,
    message:
      "Phone OTP is handled by Firebase. Use client-side Firebase Phone Auth for production.",
    devMode: true,
    // Only include OTP in dev mode for testing
    ...(process.env.NODE_ENV === "development" && { otp }),
  };
}

/**
 * Verify OTP (main function)
 * Uses local verification
 */
async function verifyOTPCode(phone, code) {
  return verifyOTP(phone, code);
}

module.exports = {
  generateOTP,
  normalizePhoneNumber,
  isValidPhoneNumber,
  sendOTP,
  verifyOTPCode,
  storeOTP,
  verifyOTP,
};
