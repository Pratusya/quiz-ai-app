// src/components/Layout.jsx - Modern Layout with animations

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import Footer from "./Footer";
import Navbar from "./Navbar";

function Layout({ children }) {
  const { theme } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background Pattern */}
      <div className="fixed inset-0 cyber-grid opacity-50 pointer-events-none" />

      {/* Gradient Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <Navbar />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="flex-grow relative z-10"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default Layout;
