// src/components/ui/AnimatedText.jsx
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Animated gradient text with letter-by-letter animation
export const AnimatedHeading = ({
  children,
  className = "",
  delay = 0,
  gradient = true,
}) => {
  const text = typeof children === "string" ? children : "";
  const letters = text.split("");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: delay,
      },
    },
  };

  const letter = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.h1
      className={cn("font-bold", gradient && "gradient-text", className)}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((char, index) => (
        <motion.span key={index} variants={letter} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

// Typewriter effect
export const TypewriterText = ({
  text,
  className = "",
  speed = 50,
  delay = 0,
}) => {
  const [displayedText, setDisplayedText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  React.useEffect(() => {
    if (!started || currentIndex >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(currentIndex + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, started]);

  return (
    <span className={className}>
      {displayedText}
      <motion.span
        className="inline-block w-0.5 h-[1em] bg-primary ml-1"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </span>
  );
};

// Word by word reveal
export const WordReveal = ({ children, className = "", delay = 0 }) => {
  const text = typeof children === "string" ? children : "";
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: delay,
      },
    },
  };

  const word = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(10px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.p
      className={cn("flex flex-wrap", className)}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((w, index) => (
        <motion.span key={index} variants={word} className="mr-2 inline-block">
          {w}
        </motion.span>
      ))}
    </motion.p>
  );
};

// Counting animation for numbers
export const CountUp = ({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Glowing text effect
export const GlowingText = ({
  children,
  className = "",
  color = "primary",
}) => {
  return (
    <motion.span
      className={cn("relative inline-block glow-text", className)}
      animate={{
        textShadow: [
          `0 0 10px hsl(var(--${color}) / 0.5), 0 0 20px hsl(var(--${color}) / 0.3)`,
          `0 0 20px hsl(var(--${color}) / 0.8), 0 0 40px hsl(var(--${color}) / 0.5)`,
          `0 0 10px hsl(var(--${color}) / 0.5), 0 0 20px hsl(var(--${color}) / 0.3)`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
};

// Scrolling text marquee
export const Marquee = ({
  children,
  className = "",
  speed = 20,
  pauseOnHover = true,
}) => {
  return (
    <div className={cn("overflow-hidden whitespace-nowrap", className)}>
      <motion.div
        className={cn(
          "inline-flex gap-8",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};

// Split text reveal animation
export const SplitReveal = ({
  children,
  className = "",
  direction = "up", // up, down, left, right
}) => {
  const text = typeof children === "string" ? children : "";

  const directionVariants = {
    up: { y: 100 },
    down: { y: -100 },
    left: { x: 100 },
    right: { x: -100 },
  };

  return (
    <span className={cn("overflow-hidden inline-block", className)}>
      <motion.span
        className="inline-block"
        initial={{ ...directionVariants[direction], opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
      >
        {text}
      </motion.span>
    </span>
  );
};

export default AnimatedHeading;
