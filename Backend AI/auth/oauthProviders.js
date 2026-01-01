/**
 * OAuth Providers
 * Handle OAuth authentication with Google and GitHub
 */

const https = require("https");
const config = require("./config");

/**
 * Make HTTPS request (Promise-based)
 */
function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// ==================== GOOGLE OAUTH ====================

/**
 * Get Google OAuth URL
 */
function getGoogleAuthUrl(state) {
  const { clientId, redirectUri, scopes } = config.oauth.google;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    state: state,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange Google authorization code for tokens
 */
async function getGoogleTokens(code) {
  const { clientId, clientSecret, redirectUri } = config.oauth.google;

  const postData = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }).toString();

  const options = {
    hostname: "oauth2.googleapis.com",
    path: "/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const response = await httpsRequest(options, postData);

  if (response.status !== 200) {
    throw new Error(
      `Google token exchange failed: ${JSON.stringify(response.data)}`
    );
  }

  return response.data;
}

/**
 * Get Google user info
 */
async function getGoogleUserInfo(accessToken) {
  const options = {
    hostname: "www.googleapis.com",
    path: "/oauth2/v2/userinfo",
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const response = await httpsRequest(options);

  if (response.status !== 200) {
    throw new Error("Failed to get Google user info");
  }

  return {
    provider: "google",
    providerId: response.data.id,
    email: response.data.email,
    name: response.data.name,
    firstName: response.data.given_name,
    lastName: response.data.family_name,
    avatar: response.data.picture,
    emailVerified: response.data.verified_email,
  };
}

// ==================== GITHUB OAUTH ====================

/**
 * Get GitHub OAuth URL
 */
function getGithubAuthUrl(state) {
  const { clientId, redirectUri, scopes } = config.oauth.github;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    state: state,
    allow_signup: "true",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange GitHub authorization code for access token
 */
async function getGithubTokens(code) {
  const { clientId, clientSecret, redirectUri } = config.oauth.github;

  const postData = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const options = {
    hostname: "github.com",
    path: "/login/oauth/access_token",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const response = await httpsRequest(options, postData);

  if (response.data.error) {
    throw new Error(
      `GitHub token exchange failed: ${response.data.error_description}`
    );
  }

  return response.data;
}

/**
 * Get GitHub user info
 */
async function getGithubUserInfo(accessToken) {
  // Get user profile
  const userOptions = {
    hostname: "api.github.com",
    path: "/user",
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Quiz-AI-App",
    },
  };

  const userResponse = await httpsRequest(userOptions);

  if (userResponse.status !== 200) {
    throw new Error("Failed to get GitHub user info");
  }

  // Get user emails
  const emailOptions = {
    hostname: "api.github.com",
    path: "/user/emails",
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Quiz-AI-App",
    },
  };

  const emailResponse = await httpsRequest(emailOptions);

  // Find primary email
  let primaryEmail = null;
  let emailVerified = false;

  if (emailResponse.status === 200 && Array.isArray(emailResponse.data)) {
    const primary = emailResponse.data.find((e) => e.primary);
    if (primary) {
      primaryEmail = primary.email;
      emailVerified = primary.verified;
    }
  }

  const userData = userResponse.data;

  return {
    provider: "github",
    providerId: userData.id.toString(),
    email: primaryEmail || userData.email,
    name: userData.name || userData.login,
    username: userData.login,
    avatar: userData.avatar_url,
    emailVerified,
    profileUrl: userData.html_url,
  };
}

// ==================== UNIFIED INTERFACE ====================

/**
 * Get OAuth URL for any provider
 */
function getOAuthUrl(provider, state) {
  switch (provider) {
    case "google":
      return getGoogleAuthUrl(state);
    case "github":
      return getGithubAuthUrl(state);
    default:
      throw new Error(`Unknown OAuth provider: ${provider}`);
  }
}

/**
 * Handle OAuth callback for any provider
 */
async function handleOAuthCallback(provider, code) {
  let tokens, userInfo;

  switch (provider) {
    case "google":
      tokens = await getGoogleTokens(code);
      userInfo = await getGoogleUserInfo(tokens.access_token);
      break;
    case "github":
      tokens = await getGithubTokens(code);
      userInfo = await getGithubUserInfo(tokens.access_token);
      break;
    default:
      throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  return { tokens, userInfo };
}

module.exports = {
  getOAuthUrl,
  handleOAuthCallback,
  // Google
  getGoogleAuthUrl,
  getGoogleTokens,
  getGoogleUserInfo,
  // GitHub
  getGithubAuthUrl,
  getGithubTokens,
  getGithubUserInfo,
};
