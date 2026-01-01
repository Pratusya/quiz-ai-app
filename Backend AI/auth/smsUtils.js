/**
 * SMS/Phone Authentication Utilities
 * Handles OTP generation, sending, and verification via SMS
 *
 * FREE SMS OPTIONS:
 * 1. TextBelt - 1 free SMS/day (textbelt.com) - Good for testing
 * 2. Fast2SMS - Free tier for India (fast2sms.com) - Transactional SMS
 * 3. Email-to-SMS - Free but carrier-specific
 *
 * NOTE: Phone verification is OPTIONAL. Email verification is recommended as primary.
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
 * Send OTP via TextBelt (FREE - 1 SMS/day, or use API key for more)
 * Website: https://textbelt.com
 * - Free: 1 SMS/day with key "textbelt"
 * - Paid: $0.05/SMS with API key
 */
async function sendOTPViaTextBelt(phone, otp) {
  const apiKey = process.env.TEXTBELT_API_KEY || "textbelt"; // "textbelt" = free tier

  try {
    const response = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: normalizePhoneNumber(phone),
        message: `Your Quiz AI verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        key: apiKey,
      }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        quotaRemaining: result.quotaRemaining,
        textId: result.textId,
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error("TextBelt SMS error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send OTP via Fast2SMS (FREE tier for India)
 * Website: https://fast2sms.com
 * - Free tier available for transactional/OTP SMS
 * - Requires Indian phone numbers (+91)
 */
async function sendOTPViaFast2SMS(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log("[DEV MODE] Fast2SMS not configured");
    return { success: false, error: "Fast2SMS API key not configured" };
  }

  // Extract phone number without country code for Fast2SMS
  let phoneNumber = normalizePhoneNumber(phone);
  if (phoneNumber.startsWith("+91")) {
    phoneNumber = phoneNumber.substring(3);
  } else if (phoneNumber.startsWith("+")) {
    return {
      success: false,
      error: "Fast2SMS only supports Indian numbers (+91)",
    };
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers: phoneNumber,
        flash: 0,
      }),
    });

    const result = await response.json();

    if (result.return === true) {
      return {
        success: true,
        requestId: result.request_id,
        message: result.message,
      };
    } else {
      return {
        success: false,
        error: result.message || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error("Fast2SMS error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send OTP via Email-to-SMS Gateway (FREE - carrier dependent)
 * Most carriers have email gateways: number@carrier-gateway.com
 */
async function sendOTPViaEmailGateway(phone, otp) {
  const nodemailer = require("nodemailer");

  // Common carrier gateways (US/India focused)
  const carrierGateways = {
    // US Carriers
    att: "txt.att.net",
    verizon: "vtext.com",
    tmobile: "tmomail.net",
    sprint: "messaging.sprintpcs.com",
    // Indian Carriers
    airtel: "airtelmail.com",
    jio: "jio.com", // May not work
    vi: "vimail.com", // May not work
  };

  // This requires knowing the carrier - usually not practical
  // Better to use TextBelt or Fast2SMS
  return {
    success: false,
    error:
      "Email gateway requires carrier information. Use TextBelt or Fast2SMS instead.",
  };
}

/**
 * Send OTP via Twilio (PAID - keeping for reference)
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
 *
 * Provider Priority:
 * 1. Fast2SMS (if Indian number and API key configured)
 * 2. TextBelt (free tier or with API key)
 * 3. Twilio (if configured - paid)
 * 4. Dev Mode (logs to console)
 */
async function sendOTP(phone) {
  if (!isValidPhoneNumber(phone)) {
    return { success: false, error: "Invalid phone number format" };
  }

  const otp = generateOTP(config.sms.otpLength);
  const normalized = normalizePhoneNumber(phone);

  // Store OTP locally (for verification)
  storeOTP(normalized, otp);

  // Get configured provider from env or config
  const provider =
    process.env.SMS_PROVIDER || config.sms.provider || "textbelt";

  console.log(`Sending OTP to ${normalized} via ${provider}...`);

  switch (provider.toLowerCase()) {
    case "fast2sms":
      // Best for Indian numbers (+91)
      if (normalized.startsWith("+91") && process.env.FAST2SMS_API_KEY) {
        const result = await sendOTPViaFast2SMS(phone, otp);
        if (result.success) return result;
        // Fall through to TextBelt if Fast2SMS fails
      }
    // Fall through to textbelt

    case "textbelt":
      // Free tier: 1 SMS/day, works internationally
      const textbeltResult = await sendOTPViaTextBelt(phone, otp);
      if (textbeltResult.success) return textbeltResult;

      // If TextBelt fails and Twilio is configured, try Twilio
      if (config.sms.twilio.accountSid && config.sms.twilio.authToken) {
        return await sendOTPViaTwilio(phone, otp);
      }

      // Return TextBelt error
      return textbeltResult;

    case "twilio":
      return await sendOTPViaTwilio(phone, otp);

    default:
      // Development mode - just log the OTP
      console.log(`[DEV MODE] OTP for ${normalized}: ${otp}`);
      return {
        success: true,
        message: "OTP sent successfully (dev mode - check console)",
        devMode: true,
        // Only include OTP in dev mode for testing
        ...(process.env.NODE_ENV === "development" && { otp }),
      };
  }
}

/**
 * Verify OTP (main function)
 * Always uses local verification since we store OTP locally
 * Twilio Verify is only used if specifically configured
 */
async function verifyOTPCode(phone, code) {
  const provider = process.env.SMS_PROVIDER || config.sms.provider;

  // If Twilio Verify Service is configured, use it
  if (
    provider === "twilio" &&
    config.sms.twilio.verifyServiceSid &&
    config.sms.twilio.accountSid
  ) {
    return await verifyOTPViaTwilio(phone, code);
  }

  // Otherwise use local verification (works with all providers)
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
  // Export individual providers for direct use
  sendOTPViaTextBelt,
  sendOTPViaFast2SMS,
};
