/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authApi from "../utils/authApi";

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored tokens
        const { accessToken } = authApi.getStoredTokens();

        if (accessToken) {
          // Try to get current user
          const result = await authApi.getCurrentUser();

          if (result.success) {
            setUser(result.user);
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear it
            authApi.clearTokens();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Check for stored user (might be stale)
          const storedUser = authApi.getStoredUser();
          if (storedUser) {
            authApi.clearTokens();
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authApi.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register
  const register = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const result = await authApi.register(data);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(data);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  // Logout from all devices
  const logoutAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logoutAll();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data) => {
    const result = await authApi.updateProfile(data);

    if (result.success) {
      setUser(result.user);
    }

    return result;
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    const result = await authApi.getCurrentUser();

    if (result.success) {
      setUser(result.user);
    }

    return result;
  }, []);

  // OAuth login
  const loginWithOAuth = useCallback(async (provider, redirect = "/") => {
    try {
      const authUrl = await authApi.getOAuthUrl(provider, redirect);
      window.location.href = authUrl;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async () => {
    const result = authApi.handleOAuthCallback();

    if (result.success) {
      // Get user data
      const userResult = await authApi.getCurrentUser();

      if (userResult.success) {
        setUser(userResult.user);
        setIsAuthenticated(true);
      }
    }

    return result;
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    logoutAll,
    updateProfile,
    refreshUser,
    loginWithOAuth,
    handleOAuthCallback,
    // Expose utility functions
    changePassword: authApi.changePassword,
    forgotPassword: authApi.forgotPassword,
    resetPassword: authApi.resetPassword,
    verifyEmail: authApi.verifyEmail,
    resendVerification: authApi.resendVerification,
    deleteAccount: authApi.deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

/**
 * HOC for protected routes
 */
export function withAuth(Component, options = {}) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    const { redirectTo = "/login" } = options;

    if (isLoading) {
      return null; // Or loading spinner
    }

    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = `${redirectTo}?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      return null;
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
