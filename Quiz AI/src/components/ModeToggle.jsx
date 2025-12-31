import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = ["light", "dark", "system"];

  const themeConfig = {
    light: {
      icon: Sun,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      label: "Light Mode",
    },
    dark: {
      icon: Moon,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      label: "Dark Mode",
    },
    system: {
      icon: Monitor,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      label: "System",
    },
  };

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />;
  }

  const currentTheme = themeConfig[theme];
  const Icon = currentTheme.icon;

  return (
    <motion.button
      onClick={cycleTheme}
      className={`relative w-10 h-10 rounded-xl ${currentTheme.bg} ${currentTheme.color} flex items-center justify-center overflow-hidden transition-colors duration-300 hover:scale-105 active:scale-95`}
      whileHover={{ rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      title={currentTheme.label}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ y: -30, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 30, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </AnimatePresence>

      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-xl ${currentTheme.bg} blur-md -z-10`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
      />

      <span className="sr-only">Toggle theme: {currentTheme.label}</span>
    </motion.button>
  );
}
