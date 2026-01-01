/**
 * Settings Page
 * General app settings and preferences
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { GlassCard } from "./ui/GlassCard";
import { Switch } from "./ui/switch";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Moon,
  Sun,
  Monitor,
  Globe,
  Volume2,
  Eye,
  Palette,
  ChevronRight,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

// Settings storage keys
const SETTINGS_KEYS = {
  NOTIFICATIONS: "quiz-ai-notifications",
  PREFERENCES: "quiz-ai-preferences",
};

// Default settings
const DEFAULT_NOTIFICATIONS = {
  email: true,
  push: true,
  marketing: false,
};

const DEFAULT_PREFERENCES = {
  soundEffects: true,
  animations: true,
  compactMode: false,
};

function Settings() {
  const navigate = useNavigate();
  const { user, resendVerification } = useAuth();
  const { theme, setTheme } = useTheme();

  // Load settings from localStorage
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.PREFERENCES);
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [isResending, setIsResending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  // Save preferences to localStorage and apply them
  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEYS.PREFERENCES,
      JSON.stringify(preferences)
    );

    // Apply animations preference
    if (preferences.animations) {
      document.documentElement.classList.remove("reduce-motion");
    } else {
      document.documentElement.classList.add("reduce-motion");
    }

    // Apply compact mode preference
    if (preferences.compactMode) {
      document.documentElement.classList.add("compact-mode");
    } else {
      document.documentElement.classList.remove("compact-mode");
    }
  }, [preferences]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerification(user?.email);
      if (result.success) {
        toast.success("Verification email sent!");
      } else {
        toast.error(result.error || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsResending(false);
    }
  };

  const handleNotificationChange = (key, checked) => {
    setNotifications((prev) => ({ ...prev, [key]: checked }));
    toast.success(
      `${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${
        checked ? "enabled" : "disabled"
      }`
    );
  };

  const handlePreferenceChange = (key, checked) => {
    setPreferences((prev) => ({ ...prev, [key]: checked }));

    // Show specific toast messages
    const messages = {
      soundEffects: `Sound effects ${checked ? "enabled" : "disabled"}`,
      animations: `Animations ${checked ? "enabled" : "disabled"}`,
      compactMode: `Compact mode ${checked ? "enabled" : "disabled"}`,
    };
    toast.success(messages[key]);
  };

  const handleResetSettings = () => {
    setNotifications(DEFAULT_NOTIFICATIONS);
    setPreferences(DEFAULT_PREFERENCES);
    toast.success("Settings reset to defaults");
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun, description: "Bright theme" },
    { value: "dark", label: "Dark", icon: Moon, description: "Dark theme" },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow system",
    },
  ];

  const settingsSections = [
    {
      title: "Account",
      icon: User,
      items: [
        {
          label: "Edit Profile",
          description: "Update your profile information",
          onClick: () => navigate("/profile"),
          icon: User,
        },
        {
          label: "Security",
          description: "Password and authentication",
          onClick: () => navigate("/settings/security"),
          icon: Shield,
        },
      ],
    },
  ];

  return (
    <div className="min-h-[80vh] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Verification Status */}
          {user && !user.email_verified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-4 border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">
                      Verify Your Email
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please verify your email address to access all features.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleResendVerification}
                      disabled={isResending}
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Theme Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Appearance</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize how Quiz AI looks
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === t.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <t.icon
                      className={`w-6 h-6 mx-auto mb-2 ${
                        theme === t.value
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose what notifications you receive
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive quiz results and updates via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("email", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about quiz invites and reminders
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("push", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">
                      News, tips, and product updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("marketing", checked)
                    }
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your quiz experience
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Sound Effects</p>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for correct/incorrect answers
                    </p>
                  </div>
                  <Switch
                    checked={preferences.soundEffects}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("soundEffects", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Animations</p>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth transitions and effects
                    </p>
                  </div>
                  <Switch
                    checked={preferences.animations}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("animations", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Compact Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Show more content with reduced spacing
                    </p>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("compactMode", checked)
                    }
                  />
                </div>
              </div>

              {/* Reset Button */}
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSettings}
                  className="text-muted-foreground"
                >
                  Reset to Defaults
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Account Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your account details
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium">Edit Profile</p>
                      <p className="text-sm text-muted-foreground">
                        Update your profile information
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                <button
                  onClick={() => navigate("/settings/security")}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium">Security</p>
                      <p className="text-sm text-muted-foreground">
                        Password and authentication settings
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
