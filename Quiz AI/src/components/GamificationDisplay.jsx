import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaTrophy,
  FaMedal,
  FaFire,
  FaStar,
  FaGraduationCap,
  FaChartLine,
  FaGem,
} from "react-icons/fa";
import { Sparkles, Trophy, Target, Zap } from "lucide-react";

const GamificationDisplay = ({ compact = false }) => {
  const { isSignedIn, userId } = useAuth();
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchGamificationData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchGamificationData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:5000/api/gamification",
        {
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            username: userId,
          },
          timeout: 5000, // 5 second timeout
        }
      );

      if (response.data.status === "success") {
        setGamificationData(response.data.data);
        setError(false);
      }
    } catch (error) {
      console.error("Failed to fetch gamification data:", error);
      setError(true);
      // Don't show toast for network errors to avoid spamming
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (category) => {
    switch (category) {
      case "milestone":
        return <FaTrophy className="w-4 h-4" />;
      case "achievement":
        return <FaMedal className="w-4 h-4" />;
      case "streak":
        return <FaFire className="w-4 h-4" />;
      case "level":
        return <FaStar className="w-4 h-4" />;
      default:
        return <FaGem className="w-4 h-4" />;
    }
  };

  const getBadgeColor = (category) => {
    switch (category) {
      case "milestone":
        return "bg-yellow-500";
      case "achievement":
        return "bg-purple-500";
      case "streak":
        return "bg-orange-500";
      case "level":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show fallback UI when backend is unavailable
  if (error || !gamificationData) {
    if (compact) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/80 to-purple-600/80 backdrop-blur-sm text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border border-white/10"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/20">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-semibold text-sm sm:text-base">
                Your Progress
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">
            Complete quizzes to earn XP, level up, and unlock achievements!
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
              <span>Earn badges</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-300" />
              <span>Track progress</span>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-purple-600 p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/20">
                <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">
                  Track Your Progress
                </h3>
                <p className="text-white/80 text-xs sm:text-sm">
                  Start your learning journey
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="text-center py-4 sm:py-6">
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </motion.div>
              <h4 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">
                Ready to Begin?
              </h4>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto mb-4 sm:mb-6">
                Complete quizzes to earn XP, level up, and unlock amazing
                achievements and badges!
              </p>

              {/* Preview of what they can earn */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  {
                    icon: <Trophy className="w-5 h-5" />,
                    label: "Earn Badges",
                    color: "text-yellow-500 bg-yellow-500/10",
                  },
                  {
                    icon: <FaFire className="w-5 h-5" />,
                    label: "Build Streaks",
                    color: "text-orange-500 bg-orange-500/10",
                  },
                  {
                    icon: <Zap className="w-5 h-5" />,
                    label: "Gain XP",
                    color: "text-blue-500 bg-blue-500/10",
                  },
                  {
                    icon: <Target className="w-5 h-5" />,
                    label: "Level Up",
                    color: "text-green-500 bg-green-500/10",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${item.color}`}
                  >
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                      {React.cloneElement(item.icon, {
                        className: "w-4 h-4 sm:w-5 sm:h-5",
                      })}
                      <span className="text-[10px] sm:text-xs font-medium">
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-3 sm:p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaGraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">
              Level {gamificationData.current_level}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <FaStar className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
            <span className="text-xs sm:text-sm font-medium">
              {gamificationData.total_xp} XP
            </span>
          </div>
        </div>
        <div className="mb-1.5 sm:mb-2">
          <div className="flex justify-between text-[10px] sm:text-xs mb-1">
            <span>Progress to Level {gamificationData.current_level + 1}</span>
            <span>{Math.round(gamificationData.progress_to_next_level)}%</span>
          </div>
          <Progress
            value={gamificationData.progress_to_next_level}
            className="h-1.5 sm:h-2 bg-white/20"
          />
        </div>
        {gamificationData.badges && gamificationData.badges.length > 0 && (
          <div className="flex gap-1">
            {gamificationData.badges.slice(0, 3).map((badge, index) => (
              <div
                key={index}
                className={`${getBadgeColor(
                  badge.category
                )} p-1 rounded text-white text-[10px] sm:text-xs flex items-center gap-1`}
                title={badge.name}
              >
                {getBadgeIcon(badge.category)}
              </div>
            ))}
            {gamificationData.badges.length > 3 && (
              <div className="bg-gray-600 p-1 rounded text-white text-[10px] sm:text-xs">
                +{gamificationData.badges.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* Level and XP Display */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  Level {gamificationData.current_level}
                </h3>
                <p className="text-purple-100 text-sm sm:text-base">
                  Total XP: {gamificationData.total_xp}
                </p>
              </div>
              <FaGraduationCap className="w-8 h-8 sm:w-12 sm:h-12 text-purple-200" />
            </div>
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                <span>
                  Progress to Level {gamificationData.current_level + 1}
                </span>
                <span>
                  {Math.round(gamificationData.progress_to_next_level)}%
                </span>
              </div>
              <Progress
                value={gamificationData.progress_to_next_level}
                className="h-2 sm:h-3 bg-white/20"
              />
              <p className="text-[10px] sm:text-xs text-purple-100 mt-1.5 sm:mt-2">
                {gamificationData.next_level_xp -
                  (gamificationData.total_xp % 1000)}{" "}
                XP to next level
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FaTrophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                {gamificationData.total_quizzes_completed}
              </div>
              <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
                Quizzes Completed
              </div>
            </div>

            <div className="text-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FaMedal className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">
                {gamificationData.total_perfect_scores}
              </div>
              <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                Perfect Scores
              </div>
            </div>

            <div className="text-center p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <FaFire className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-lg sm:text-2xl font-bold text-orange-700 dark:text-orange-300">
                {gamificationData.current_streak}
              </div>
              <div className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400">
                Current Streak
              </div>
            </div>

            <div className="text-center p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FaStar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                {gamificationData.badges?.length || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400">
                Badges Earned
              </div>
            </div>
          </div>

          {/* Badges Section */}
          {gamificationData.badges && gamificationData.badges.length > 0 && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <FaMedal className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                Recent Badges
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {gamificationData.badges.slice(0, 6).map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <div
                      className={`${getBadgeColor(
                        badge.category
                      )} p-1.5 sm:p-2 rounded-full text-white`}
                    >
                      {getBadgeIcon(badge.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm truncate">
                        {badge.name}
                      </h5>
                      <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 truncate">
                        {badge.description}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] sm:text-xs hidden xs:inline-flex"
                    >
                      {badge.category}
                    </Badge>
                  </div>
                ))}
              </div>
              {gamificationData.badges.length > 6 && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                  And {gamificationData.badges.length - 6} more badges...
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationDisplay;
