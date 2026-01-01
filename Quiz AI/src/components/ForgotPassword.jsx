/**
 * Forgot Password Page Component
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GlassCard } from "./ui/GlassCard";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Brain,
  CheckCircle,
  KeyRound,
} from "lucide-react";

function ForgotPassword() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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

            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Didn't receive the email? Check your spam folder or try again with
              a different email address.
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSuccess(false)}
              >
                Try another email
              </Button>
              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
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
            <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground">
              No worries! Enter your email and we'll send you a reset link.
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
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isSubmitting}
              shimmer
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <Link to="/login">
            <Button variant="ghost" className="w-full mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
