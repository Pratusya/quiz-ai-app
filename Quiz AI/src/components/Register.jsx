/**
 * Register Page Component
 * Modern, secure registration page with password strength indicator
 */

import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GlassCard } from "./ui/GlassCard";
import { Progress } from "./ui/progress";
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
  User,
  Check,
  X,
  Sparkles,
  Shield,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";

// Password strength calculator
function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;

  // Length
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character types
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score += 15;

  // Limit to 100
  score = Math.min(score, 100);

  let label, color;
  if (score < 30) {
    label = "Weak";
    color = "bg-red-500";
  } else if (score < 60) {
    label = "Fair";
    color = "bg-yellow-500";
  } else if (score < 80) {
    label = "Good";
    color = "bg-blue-500";
  } else {
    label = "Strong";
    color = "bg-green-500";
  }

  return { score, label, color };
}

// Password requirements
const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  { id: "number", label: "One number", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "One special character",
    test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(p),
  },
];

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loginWithOAuth, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/";

  // Password strength
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password]
  );

  // Check which requirements are met
  const meetsRequirements = useMemo(() => {
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.test(formData.password),
    }));
  }, [formData.password]);

  // All requirements met
  const allRequirementsMet = meetsRequirements.every((r) => r.met);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate
    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(formData);

      if (result.success) {
        toast.success("Account created successfully!");
        navigate(redirectTo);
      } else {
        setError(result.error || "Registration failed");
        if (result.details) {
          setError(result.details.join(". "));
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      await loginWithOAuth(provider, redirectTo);
    } catch (err) {
      toast.error(`Failed to sign up with ${provider}`);
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
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Join Quiz AI and start learning
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                3-30 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                  autoComplete="new-password"
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

              {/* Password Strength */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Password strength
                    </span>
                    <span
                      className={`font-medium ${
                        passwordStrength.score >= 80
                          ? "text-green-500"
                          : passwordStrength.score >= 60
                          ? "text-blue-500"
                          : passwordStrength.score >= 30
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.score}%` }}
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 p-3 rounded-lg bg-muted/50"
              >
                {meetsRequirements.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center gap-2 text-xs ${
                      req.met
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {req.met ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    <span>{req.label}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive">
                    Passwords do not match
                  </p>
                )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded border-border"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={
                isSubmitting ||
                isLoading ||
                !allRequirementsMet ||
                !acceptedTerms
              }
              shimmer
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with
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

          {/* Phone Login Link */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Prefer phone login?{" "}
            <Link
              to={`/login${
                redirectTo !== "/"
                  ? `?redirect=${encodeURIComponent(redirectTo)}`
                  : ""
              }`}
              className="text-primary font-medium hover:underline"
            >
              Sign up with OTP
            </Link>
          </p>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to={`/login${
                redirectTo !== "/"
                  ? `?redirect=${encodeURIComponent(redirectTo)}`
                  : ""
              }`}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </GlassCard>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <Shield className="w-4 h-4 text-green-500" />
          <span>Your data is protected with enterprise-grade security</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Register;
