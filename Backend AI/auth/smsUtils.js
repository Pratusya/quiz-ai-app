/**
 * SMS/Phone Authentication Utilities
 * Handles OTP generation, sending, and verification via SMS
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
 * Send OTP via Twilio
 */
async function sendOTPViaTwilio(phone, otp) {
  const { accountSid, authToken, phoneNumber, verifyServiceSid } =
    config.sms.twilio;

  // Check if Twilio credentials are configured
  if (!accountSid || !authToken) {
    console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
    return {
      success: true,
      message: "OTP logged to console (dev mode)",
      devMode: true,
    };
  }

  try {
    // Use Twilio Verify Service if configured
    if (verifyServiceSid) {
      const twilio = require("twilio")(accountSid, authToken);
      const verification = await twilio.verify.v2
        .services(verifyServiceSid)
        .verifications.create({
          to: normalizePhoneNumber(phone),
          channel: "sms",
        });

      return {
        success: true,
        status: verification.status,
        sid: verification.sid,
      };
    }

    // Fallback to direct SMS
    const twilio = require("twilio")(accountSid, authToken);
    const message = await twilio.messages.create({
      body: `Your Quiz AI verification code is: ${otp}. Valid for 5 minutes.`,
      from: phoneNumber,
      to: normalizePhoneNumber(phone),
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify OTP via Twilio Verify Service
 */
async function verifyOTPViaTwilio(phone, code) {
  const { accountSid, authToken, verifyServiceSid } = config.sms.twilio;

  if (!verifyServiceSid || !accountSid || !authToken) {
    // Fall back to local verification
    return verifyOTP(phone, code);
  }

  try {
    const twilio = require("twilio")(accountSid, authToken);
    const verification = await twilio.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: normalizePhoneNumber(phone),
        code: code,
      });

    return {
      valid: verification.status === "approved",
      status: verification.status,
    };
  } catch (error) {
    console.error("Twilio verification error:", error);
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Send OTP (main function - uses configured provider)
 */
async function sendOTP(phone) {
  if (!isValidPhoneNumber(phone)) {
    return { success: false, error: "Invalid phone number format" };
  }

  const otp = generateOTP(config.sms.otpLength);
  const normalized = normalizePhoneNumber(phone);

  // Store OTP locally (for verification)
  storeOTP(normalized, otp);

  // Send via configured provider
  const provider = config.sms.provider;

  switch (provider) {
    case "twilio":
      return await sendOTPViaTwilio(phone, otp);
    default:
      // Development mode - just log the OTP
      console.log(`[DEV MODE] OTP for ${normalized}: ${otp}`);
      return {
        success: true,
        message: "OTP sent successfully",
        devMode: true,
        // Only include OTP in dev mode for testing
        ...(process.env.NODE_ENV === "development" && { otp }),
      };
  }
}

/**
 * Verify OTP (main function)
 */
async function verifyOTPCode(phone, code) {
  const provider = config.sms.provider;

  // If Twilio Verify Service is configured, use it
  if (
    provider === "twilio" &&
    config.sms.twilio.verifyServiceSid &&
    config.sms.twilio.accountSid
  ) {
    return await verifyOTPViaTwilio(phone, code);
  }

  // Otherwise use local verification
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
