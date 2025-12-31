"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef(
  (
    { className, value, showValue = false, variant = "default", ...props },
    ref
  ) => {
    const variants = {
      default: "bg-primary",
      gradient: "bg-gradient-to-r from-primary via-purple-500 to-pink-500",
      success: "bg-gradient-to-r from-green-400 to-emerald-500",
      warning: "bg-gradient-to-r from-amber-400 to-orange-500",
      danger: "bg-gradient-to-r from-red-400 to-rose-500",
    };

    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-secondary/50 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out relative overflow-hidden",
            variants[variant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </ProgressPrimitive.Indicator>

        {/* Show percentage value */}
        {showValue && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground mix-blend-difference">
            {Math.round(value || 0)}%
          </span>
        )}
      </ProgressPrimitive.Root>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular Progress Component
const CircularProgress = React.forwardRef(
  (
    {
      value = 0,
      size = 120,
      strokeWidth = 8,
      showValue = true,
      className,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const gradientColors = {
      default: { start: "hsl(var(--primary))", end: "hsl(var(--primary))" },
      gradient: { start: "#8b5cf6", end: "#ec4899" },
      success: { start: "#4ade80", end: "#10b981" },
      warning: { start: "#fbbf24", end: "#f97316" },
      danger: { start: "#f87171", end: "#e11d48" },
    };

    const colors = gradientColors[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center",
          className
        )}
        {...props}
      >
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient
              id={`progress-gradient-${variant}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />

          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#progress-gradient-${variant})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>

        {/* Center content */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-bold gradient-text"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(value)}%
            </motion.span>
          </div>
        )}
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

// Animated progress bar with steps
const StepProgress = ({ steps = [], currentStep = 0, className }) => {
  return (
    <div className={cn("relative", className)}>
      {/* Line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-secondary/50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-purple-500"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm border-2 transition-colors duration-300",
                index <= currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-secondary text-muted-foreground"
              )}
              whileHover={{ scale: 1.1 }}
            >
              {index < currentStep ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </motion.div>
            <span
              className={cn(
                "mt-2 text-xs font-medium",
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export { Progress, CircularProgress, StepProgress };
