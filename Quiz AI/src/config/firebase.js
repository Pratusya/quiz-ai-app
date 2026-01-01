/**
 * Firebase Configuration
 * Used for Phone Authentication (10,000 free verifications/month)
 *
 * Setup Steps:
 * 1. Go to https://console.firebase.google.com
 * 2. Create/select project
 * 3. Enable Authentication > Phone
 * 4. Add your domains in Authentication > Settings > Authorized domains
 * 5. Copy your config from Project Settings > Your apps > Web
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

// Firebase configuration
// Using your Firebase project config
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyD_1LUDeahAbbE1gSv58cp6jRzcrZZwBMI",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "quiz-ai-app-789e5.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quiz-ai-app-789e5",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "quiz-ai-app-789e5.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "449299083402",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:449299083402:web:1cc8c486042d37e593bd73",
};

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Set language to user's browser language
  auth.languageCode = navigator.language || "en";
} catch (error) {
  console.error("Firebase initialization error:", error);
}

/**
 * Setup invisible reCAPTCHA verifier
 * @param {string} buttonId - The ID of the button element
 * @returns {RecaptchaVerifier}
 */
export function setupRecaptcha(buttonId) {
  if (!auth) {
    console.error("Firebase auth not initialized");
    return null;
  }

  // Clear existing verifier if any
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
    callback: (response) => {
      console.log("reCAPTCHA solved");
    },
    "expired-callback": () => {
      console.log("reCAPTCHA expired");
      toast.error("Verification expired. Please try again.");
    },
  });

  return window.recaptchaVerifier;
}

/**
 * Send OTP to phone number using Firebase
 * @param {string} phoneNumber - Phone number in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<ConfirmationResult>}
 */
export async function sendFirebaseOTP(phoneNumber) {
  if (!auth) {
    throw new Error("Firebase not configured. Please add Firebase config.");
  }

  // Ensure phone number is in E.164 format
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith("+")) {
    // Assume India if no country code
    formattedPhone = "+91" + formattedPhone.replace(/^0/, "");
  }

  const appVerifier = window.recaptchaVerifier;
  if (!appVerifier) {
    throw new Error("reCAPTCHA not initialized. Call setupRecaptcha first.");
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      appVerifier
    );
    // Store confirmation result for OTP verification
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error) {
    console.error("Firebase OTP error:", error);

    // Reset reCAPTCHA on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    // Provide user-friendly error messages
    switch (error.code) {
      case "auth/invalid-phone-number":
        throw new Error("Invalid phone number format. Use +91XXXXXXXXXX");
      case "auth/too-many-requests":
        throw new Error("Too many attempts. Please try again later.");
      case "auth/quota-exceeded":
        throw new Error("SMS quota exceeded. Try again tomorrow.");
      case "auth/captcha-check-failed":
        throw new Error(
          "reCAPTCHA verification failed. Please refresh and try again."
        );
      default:
        throw new Error(error.message || "Failed to send OTP");
    }
  }
}

/**
 * Verify OTP code
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<UserCredential>}
 */
export async function verifyFirebaseOTP(code) {
  if (!window.confirmationResult) {
    throw new Error("No OTP was sent. Please request a new OTP.");
  }

  try {
    const result = await window.confirmationResult.confirm(code);
    // Clear stored confirmation result
    window.confirmationResult = null;
    return result;
  } catch (error) {
    console.error("OTP verification error:", error);

    switch (error.code) {
      case "auth/invalid-verification-code":
        throw new Error("Invalid OTP. Please check and try again.");
      case "auth/code-expired":
        throw new Error("OTP has expired. Please request a new one.");
      default:
        throw new Error(error.message || "Failed to verify OTP");
    }
  }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured() {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    auth
  );
}

export { auth };
export default app;
