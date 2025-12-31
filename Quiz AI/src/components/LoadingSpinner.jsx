import React from "react";
import { motion } from "framer-motion";

// Main Loading Spinner with multiple variants
const LoadingSpinner = ({ size = "default", variant = "default" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    default: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  if (variant === "dots") {
    return <DotsLoader size={size} />;
  }

  if (variant === "pulse") {
    return <PulseLoader size={size} />;
  }

  if (variant === "orbit") {
    return <OrbitLoader size={size} />;
  }

  if (variant === "brain") {
    return <BrainLoader />;
  }

  // Default spinner
  return (
    <div className="flex justify-center items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute inset-1 rounded-full border-4 border-transparent border-t-primary border-r-primary"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

// Dots Loader
const DotsLoader = ({ size = "default" }) => {
  const dotSize =
    size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : "w-3 h-3";

  return (
    <div className="flex justify-center items-center gap-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${dotSize} rounded-full bg-primary`}
          animate={{
            y: [-8, 0, -8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Pulse Loader
const PulseLoader = ({ size = "default" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    default: "w-12 h-12",
    lg: "w-20 h-20",
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute inset-0 rounded-full border-2 border-primary"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
        <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-primary" />
      </div>
    </div>
  );
};

// Orbit Loader
const OrbitLoader = ({ size = "default" }) => {
  const containerSize = size === "sm" ? 40 : size === "lg" ? 80 : 60;

  return (
    <div className="flex justify-center items-center">
      <div
        className="relative"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Center */}
        <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-primary" />

        {/* Orbiting elements */}
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2 + index * 0.5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute w-2 h-2 rounded-full"
              style={{
                background:
                  index === 0
                    ? "hsl(var(--primary))"
                    : index === 1
                    ? "#a855f7"
                    : "#ec4899",
                top: "0%",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Brain/AI Loader
const BrainLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-20 h-20">
        {/* Brain icon container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-12 h-12 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <motion.path
              d="M12 4.5C7 4.5 3 8.5 3 13c0 2.5 1 4.5 3 6 0 0 1 .5 2 .5s2-.5 2-.5c1-1 2-1 2-1s1 0 2 1c0 0 1 .5 2 .5s2-.5 2-.5c2-1.5 3-3.5 3-6 0-4.5-4-8.5-9-8.5z"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M12 4.5c0 2 1 3.5 1 5.5s-1 3-1 3M12 4.5c0 2-1 3.5-1 5.5s1 3 1 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </svg>
        </motion.div>

        {/* Glowing effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Particle effects */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary"
            style={{
              top: "50%",
              left: "50%",
            }}
            animate={{
              x: [0, Math.cos((i * 60 * Math.PI) / 180) * 40],
              y: [0, Math.sin((i * 60 * Math.PI) / 180) * 40],
              opacity: [1, 0],
              scale: [1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <motion.p
        className="text-sm font-medium text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        AI is thinking...
      </motion.p>
    </div>
  );
};

// Full Page Loader
export const FullPageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" variant="brain" />
      <motion.p
        className="mt-6 text-lg font-medium text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>
    </div>
  );
};

// Skeleton Loader
export const SkeletonLoader = ({ className = "", lines = 3 }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-muted rounded-lg overflow-hidden"
          style={{ width: `${100 - i * 15}%` }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
