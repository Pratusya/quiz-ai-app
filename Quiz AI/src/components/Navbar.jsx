// Navbar.jsx - Modern Glass Navigation
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { ModeToggle } from "./ModeToggle";
import {
  Menu,
  X,
  Brain,
  Sparkles,
  Home,
  FileQuestion,
  Image,
  Users,
  BarChart3,
  Trophy,
  Mail,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserDropdown from "./UserDropdown";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    {
      path: "/generate-quiz",
      label: "Create Quiz",
      icon: <FileQuestion className="w-4 h-4" />,
      badge: "AI",
    },
    {
      path: "/multi-modal",
      label: "Multi-Modal",
      icon: <Image className="w-4 h-4" />,
      badge: "New",
    },
    {
      path: "/multiplayer",
      label: "Multiplayer",
      icon: <Users className="w-4 h-4" />,
      badge: "Live",
    },
    {
      path: "/results",
      label: "Results",
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    { path: "/contact", label: "Contact", icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl shadow-lg border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Brain className="w-6 h-6 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold gradient-text">Quiz AI</span>
                <span className="block text-xs text-muted-foreground -mt-1">
                  Powered by AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  current={location.pathname === item.path}
                  icon={item.icon}
                  badge={item.badge}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <ModeToggle />

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-2">
                {isLoading ? (
                  <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                ) : isAuthenticated ? (
                  <UserDropdown />
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="gradient" size="sm" shimmer>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden relative w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="space-y-1">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MobileNavLink
                        to={item.path}
                        current={location.pathname === item.path}
                        icon={item.icon}
                        badge={item.badge}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </MobileNavLink>
                    </motion.div>
                  ))}
                </div>

                {/* Mobile Auth Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-6 border-t border-border/50"
                >
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Signed in
                      </span>
                      <UserDropdown openUpward />
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        to="/login"
                        className="flex-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link
                        to="/register"
                        className="flex-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="gradient" className="w-full" shimmer>
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16 md:h-20" />
    </>
  );
}

function NavLink({ to, current, children, icon, badge }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        current
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      {icon}
      <span>{children}</span>
      {badge && (
        <span
          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
            badge === "New"
              ? "bg-green-500/20 text-green-600 dark:text-green-400"
              : badge === "Live"
              ? "bg-red-500/20 text-red-600 dark:text-red-400"
              : "bg-primary/20 text-primary"
          }`}
        >
          {badge}
        </span>
      )}
      {current && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute inset-0 rounded-xl bg-primary/10 -z-10"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
    </Link>
  );
}

function MobileNavLink({ to, current, onClick, children, icon, badge }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
        current
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-muted/50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${current ? "bg-primary/20" : "bg-muted"}`}
        >
          {icon}
        </div>
        <span className="font-medium">{children}</span>
      </div>
      {badge && (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-lg ${
            badge === "New"
              ? "bg-green-500/20 text-green-600 dark:text-green-400"
              : badge === "Live"
              ? "bg-red-500/20 text-red-600 dark:text-red-400"
              : "bg-primary/20 text-primary"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export default Navbar;
