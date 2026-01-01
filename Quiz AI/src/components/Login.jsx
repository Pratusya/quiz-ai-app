/**
 * Login Page Component
 * Modern, secure login page with social login and phone OTP options
 */

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GlassCard } from "./ui/GlassCard";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Github,
  Chrome,
  AlertCircle,
  Loader2,
  Brain,
  Sparkles,
  Phone,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import authApi from "../utils/authApi";
import {
  setupRecaptcha,
  sendFirebaseOTP,
  verifyFirebaseOTP,
  isFirebaseConfigured,
} from "../config/firebase";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithOAuth, isLoading } = useAuth();
  const sendOtpButtonRef = useRef(null);

  // Form states
  const [loginMethod, setLoginMethod] = useState("email"); // email, phone
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const redirectTo = searchParams.get("redirect") || "/";

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Setup reCAPTCHA when phone login method is selected
  useEffect(() => {
    if (loginMethod === "phone" && isFirebaseConfigured() && !otpSent) {
      setTimeout(() => {
        if (sendOtpButtonRef.current) {
          setupRecaptcha("send-otp-btn");
        }
      }, 500);
    }
  }, [loginMethod, otpSent]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        toast.success("Welcome back!");
        navigate(redirectTo);
      } else {
        setError(result.error || "Login failed");
        if (
          result.attemptsRemaining !== undefined &&
          result.attemptsRemaining <= 3
        ) {
          setError(
            `${result.error}. ${result.attemptsRemaining} attempts remaining.`
          );
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      setError(
        "Phone authentication is not configured. Please use email login."
      );
      return;
    }

    setError("");
    setOtpLoading(true);

    try {
      // Format phone number
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+91" + formattedPhone.replace(/^0/, "");
      }

      await sendFirebaseOTP(formattedPhone);
      setOtpSent(true);
      setCountdown(60);
      toast.success("OTP sent to " + formattedPhone);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
      // Re-setup reCAPTCHA on error
      setTimeout(() => {
        if (sendOtpButtonRef.current) {
          setupRecaptcha("send-otp-btn");
        }
      }, 500);
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Verify OTP with Firebase
      const firebaseResult = await verifyFirebaseOTP(otp);

      if (firebaseResult.user) {
        // Get Firebase ID token and send to backend
        const idToken = await firebaseResult.user.getIdToken();

        // Format phone number
        let formattedPhone = phone.trim();
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+91" + formattedPhone.replace(/^0/, "");
        }

        // Call backend to create/login user with phone
        const result = await authApi.loginWithFirebasePhone(
          formattedPhone,
          idToken
        );

        if (result.success) {
          authApi.storeTokens(result.accessToken, result.refreshToken);
          authApi.storeUser(result.user);
          toast.success(
            result.isNewUser ? "Account created!" : "Welcome back!"
          );
          navigate(redirectTo);
          window.location.reload();
        } else {
          setError(result.error || "Login failed");
        }
      }
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      await loginWithOAuth(provider, redirectTo);
    } catch (err) {
      toast.error(`Failed to login with ${provider}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to continue to Quiz AI
            </p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
            <button
              onClick={() => {
                setLoginMethod("email");
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginMethod === "email"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
            <button
              onClick={() => {
                setLoginMethod("phone");
                setError("");
                setOtpSent(false);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginMethod === "phone"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <Phone className="w-4 h-4 inline mr-2" />
              Phone
            </button>
          </div>

          {/* Email Login Form */}
          {loginMethod === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isSubmitting || isLoading}
                shimmer
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Phone Login Form */}
          {loginMethod === "phone" && (
            <form
              onSubmit={otpSent ? handlePhoneSubmit : (e) => e.preventDefault()}
              className="space-y-5"
            >
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll send you a one-time verification code
                    </p>
                  </div>

                  <Button
                    id="send-otp-btn"
                    ref={sendOtpButtonRef}
                    type="button"
                    variant="gradient"
                    className="w-full"
                    onClick={handleSendOTP}
                    disabled={otpLoading || !phone}
                    shimmer
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {!isFirebaseConfigured() && (
                    <p className="text-xs text-amber-500 text-center">
                      ⚠️ Phone auth not configured. Please use email login.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <Label htmlFor="otp">Enter OTP</Label>
                    </div>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      OTP sent to {phone}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    disabled={isSubmitting || otp.length !== 6}
                    shimmer
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                          // Re-setup reCAPTCHA
                          setTimeout(() => {
                            if (sendOtpButtonRef.current) {
                              setupRecaptcha("send-otp-btn");
                            }
                          }, 500);
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Change number or resend
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("google")}
              className="relative group"
              disabled={isLoading}
            >
              <Chrome className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform mr-2" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("github")}
              className="relative group"
              disabled={isLoading}
            >
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform mr-2" />
              GitHub
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to={`/register${
                redirectTo !== "/"
                  ? `?redirect=${encodeURIComponent(redirectTo)}`
                  : ""
              }`}
              className="text-primary font-medium hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </GlassCard>

        {/* Security Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3 h-3" />
          Secured with industry-standard encryption
          <Sparkles className="w-3 h-3" />
        </motion.p>
      </motion.div>
    </div>
  );
}

export default Login;
