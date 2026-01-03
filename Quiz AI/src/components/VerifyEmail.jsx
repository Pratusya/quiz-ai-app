import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  ArrowRight,
  Home,
} from "lucide-react";
import { Button } from "./ui/button";
import { GlassCard } from "./ui/GlassCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://quiz-ai-app-pqyh.onrender.com";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(
            data.error || "Failed to verify email. The link may have expired."
          );
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          "An error occurred while verifying your email. Please try again."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          <div className="text-center">
            {/* Icon based on status */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6 flex justify-center"
            >
              {status === "verifying" && (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              )}
              {status === "success" && (
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              )}
              {status === "error" && (
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
              )}
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-2">
              {status === "verifying" && "Verifying Your Email"}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </h1>

            {/* Message */}
            <p className="text-muted-foreground mb-6">
              {status === "verifying"
                ? "Please wait while we verify your email address..."
                : message}
            </p>

            {/* Actions based on status */}
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  You can now access all features of Quiz AI.
                </p>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full gap-2"
                >
                  Continue to Login
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </Button>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  The verification link may have expired or already been used.
                </p>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Login to Resend Verification
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </Button>
              </motion.div>
            )}
          </div>
        </GlassCard>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          Need help?{" "}
          <Link to="/contact" className="text-primary hover:underline">
            Contact Support
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
