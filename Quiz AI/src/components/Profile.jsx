/**
 * User Profile Page
 * Displays and allows editing of user profile information
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GlassCard } from "./ui/GlassCard";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  CheckCircle,
  Calendar,
  Shield,
  Award,
  Edit3,
  X,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

function Profile() {
  const { user, updateProfile, isLoading, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        phone: user.phoneNumber || user.phone_number || "",
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (formData.username) {
      if (formData.username.length < 3 || formData.username.length > 30) {
        newErrors.username = "Username must be between 3 and 30 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username =
          "Username can only contain letters, numbers, and underscores";
      }
    }

    // Email validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Phone validation
    if (formData.phone) {
      const phoneDigits = formData.phone.replace(/[^\d]/g, "");
      if (phoneDigits.length < 10) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        username: formData.username,
      };

      // Only include email if changed
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }

      // Only include phone if changed
      const currentPhone = user?.phoneNumber || user?.phone_number || "";
      if (formData.phone !== currentPhone) {
        updateData.phone_number = formData.phone || null;
      }

      const result = await updateProfile(updateData);

      if (result.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setAvatarPreview(null);

        // Show warning if email was changed
        if (updateData.email) {
          toast("Email changed! Please verify your new email address.", {
            icon: "⚠️",
            duration: 5000,
          });
        }

        // Refresh user data
        if (refreshUser) await refreshUser();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phoneNumber || user?.phone_number || "",
    });
    setAvatarPreview(null);
    setErrors({});
    setIsEditing(false);
  };

  const getInitials = () => {
    if (!user?.username) return "?";
    return user.username.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-[80vh] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <GlassCard className="p-6 text-center">
              {/* Avatar */}
              <div
                className={`relative mx-auto mb-4 ${
                  isEditing ? "cursor-pointer group" : ""
                }`}
                onClick={handleAvatarClick}
              >
                {avatarPreview || user?.avatar_url ? (
                  <img
                    src={avatarPreview || user?.avatar_url}
                    alt={user?.username}
                    className="w-32 h-32 rounded-2xl object-cover mx-auto ring-4 ring-primary/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center mx-auto ring-4 ring-primary/20">
                    <span className="text-4xl font-bold text-white">
                      {getInitials()}
                    </span>
                  </div>
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold mb-1">{user?.username}</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {user?.email}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                {user?.email_verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Email Not Verified
                  </span>
                )}
                {user?.phone_verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
                    <Phone className="w-3 h-3" />
                    Phone Verified
                  </span>
                ) : (
                  (user?.phoneNumber || user?.phone_number) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                      <Phone className="w-3 h-3" />
                      Phone Not Verified
                    </span>
                  )
                )}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {formatDate(user?.createdAt || user?.created_at)}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* Username */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Username
                  </Label>
                  {isEditing ? (
                    <div>
                      <Input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Your username"
                        className={errors.username ? "border-red-500" : ""}
                      />
                      {errors.username && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.username}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="px-3 py-2 bg-muted/50 rounded-lg">
                      {user?.username || "Not set"}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email Address
                    {user?.email_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </Label>
                  {isEditing ? (
                    <div>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.email}
                        </p>
                      )}
                      {formData.email !== user?.email && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          ⚠️ Changing email will require re-verification
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="px-3 py-2 bg-muted/50 rounded-lg">
                      {user?.email || "Not set"}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Phone Number
                    {user?.phone_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </Label>
                  {isEditing ? (
                    <div>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.phone}
                        </p>
                      )}
                      {formData.phone !==
                        (user?.phoneNumber || user?.phone_number || "") &&
                        formData.phone && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            ⚠️ Changing phone will require re-verification
                          </p>
                        )}
                    </div>
                  ) : (
                    <p className="px-3 py-2 bg-muted/50 rounded-lg">
                      {user?.phoneNumber || user?.phone_number || "Not set"}
                    </p>
                  )}
                </div>

                {/* Account Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    Account Type
                  </Label>
                  <p className="px-3 py-2 bg-muted/50 rounded-lg capitalize">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-4 text-muted-foreground">
                  Quick Actions
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/settings">
                      <Shield className="w-4 h-4 mr-2" />
                      Security Settings
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/results">
                      <Award className="w-4 h-4 mr-2" />
                      My Quiz Results
                    </a>
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
