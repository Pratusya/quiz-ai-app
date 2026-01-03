/**
 * User Profile Dropdown Component
 * Shows user avatar and dropdown menu with profile options
 */

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Shield,
  Bell,
  Moon,
  Sun,
  Monitor,
  Palette,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

function UserDropdown({ openUpward = false }) {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/");
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.username) return "?";
    return user.username.slice(0, 2).toUpperCase();
  };

  // Theme options
  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/50 transition-colors"
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar */}
        <div className="relative">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-sm font-bold text-white">
                {getInitials()}
              </span>
            </div>
          )}

          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 w-72 rounded-xl bg-card border border-border shadow-xl overflow-hidden z-50 ${
              openUpward ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {getInitials()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user?.username}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Email verification status */}
              {!user?.email_verified && (
                <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Email not verified.{" "}
                    <Link to="/settings" className="underline">
                      Verify now
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <MenuItem
                icon={User}
                label="Profile"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/profile");
                }}
              />
              <MenuItem
                icon={Settings}
                label="Settings"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/settings");
                }}
              />
              <MenuItem
                icon={Shield}
                label="Security"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/settings/security");
                }}
              />
            </div>

            {/* Theme Selector */}
            <div className="p-2 border-t border-border">
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Theme
              </p>
              <div className="flex gap-1 px-2">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      theme === t.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-border">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Menu item component
function MenuItem({ icon: Icon, label, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
          {badge}
        </span>
      )}
    </button>
  );
}

export default UserDropdown;
