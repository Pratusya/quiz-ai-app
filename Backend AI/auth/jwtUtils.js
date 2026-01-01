/**
 * JWT Utilities
 * Secure token generation, verification, and management
 */

const crypto = require("crypto");
const config = require("./config");

// In-memory token blacklist (use Redis in production for scalability)
const tokenBlacklist = new Set();
const refreshTokens = new Map();

/**
 * Generate a secure random string
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Create HMAC signature for JWT
 */
function createSignature(header, payload, secret) {
  const data = `${header}.${payload}`;
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Base64URL encode
 */
function base64UrlEncode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str) {
  try {
    return JSON.parse(Buffer.from(str, "base64url").toString());
  } catch (error) {
    return null;
  }
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Generate Access Token
 */
function generateAccessToken(user) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const expiryMs = parseDuration(config.jwt.accessTokenExpiry);

  const payload = {
    sub: user.id.toString(),
    email: user.email,
    username: user.username,
    role: user.role || "user",
    iat: now,
    exp: now + Math.floor(expiryMs / 1000),
    iss: config.jwt.issuer,
    aud: config.jwt.audience,
    jti: generateSecureToken(16), // Unique token ID for blacklisting
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = createSignature(
    encodedHeader,
    encodedPayload,
    config.jwt.secret
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Generate Refresh Token
 */
function generateRefreshToken(user) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const expiryMs = parseDuration(config.jwt.refreshTokenExpiry);
  const tokenId = generateSecureToken(16);

  const payload = {
    sub: user.id.toString(),
    type: "refresh",
    iat: now,
    exp: now + Math.floor(expiryMs / 1000),
    iss: config.jwt.issuer,
    jti: tokenId,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = createSignature(
    encodedHeader,
    encodedPayload,
    config.jwt.refreshSecret
  );

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  // Store refresh token with user info
  refreshTokens.set(tokenId, {
    userId: user.id,
    expiresAt: Date.now() + expiryMs,
    token,
  });

  return token;
}

/**
 * Verify Access Token
 */
function verifyAccessToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid token format" };
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = createSignature(
      encodedHeader,
      encodedPayload,
      config.jwt.secret
    );
    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid signature" };
    }

    // Decode payload
    const payload = base64UrlDecode(encodedPayload);
    if (!payload) {
      return { valid: false, error: "Invalid payload" };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token expired" };
    }

    // Check if token is blacklisted
    if (
      config.security.tokenBlacklistEnabled &&
      tokenBlacklist.has(payload.jti)
    ) {
      return { valid: false, error: "Token revoked" };
    }

    // Verify issuer and audience
    if (
      payload.iss !== config.jwt.issuer ||
      payload.aud !== config.jwt.audience
    ) {
      return { valid: false, error: "Invalid issuer or audience" };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Verify Refresh Token
 */
function verifyRefreshToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid token format" };
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = createSignature(
      encodedHeader,
      encodedPayload,
      config.jwt.refreshSecret
    );
    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid signature" };
    }

    // Decode payload
    const payload = base64UrlDecode(encodedPayload);
    if (!payload || payload.type !== "refresh") {
      return { valid: false, error: "Invalid refresh token" };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token expired" };
    }

    // Verify token exists in store
    const storedToken = refreshTokens.get(payload.jti);
    if (!storedToken || storedToken.token !== token) {
      return { valid: false, error: "Token not found or invalid" };
    }

    return { valid: true, payload, storedToken };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Revoke Access Token
 */
function revokeAccessToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = base64UrlDecode(parts[1]);
    if (payload && payload.jti) {
      tokenBlacklist.add(payload.jti);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Revoke Refresh Token
 */
function revokeRefreshToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = base64UrlDecode(parts[1]);
    if (payload && payload.jti) {
      refreshTokens.delete(payload.jti);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
function revokeAllUserTokens(userId) {
  const userIdStr = userId.toString();
  for (const [tokenId, data] of refreshTokens.entries()) {
    if (data.userId.toString() === userIdStr) {
      refreshTokens.delete(tokenId);
    }
  }
}

/**
 * Cleanup expired tokens (call periodically)
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [tokenId, data] of refreshTokens.entries()) {
    if (data.expiresAt < now) {
      refreshTokens.delete(tokenId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateSecureToken,
};
