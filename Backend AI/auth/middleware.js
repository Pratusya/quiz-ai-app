/**
 * Authentication Middleware
 * Express middleware for protecting routes and managing sessions
 */

const jwtUtils = require("./jwtUtils");
const config = require("./config");

// Rate limiting for login attempts (in-memory, use Redis in production)
const loginAttempts = new Map();

/**
 * Clean up expired login attempts
 */
function cleanupLoginAttempts() {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (data.lockoutUntil && data.lockoutUntil < now) {
      loginAttempts.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupLoginAttempts, 5 * 60 * 1000);

/**
 * Track failed login attempt
 */
function trackFailedLogin(identifier) {
  const attempts = loginAttempts.get(identifier) || {
    count: 0,
    firstAttempt: Date.now(),
  };
  attempts.count++;
  attempts.lastAttempt = Date.now();

  if (attempts.count >= config.security.maxLoginAttempts) {
    attempts.lockoutUntil = Date.now() + config.security.lockoutDuration;
  }

  loginAttempts.set(identifier, attempts);
  return attempts;
}

/**
 * Check if identifier is locked out
 */
function isLockedOut(identifier) {
  const attempts = loginAttempts.get(identifier);
  if (!attempts) return { locked: false };

  if (attempts.lockoutUntil && attempts.lockoutUntil > Date.now()) {
    const remainingTime = Math.ceil(
      (attempts.lockoutUntil - Date.now()) / 1000 / 60
    );
    return { locked: true, remainingMinutes: remainingTime };
  }

  return { locked: false };
}

/**
 * Reset login attempts on successful login
 */
function resetLoginAttempts(identifier) {
  loginAttempts.delete(identifier);
}

/**
 * Authentication middleware - verifies JWT token
 */
function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No authorization header provided",
        code: "NO_TOKEN",
      });
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Invalid authorization format. Use: Bearer <token>",
        code: "INVALID_FORMAT",
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const result = jwtUtils.verifyAccessToken(token);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error,
        code:
          result.error === "Token expired" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      });
    }

    // Attach user info to request
    req.user = {
      id: result.payload.sub,
      email: result.payload.email,
      username: result.payload.username,
      role: result.payload.role,
    };
    req.token = token;
    req.tokenPayload = result.payload;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const result = jwtUtils.verifyAccessToken(token);

    if (result.valid) {
      req.user = {
        id: result.payload.sub,
        email: result.payload.email,
        username: result.payload.username,
        role: result.payload.role,
      };
      req.token = token;
      req.tokenPayload = result.payload;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

/**
 * Role-based authorization middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "NOT_AUTHENTICATED",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to access this resource",
        code: "FORBIDDEN",
      });
    }

    next();
  };
}

/**
 * CSRF protection middleware
 */
function csrfProtection(req, res, next) {
  // Skip for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfHeader = req.headers["x-csrf-token"];
  const csrfCookie = req.cookies?.csrf_token;

  // For API routes with JWT auth, we can skip CSRF as the token itself is a form of protection
  if (req.headers.authorization) {
    return next();
  }

  // For session-based auth, verify CSRF token
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return res.status(403).json({
      success: false,
      error: "Invalid CSRF token",
      code: "CSRF_INVALID",
    });
  }

  next();
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || "anonymous",
    };

    // Only log auth-related requests in detail
    if (req.path.includes("/auth/")) {
      console.log(`[AUTH] ${JSON.stringify(logData)}`);
    }
  });

  next();
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (adjust as needed)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  csrfProtection,
  requestLogger,
  securityHeaders,
  trackFailedLogin,
  isLockedOut,
  resetLoginAttempts,
};
