/**
 * Reset Password Page Component
 */

import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GlassCard } from "./ui/GlassCard";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  KeyRound,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

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

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check requirements
  const meetsRequirements = useMemo(() => {
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.test(newPassword),
    }));
  }, [newPassword]);

  const allRequirementsMet = meetsRequirements.every((r) => r.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        setSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password">
              <Button variant="gradient" className="w-full" shimmer>
                Request New Link
              </Button>
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-500" />
            </motion.div>

            <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully reset. You can now sign in
              with your new password.
            </p>

            <Link to="/login">
              <Button variant="gradient" className="w-full" shimmer>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <KeyRound className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
            <p className="text-muted-foreground">
              Create a new strong password for your account
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
            </div>

            {/* Password Requirements */}
            {newPassword && (
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isSubmitting || !allRequirementsMet}
              shimmer
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
