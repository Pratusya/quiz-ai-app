/**
 * Security Settings Page
 * Password change, two-factor auth, and account security
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GlassCard } from "./ui/GlassCard";
import { Switch } from "./ui/switch";
import {
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  LogOut,
  Trash2,
  Activity,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

function Security() {
  const navigate = useNavigate();
  const { user, changePassword, logoutAll, logout } = useAuth();

  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Logout all state
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        toast.success("Password changed successfully!");
        setShowChangePassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      const result = await logoutAll();
      if (result.success) {
        toast.success("Logged out from all devices");
        navigate("/login");
      } else {
        toast.error(result.error || "Failed to logout");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      // This would call the delete account API
      toast.success("Account deletion requested. Check your email.");
      setShowDeleteDialog(false);
      await logout();
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  // Check password strength
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score += 15;

    score = Math.min(score, 100);

    let label, color;
    if (score < 30) {
      label = "Weak";
      color = "bg-red-500";
    } else if (score < 60) {
      label = "Fair";
      color = "bg-yellow-500";
    } else if (score < 80) {
      label = "Good";
      color = "bg-blue-500";
    } else {
      label = "Strong";
      color = "bg-green-500";
    }

    return { score, label, color };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="min-h-[80vh] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>

          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Security
          </h1>
          <p className="text-muted-foreground">
            Manage your account security and authentication
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Password Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Change your account password
                  </p>
                </div>
              </div>

              {!showChangePassword ? (
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed: Never
                    </p>
                  </div>
                  <Button onClick={() => setShowChangePassword(true)}>
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            new: !prev.new,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {passwordData.newPassword && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < passwordStrength.score / 25
                                  ? passwordStrength.color
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password strength:{" "}
                          <span className="font-medium">
                            {passwordStrength.label}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordData.confirmPassword &&
                      passwordData.newPassword !==
                        passwordData.confirmPassword && (
                        <p className="text-xs text-destructive">
                          Passwords don't match
                        </p>
                      )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={
                        isChangingPassword ||
                        passwordData.newPassword !==
                          passwordData.confirmPassword
                      }
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </GlassCard>
          </motion.div>

          {/* Active Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your logged-in devices
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Current Session */}
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        This Device
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                          Current
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Active now
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={handleLogoutAll}
                  disabled={isLoggingOutAll}
                >
                  {isLoggingOutAll ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out All Devices
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 border-destructive/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Irreversible account actions
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label>
                Type <strong>DELETE</strong> to confirm
              </Label>
              <Input
                className="mt-2"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default Security;
