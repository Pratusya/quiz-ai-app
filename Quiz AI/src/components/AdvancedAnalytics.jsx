import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useAuth, RedirectToSignIn } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaChartLine,
  FaBrain,
  FaClock,
  FaTrophy,
  FaBullseye,
  FaBook,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
} from "react-icons/fa";

const AdvancedAnalytics = () => {
  const { isSignedIn, userId } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId]);

  const fetchAnalytics = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:5000/api/analytics/comprehensive",
        {
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            username: userId,
          },
        }
      );

      if (response.data.status === "success") {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getMasteryLevel = (score) => {
    if (score >= 90)
      return {
        level: "Expert",
        color: "text-purple-600",
        bg: "bg-purple-100 dark:bg-purple-900/20",
      };
    if (score >= 80)
      return {
        level: "Advanced",
        color: "text-blue-600",
        bg: "bg-blue-100 dark:bg-blue-900/20",
      };
    if (score >= 70)
      return {
        level: "Intermediate",
        color: "text-green-600",
        bg: "bg-green-100 dark:bg-green-900/20",
      };
    if (score >= 60)
      return {
        level: "Beginner",
        color: "text-yellow-600",
        bg: "bg-yellow-100 dark:bg-yellow-900/20",
      };
    return {
      level: "Learning",
      color: "text-gray-600",
      bg: "bg-gray-100 dark:bg-gray-700",
    };
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getPerformanceTrend = (trends) => {
    if (!trends || trends.length < 2)
      return { trend: "stable", icon: FaEquals, color: "text-gray-500" };

    const recent = trends.slice(-3);
    const older = trends.slice(-6, -3);

    if (recent.length === 0 || older.length === 0)
      return { trend: "stable", icon: FaEquals, color: "text-gray-500" };

    const recentAvg =
      recent.reduce((sum, day) => sum + day.average_score, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, day) => sum + day.average_score, 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (difference > 5)
      return { trend: "improving", icon: FaArrowUp, color: "text-green-500" };
    if (difference < -5)
      return { trend: "declining", icon: FaArrowDown, color: "text-red-500" };
    return { trend: "stable", icon: FaEquals, color: "text-gray-500" };
  };

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 sm:p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <FaChartLine className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Analytics Available
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Complete some quizzes to see your learning analytics
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performanceTrend = getPerformanceTrend(analytics.performance_trends);
  const TrendIcon = performanceTrend.icon;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
          Learning Analytics
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Comprehensive insights into your learning progress and performance
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Performance Trend
                </p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <TrendIcon
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${performanceTrend.color}`}
                  />
                  <span
                    className={`text-sm sm:text-lg font-semibold ${performanceTrend.color} capitalize`}
                  >
                    {performanceTrend.trend}
                  </span>
                </div>
              </div>
              <FaChartLine className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 hidden xs:block" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Topics Studied
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {analytics.topic_mastery.length}
                </p>
              </div>
              <FaBook className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 hidden xs:block" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Avg. Performance
                </p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {analytics.difficulty_stats.length > 0
                    ? Math.round(
                        analytics.difficulty_stats.reduce(
                          (sum, stat) => sum + parseFloat(stat.average_score),
                          0
                        ) / analytics.difficulty_stats.length
                      )
                    : 0}
                  %
                </p>
              </div>
              <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 hidden xs:block" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Active Days
                </p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {analytics.performance_trends.length}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Last 30 days
                </p>
              </div>
              <FaCalendarAlt className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 hidden xs:block" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
        {/* Topic Mastery */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FaBrain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              Topic Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {analytics.topic_mastery.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {analytics.topic_mastery.slice(0, 10).map((topic, index) => {
                  const mastery = getMasteryLevel(topic.mastery_level);
                  return (
                    <div key={index} className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {topic.topic}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Badge
                            className={`${mastery.bg} ${mastery.color} text-[10px] sm:text-xs`}
                          >
                            {mastery.level}
                          </Badge>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {Math.round(topic.mastery_level)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={topic.mastery_level}
                          className="flex-1 h-1.5 sm:h-2"
                        />
                        <span className="text-[10px] sm:text-xs text-gray-500 w-14 sm:w-16 text-right">
                          {topic.total_attempts} attempts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm">
                No topic data available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Difficulty Performance */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FaBullseye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Difficulty Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {analytics.difficulty_stats.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {analytics.difficulty_stats.map((stat, index) => (
                  <div key={index} className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getDifficultyColor(
                            stat.difficulty
                          )}`}
                        ></div>
                        <span className="font-medium capitalize text-sm sm:text-base">
                          {stat.difficulty}
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {Math.round(stat.average_score)}%
                      </span>
                    </div>
                    <Progress
                      value={stat.average_score}
                      className="h-1.5 sm:h-2"
                    />
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {stat.attempts} attempts
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm">
                No difficulty data available yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Timeline */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="hidden xs:inline">
              Performance Timeline (Last 30 Days)
            </span>
            <span className="xs:hidden">Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {analytics.performance_trends.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-5 xs:grid-cols-7 gap-1 sm:gap-2 mb-4 overflow-x-auto">
                {analytics.performance_trends.slice(-21).map((day, index) => (
                  <div key={index} className="text-center min-w-0">
                    <div
                      className={`w-full h-10 sm:h-16 rounded flex items-center justify-center text-white text-[10px] sm:text-sm font-medium ${
                        day.average_score >= 80
                          ? "bg-green-500"
                          : day.average_score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      title={`${formatDate(day.date)}: ${Math.round(
                        day.average_score
                      )}% (${day.quiz_count} quizzes)`}
                    >
                      {Math.round(day.average_score)}%
                    </div>
                    <p className="text-[8px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                      {formatDate(day.date)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded"></div>
                  <span>80%+ (Excellent)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded"></div>
                  <span>60-79% (Good)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded"></div>
                  <span>&lt;60% (Needs Work)</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm">
              No recent performance data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Time Analysis */}
      {analytics.time_analysis.length > 0 && (
        <Card className="mt-4 sm:mt-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              Time Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-6">
              {analytics.time_analysis.map((timeData, index) => (
                <div
                  key={index}
                  className="text-center p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getDifficultyColor(
                      timeData.difficulty
                    )} mx-auto mb-1.5 sm:mb-2 flex items-center justify-center`}
                  >
                    <FaClock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-base">
                    {timeData.difficulty}
                  </h4>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-0.5 sm:mt-1">
                    {Math.round(timeData.avg_time_per_question)}s
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    avg per question
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
