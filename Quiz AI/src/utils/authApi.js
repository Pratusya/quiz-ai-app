/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://quiz-ai-app-pqyh.onrender.com";

/**
 * Token storage keys
 */
const TOKEN_KEYS = {
  ACCESS: "quiz_ai_access_token",
  REFRESH: "quiz_ai_refresh_token",
  USER: "quiz_ai_user",
};

/**
 * Get stored tokens
 */
export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEYS.ACCESS),
    refreshToken: localStorage.getItem(TOKEN_KEYS.REFRESH),
  };
}

/**
 * Store tokens
 */
export function storeTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
}

/**
 * Clear tokens
 */
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
  localStorage.removeItem(TOKEN_KEYS.USER);
}

/**
 * Get stored user
 */
export function getStoredUser() {
  const userStr = localStorage.getItem(TOKEN_KEYS.USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Store user
 */
export function storeUser(user) {
  localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
}

/**
 * Make authenticated API request
 */
async function authFetch(endpoint, options = {}) {
  const { accessToken, refreshToken } = getStoredTokens();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const data = await response.json();

      if (data.code === "TOKEN_EXPIRED" && refreshToken) {
        const refreshResult = await refreshAccessToken(refreshToken);

        if (refreshResult.success) {
          // Retry original request with new token
          headers["Authorization"] = `Bearer ${refreshResult.accessToken}`;
          return fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        }
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (data.success) {
      storeTokens(data.accessToken, data.refreshToken);
      return { success: true, accessToken: data.accessToken };
    }

    // Refresh failed, clear tokens
    clearTokens();
    return { success: false };
  } catch (error) {
    clearTokens();
    return { success: false };
  }
}

/**
 * Register new user
 */
export async function register({ email, username, password, confirmPassword }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, confirmPassword }),
  });

  const data = await response.json();

  if (data.success) {
    storeTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
  }

  return data;
}

/**
 * Login with email and password
 */
export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    storeTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
  }

  return data;
}

/**
 * Logout
 */
export async function logout() {
  const { refreshToken } = getStoredTokens();

  try {
    await authFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    // Ignore logout errors
  }

  clearTokens();
}

/**
 * Logout from all devices
 */
export async function logoutAll() {
  try {
    await authFetch("/api/auth/logout-all", {
      method: "POST",
    });
  } catch (error) {
    // Ignore errors
  }

  clearTokens();
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const response = await authFetch("/api/auth/me");
  const data = await response.json();

  if (data.success) {
    storeUser(data.user);
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateProfile({
  username,
  avatar_url,
  email,
  phone_number,
}) {
  const response = await authFetch("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ username, avatar_url, email, phone_number }),
  });

  const data = await response.json();

  if (data.success) {
    storeUser(data.user);
  }

  return data;
}

/**
 * Change password
 */
export async function changePassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  const response = await authFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });

  return response.json();
}

/**
 * Request password reset
 */
export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return response.json();
}

/**
 * Reset password with token
 */
export async function resetPassword({ token, newPassword, confirmPassword }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });

  return response.json();
}

/**
 * Verify email
 */
export async function verifyEmail(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  return response.json();
}

/**
 * Resend verification email
 */
export async function resendVerification() {
  const response = await authFetch("/api/auth/resend-verification", {
    method: "POST",
  });

  return response.json();
}

/**
 * Delete account
 */
export async function deleteAccount({ password, confirmDelete }) {
  const response = await authFetch("/api/auth/account", {
    method: "DELETE",
    body: JSON.stringify({ password, confirmDelete }),
  });

  const data = await response.json();

  if (data.success) {
    clearTokens();
  }

  return data;
}

/**
 * Get OAuth URL
 */
export async function getOAuthUrl(provider, redirect = "/") {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/${provider}?redirect=${encodeURIComponent(
      redirect
    )}`
  );
  const data = await response.json();

  if (data.success) {
    return data.authUrl;
  }

  throw new Error(data.error || "Failed to get OAuth URL");
}

/**
 * Handle OAuth callback (parse URL params)
 */
export function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("accessToken");
  const refreshToken = params.get("refreshToken");
  const redirect = params.get("redirect") || "/";
  const error = params.get("error");

  if (error) {
    return { success: false, error };
  }

  if (accessToken && refreshToken) {
    storeTokens(accessToken, refreshToken);
    return { success: true, redirect };
  }

  return { success: false, error: "No tokens received" };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const { accessToken } = getStoredTokens();
  return !!accessToken;
}

export default {
  register,
  login,
  logout,
  logoutAll,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteAccount,
  getOAuthUrl,
  handleOAuthCallback,
  isAuthenticated,
  getStoredTokens,
  getStoredUser,
  storeTokens,
  storeUser,
  clearTokens,
};
