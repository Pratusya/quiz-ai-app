/**
 * Email Utilities
 * Handles sending verification emails, password reset emails, etc.
 * Modern & Beautiful Email Templates
 */

const nodemailer = require("nodemailer");
const config = require("./config");

// Log email config at startup
console.log("[EMAIL] Initializing email config...");
console.log("[EMAIL] SMTP_USER set:", !!process.env.SMTP_USER);
console.log("[EMAIL] SMTP_PASS set:", !!process.env.SMTP_PASS);
console.log(
  "[EMAIL] SMTP_HOST:",
  process.env.SMTP_HOST || "smtp.gmail.com (default)"
);

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
  secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === "true",
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
};

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter && emailConfig.auth.user && emailConfig.auth.pass) {
    console.log("[EMAIL] Creating transporter with config:", {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.auth.user ? "***configured***" : "NOT SET",
    });

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  } else if (!transporter) {
    console.log("[EMAIL] Cannot create transporter - missing credentials");
    console.log(
      "[EMAIL] auth.user:",
      emailConfig.auth.user ? "SET" : "NOT SET"
    );
    console.log(
      "[EMAIL] auth.pass:",
      emailConfig.auth.pass ? "SET" : "NOT SET"
    );
  }
  return transporter;
}

/**
 * Check if email sending is configured
 */
function isEmailConfigured() {
  const configured = !!(emailConfig.auth.user && emailConfig.auth.pass);
  if (!configured) {
    console.log(
      "[EMAIL] Not configured. SMTP_USER:",
      emailConfig.auth.user ? "SET" : "NOT SET",
      "SMTP_PASS:",
      emailConfig.auth.pass ? "SET" : "NOT SET"
    );
  }
  return configured;
}

/**
 * Send an email
 */
async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();

  if (!transport) {
    console.log(
      "[DEV MODE] Email not configured - EMAIL_USER:",
      emailConfig.auth.user ? "SET" : "NOT SET"
    );
    console.log("[DEV MODE] Email would be sent to:", to);
    console.log("[DEV MODE] Subject:", subject);
    return {
      success: true,
      devMode: true,
      message: "Email logged to console (dev mode - no SMTP configured)",
    };
  }

  try {
    const fromEmail =
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER ||
      "noreply@quizai.com";

    console.log("[EMAIL] Sending email to:", to, "from:", fromEmail);

    // Add timeout to prevent hanging (10 seconds)
    const sendPromise = transport.sendMail({
      from: `"Quiz AI" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email sending timed out")), 10000)
    );

    const result = await Promise.race([sendPromise, timeoutPromise]);

    console.log("[EMAIL] Sent successfully:", result.messageId);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("[EMAIL] Sending error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get base email styles - Modern Glassmorphism Design
 */
function getBaseStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
      min-height: 100vh;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .email-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    
    .email-header {
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .email-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    }
    
    .header-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .header-title {
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }
    
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin-top: 8px;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }
    
    .email-body {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }
    
    .message-text {
      color: #64748b;
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 24px;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 
        0 10px 25px -5px rgba(124, 58, 237, 0.5),
        0 0 0 1px rgba(124, 58, 237, 0.1);
    }
    
    .cta-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 24px 0;
    }
    
    .link-fallback {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin: 24px 0;
    }
    
    .link-fallback-label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .link-fallback-url {
      color: #7c3aed;
      font-size: 12px;
      word-break: break-all;
      font-family: monospace;
    }
    
    .info-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 24px 0;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    
    .info-box-icon {
      font-size: 20px;
      margin-right: 12px;
    }
    
    .info-box-text {
      color: #92400e;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .warning-box {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    
    .warning-box .info-box-text {
      color: #991b1b;
    }
    
    .email-footer {
      background: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: #7c3aed;
      margin-bottom: 12px;
    }
    
    .footer-text {
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
    }
    
    .footer-links {
      margin: 16px 0;
    }
    
    .footer-link {
      color: #7c3aed;
      text-decoration: none;
      font-size: 12px;
      margin: 0 12px;
    }
    
    .feature-grid {
      margin: 24px 0;
    }
    
    .feature-item {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .feature-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      border-radius: 12px;
      display: inline-block;
      text-align: center;
      line-height: 50px;
      font-size: 24px;
      margin-right: 16px;
      vertical-align: middle;
    }
    
    .feature-content {
      display: inline-block;
      vertical-align: middle;
    }
    
    .feature-content h4 {
      color: #1a1a2e;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .feature-content p {
      color: #64748b;
      font-size: 13px;
      margin: 0;
    }
    
    .stats-row {
      text-align: center;
      margin: 24px 0;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
    }
    
    .stat-item {
      display: inline-block;
      margin: 0 20px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #7c3aed;
    }
    
    .stat-label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `;
}

/**
 * Send email verification email
 */
async function sendVerificationEmail(email, username, verificationToken) {
  const frontendUrl = config.frontend.baseUrl;
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Quiz AI</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">
          <!-- Header -->
          <div class="email-header">
            <div class="header-icon">✉️</div>
            <h1 class="header-title">Verify Your Email</h1>
            <p class="header-subtitle">Just one click to get started</p>
          </div>
          
          <!-- Body -->
          <div class="email-body">
            <h2 class="greeting">
              Hey ${username}! 👋
            </h2>
            
            <p class="message-text">
              Welcome to <strong>Quiz AI</strong>! We're thrilled to have you join our community of learners. 
              To get started with creating AI-powered quizzes, please verify your email address.
            </p>
            
            <div class="cta-container">
              <a href="${verificationUrl}" class="cta-button">
                ✨ Verify My Email
              </a>
            </div>
            
            <div class="link-fallback">
              <div class="link-fallback-label">Or copy this link</div>
              <div class="link-fallback-url">${verificationUrl}</div>
            </div>
            
            <div class="info-box">
              <span class="info-box-icon">⏰</span>
              <span class="info-box-text">
                This verification link will expire in <strong>24 hours</strong>. 
                If you didn't create an account with Quiz AI, you can safely ignore this email.
              </span>
            </div>
            
            <div class="divider"></div>
            
            <p class="message-text" style="font-size: 14px; text-align: center; color: #94a3b8;">
              Once verified, you'll have access to unlimited AI-generated quizzes, 
              progress tracking, and much more!
            </p>
          </div>
          
          <!-- Footer -->
          <div class="email-footer">
            <div class="footer-logo">🧠 Quiz AI</div>
            <p class="footer-text">
              Making learning fun with AI-powered quizzes
            </p>
            <div class="footer-links">
              <a href="${frontendUrl}" class="footer-link">Website</a>
              <a href="${frontendUrl}/about" class="footer-link">About</a>
              <a href="${frontendUrl}/contact" class="footer-link">Contact</a>
            </div>
            <p class="footer-text">
              © ${new Date().getFullYear()} Quiz AI. All rights reserved.<br>
              Gujarat, India 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Quiz AI, ${username}!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} Quiz AI
  `;

  return sendEmail({
    to: email,
    subject: "✨ Verify Your Email - Quiz AI",
    html,
    text,
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, username, resetToken) {
  const frontendUrl = config.frontend.baseUrl;
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Quiz AI</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">
          <!-- Header -->
          <div class="email-header" style="background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%);">
            <div class="header-icon">🔐</div>
            <h1 class="header-title">Password Reset</h1>
            <p class="header-subtitle">Let's get you back in</p>
          </div>
          
          <!-- Body -->
          <div class="email-body">
            <h2 class="greeting">
              Hi ${username}! 
            </h2>
            
            <p class="message-text">
              We received a request to reset your password for your Quiz AI account. 
              No worries, it happens to the best of us! Click the button below to create a new password.
            </p>
            
            <div class="cta-container">
              <a href="${resetUrl}" class="cta-button" style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);">
                🔑 Reset My Password
              </a>
            </div>
            
            <div class="link-fallback">
              <div class="link-fallback-label">Or copy this link</div>
              <div class="link-fallback-url">${resetUrl}</div>
            </div>
            
            <div class="info-box warning-box">
              <span class="info-box-icon">⚠️</span>
              <span class="info-box-text">
                This link will expire in <strong>1 hour</strong> for security reasons. 
                If you didn't request a password reset, please ignore this email or contact support 
                if you're concerned about your account security.
              </span>
            </div>
            
            <div class="divider"></div>
            
            <p class="message-text" style="font-size: 14px; text-align: center; color: #94a3b8;">
              Need help? Reply to this email or visit our support page.
            </p>
          </div>
          
          <!-- Footer -->
          <div class="email-footer">
            <div class="footer-logo">🧠 Quiz AI</div>
            <p class="footer-text">
              Your security is our priority
            </p>
            <p class="footer-text">
              © ${new Date().getFullYear()} Quiz AI. All rights reserved.<br>
              Gujarat, India 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset Your Password - Quiz AI

Hi ${username},

We received a request to reset your password. Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

© ${new Date().getFullYear()} Quiz AI
  `;

  return sendEmail({
    to: email,
    subject: "🔐 Reset Your Password - Quiz AI",
    html,
    text,
  });
}

/**
 * Send welcome email after verification
 */
async function sendWelcomeEmail(email, username) {
  const frontendUrl = config.frontend.baseUrl;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Quiz AI!</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">
          <!-- Header -->
          <div class="email-header" style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%);">
            <div class="header-icon">🎉</div>
            <h1 class="header-title">Welcome Aboard!</h1>
            <p class="header-subtitle">Your account is now verified</p>
          </div>
          
          <!-- Body -->
          <div class="email-body">
            <h2 class="greeting">
              Congratulations, ${username}! 🎊
            </h2>
            
            <p class="message-text">
              Your email has been verified and your Quiz AI account is now fully activated! 
              You're all set to explore the power of AI-generated quizzes.
            </p>
            
            <div class="stats-row">
              <div class="stat-item">
                <div class="stat-value">∞</div>
                <div class="stat-label">Quizzes</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">50+</div>
                <div class="stat-label">Topics</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">🏆</div>
                <div class="stat-label">Badges</div>
              </div>
            </div>
            
            <p class="message-text">
              <strong>Here's what you can do with Quiz AI:</strong>
            </p>
            
            <div class="feature-grid">
              <div class="feature-item">
                <span class="feature-icon">🤖</span>
                <div class="feature-content">
                  <h4>AI-Powered Quizzes</h4>
                  <p>Generate quizzes on any topic instantly using advanced AI</p>
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <div class="feature-content">
                  <h4>Track Your Progress</h4>
                  <p>Detailed analytics to monitor your learning journey</p>
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">🎮</span>
                <div class="feature-content">
                  <h4>Multiplayer Mode</h4>
                  <p>Challenge friends and compete in real-time</p>
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">🏅</span>
                <div class="feature-content">
                  <h4>Earn Achievements</h4>
                  <p>Unlock badges and climb the leaderboard</p>
                </div>
              </div>
            </div>
            
            <div class="cta-container">
              <a href="${frontendUrl}/generate-quiz" class="cta-button" style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);">
                🚀 Create Your First Quiz
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="email-footer">
            <div class="footer-logo">🧠 Quiz AI</div>
            <p class="footer-text">
              Start your learning adventure today!
            </p>
            <div class="footer-links">
              <a href="${frontendUrl}" class="footer-link">Website</a>
              <a href="${frontendUrl}/about" class="footer-link">About</a>
              <a href="${frontendUrl}/contact" class="footer-link">Contact</a>
            </div>
            <p class="footer-text">
              © ${new Date().getFullYear()} Quiz AI. All rights reserved.<br>
              Gujarat, India 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Quiz AI, ${username}! 🎉

Your email has been verified and your account is now fully activated.

Here's what you can do:
- Create unlimited AI-generated quizzes on any topic
- Track your learning progress with detailed analytics
- Challenge friends in multiplayer mode
- Earn badges and achievements

Get started: ${frontendUrl}/generate-quiz

© ${new Date().getFullYear()} Quiz AI
  `;

  return sendEmail({
    to: email,
    subject: "🎉 Welcome to Quiz AI - Let's Get Started!",
    html,
    text,
  });
}

/**
 * Send contact form notification to admin
 */
async function sendContactNotification(name, email, message) {
  const frontendUrl = config.frontend.baseUrl;
  const date = new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Message - Quiz AI</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">
          <!-- Header -->
          <div class="email-header" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);">
            <div class="header-icon">📬</div>
            <h1 class="header-title">New Message Received</h1>
            <p class="header-subtitle">Someone reached out via Contact Form</p>
          </div>
          
          <!-- Body -->
          <div class="email-body">
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">From</span>
                    <div style="color: #1a1a2e; font-size: 18px; font-weight: 600; margin-top: 4px;">
                      👤 ${name}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</span>
                    <div style="margin-top: 4px;">
                      <a href="mailto:${email}" style="color: #7c3aed; font-size: 16px; text-decoration: none; font-weight: 500;">
                        ✉️ ${email}
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Received</span>
                    <div style="color: #64748b; font-size: 14px; margin-top: 4px;">
                      📅 ${formattedDate}
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="margin-bottom: 24px;">
              <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 12px;">Message</span>
              <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 16px; padding: 24px; border-left: 4px solid #7c3aed;">
                <p style="color: #1a1a2e; font-size: 16px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            
            <div class="cta-container">
              <a href="mailto:${email}?subject=Re: Your message to Quiz AI&body=Hi ${name},%0D%0A%0D%0AThank you for reaching out!%0D%0A%0D%0A" class="cta-button" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);">
                💬 Reply to ${name}
              </a>
            </div>
            
            <div class="info-box">
              <span class="info-box-icon">💡</span>
              <span class="info-box-text">
                Click "Reply to ${name}" or simply reply to this email to respond directly.
              </span>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="email-footer">
            <div class="footer-logo">🧠 Quiz AI</div>
            <p class="footer-text">
              Admin Notification • Contact Form Submission
            </p>
            <p class="footer-text">
              © ${new Date().getFullYear()} Quiz AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Contact Form Submission - Quiz AI

From: ${name}
Email: ${email}
Received: ${formattedDate}

Message:
${message}

Reply directly to this email to respond.
  `;

  // Send to admin
  return sendEmail({
    to: process.env.SMTP_USER,
    subject: `📬 New Contact: ${name} - Quiz AI`,
    html,
    text,
  });
}

/**
 * Send auto-reply to contact form submitter
 */
async function sendContactAutoReply(name, email, message) {
  const frontendUrl = config.frontend.baseUrl;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thanks for Contacting Quiz AI!</title>
      <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-card">
          <!-- Header -->
          <div class="email-header" style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%);">
            <div class="header-icon">💌</div>
            <h1 class="header-title">Message Received!</h1>
            <p class="header-subtitle">We'll get back to you soon</p>
          </div>
          
          <!-- Body -->
          <div class="email-body">
            <h2 class="greeting">
              Hi ${name}! 👋
            </h2>
            
            <p class="message-text">
              Thank you for reaching out to <strong>Quiz AI</strong>! We've received your message and 
              our team will get back to you as soon as possible, typically within <strong>24-48 hours</strong>.
            </p>
            
            <div style="margin: 24px 0;">
              <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 12px;">Your Message</span>
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <p class="message-text">
              While you wait, why not explore some of our features?
            </p>
            
            <div class="feature-grid">
              <div class="feature-item">
                <span class="feature-icon">🤖</span>
                <div class="feature-content">
                  <h4>AI Quiz Generator</h4>
                  <p>Create quizzes on any topic in seconds</p>
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">🎮</span>
                <div class="feature-content">
                  <h4>Multiplayer Mode</h4>
                  <p>Challenge friends and compete live</p>
                </div>
              </div>
            </div>
            
            <div class="cta-container">
              <a href="${frontendUrl}" class="cta-button" style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);">
                🚀 Explore Quiz AI
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="email-footer">
            <div class="footer-logo">🧠 Quiz AI</div>
            <p class="footer-text">
              Making learning fun with AI-powered quizzes
            </p>
            <div class="footer-links">
              <a href="${frontendUrl}" class="footer-link">Website</a>
              <a href="${frontendUrl}/about" class="footer-link">About</a>
              <a href="${frontendUrl}/contact" class="footer-link">Contact</a>
            </div>
            <p class="footer-text">
              © ${new Date().getFullYear()} Quiz AI. All rights reserved.<br>
              Gujarat, India 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Thanks for Contacting Quiz AI!

Hi ${name},

Thank you for reaching out! We've received your message and will get back to you as soon as possible, typically within 24-48 hours.

Your message:
${message}

In the meantime, feel free to explore our AI-powered quiz platform at ${frontendUrl}

© ${new Date().getFullYear()} Quiz AI
  `;

  return sendEmail({
    to: email,
    subject: "💌 Thanks for Contacting Quiz AI!",
    html,
    text,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendContactNotification,
  sendContactAutoReply,
  isEmailConfigured,
};
