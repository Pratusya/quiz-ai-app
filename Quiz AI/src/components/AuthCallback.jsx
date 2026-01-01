/**
 * OAuth Callback Handler Component
 * Handles the redirect from OAuth providers
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "./ui/GlassCard";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

function AuthCallback() {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [error, setError] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = await handleOAuthCallback();

        if (result.success) {
          setStatus("success");
          // Redirect after a short delay
          setTimeout(() => {
            navigate(result.redirect || "/");
          }, 1500);
        } else {
          setStatus("error");
          setError(getErrorMessage(result.error));
        }
      } catch (err) {
        setStatus("error");
        setError("An unexpected error occurred during authentication");
      }
    };

    processCallback();
  }, [handleOAuthCallback, navigate]);

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      oauth_denied: "You declined the authentication request",
      invalid_state: "Invalid authentication session. Please try again.",
      oauth_failed: "Authentication failed. Please try again.",
      auth_failed: "Unable to authenticate. Please try again.",
    };
    return (
      errorMessages[errorCode] || "Authentication failed. Please try again."
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 text-center">
          {status === "processing" && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6"
              >
                <Loader2 className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Authenticating...</h1>
              <p className="text-muted-foreground">
                Please wait while we complete your sign-in
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6"
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
              <p className="text-muted-foreground">
                Authentication successful. Redirecting you now...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-6"
              >
                <AlertCircle className="w-8 h-8 text-destructive" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="space-y-3">
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => navigate("/login")}
                  shimmer
                >
                  Try Again
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Go to Homepage
                </Button>
              </div>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default AuthCallback;
