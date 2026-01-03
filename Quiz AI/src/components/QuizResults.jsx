import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Clock,
  TrendingUp,
  GraduationCap,
  Lightbulb,
  Eye,
  Flame,
  Medal,
  BarChart3,
  RotateCcw,
  Calendar,
  Target,
  Sparkles,
  ChevronRight,
  Star,
  BookOpen,
  Award,
  Zap,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://quiz-ai-app-pqyh.onrender.com";

const DEFAULT_STATS = {
  overall: {
    total_quizzes_taken: 0,
    total_attempts: 0,
    difficulty_levels_attempted: "",
    topics_attempted: "",
    average_score: 0,
    highest_score: 0,
    first_attempt: null,
    last_attempt: null,
  },
  monthly_progress: [],
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Quiz Results Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We encountered an error loading your results. Please try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <RotateCcw className="mr-2 w-4 h-4" /> Refresh Page
            </Button>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-12 w-72 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  </div>
);

// Custom hook for data fetching
const useQuizData = (userId, authLoaded) => {
  const [state, setState] = useState({
    results: [],
    statistics: JSON.parse(JSON.stringify(DEFAULT_STATS)),
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!authLoaded || !userId) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const headers = {
          "Content-Type": "application/json",
          "user-id": userId,
          username: userId,
        };

        // Fetch both quizzes and statistics in parallel
        const [quizzesResponse, statsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/quizzes`, {
            headers,
            signal: controller.signal,
            params: {
              limit: 10,
              page: 1,
              sort: "created_at:desc", // Keep sorting for newest first
            },
          }),
          axios.get(`${API_BASE_URL}/api/statistics`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        // Validate responses
        if (
          quizzesResponse.data?.status !== "success" ||
          !Array.isArray(quizzesResponse.data?.quizzes)
        ) {
          throw new Error("Invalid quiz data received from server");
        }

        if (
          statsResponse.data?.status !== "success" ||
          !statsResponse.data?.statistics?.overall
        ) {
          throw new Error("Invalid statistics data received from server");
        } // Process and validate quiz data
        const processedQuizzes = quizzesResponse.data.quizzes.map((quiz) => ({
          ...quiz,
          created_at: new Date(quiz.created_at),
          highest_score: Number(quiz.highest_score),
          attempts_count: Number(quiz.attempts_count || 0),
          num_questions: Number(quiz.num_questions),
        }));

        // Process and validate statistics
        const processedStats = {
          ...statsResponse.data.statistics,
          overall: {
            ...statsResponse.data.statistics.overall,
            total_quizzes_taken: Number(
              statsResponse.data.statistics.overall.total_quizzes_taken
            ),
            total_attempts: Number(
              statsResponse.data.statistics.overall.total_attempts
            ),
            average_score: Number(
              statsResponse.data.statistics.overall.average_score
            ),
            highest_score: Number(
              statsResponse.data.statistics.overall.highest_score
            ),
            first_attempt: statsResponse.data.statistics.overall.first_attempt
              ? new Date(statsResponse.data.statistics.overall.first_attempt)
              : null,
            last_attempt: statsResponse.data.statistics.overall.last_attempt
              ? new Date(statsResponse.data.statistics.overall.last_attempt)
              : null,
          },
        };

        setState({
          results: processedQuizzes,
          statistics: processedStats,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request cancelled");
          return;
        }
        console.error("Error fetching data:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load quiz results and statistics";

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          statistics: DEFAULT_STATS,
        }));

        toast.error(errorMessage, {
          duration: 4000,
          position: "top-center",
        });
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [userId, authLoaded]);

  return state;
};

const QuizResults = () => {
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const authLoaded = !isLoading;
  const navigate = useNavigate();
  const { results, statistics, loading, error } = useQuizData(
    userId,
    authLoaded
  );

  const getGradeColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "text-emerald-500";
    if (percentage >= 80) return "text-blue-500";
    if (percentage >= 70) return "text-yellow-500";
    if (percentage >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const getGradeBg = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "from-emerald-500 to-green-600";
    if (percentage >= 80) return "from-blue-500 to-cyan-600";
    if (percentage >= 70) return "from-yellow-500 to-amber-600";
    if (percentage >= 60) return "from-orange-500 to-red-500";
    return "from-red-500 to-rose-600";
  };

  const formatLearningJourney = useMemo(() => {
    if (!statistics?.overall)
      return { topics: "None yet", difficulties: "None yet" };

    return {
      topics: statistics.overall.topics_attempted || "None yet",
      difficulties:
        statistics.overall.difficulty_levels_attempted || "None yet",
    };
  }, [statistics]);

  const getValidScore = (score) => {
    return typeof score === "number" && !isNaN(score) ? score : 0;
  };

  if (!authLoaded || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Target className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Results
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <RotateCcw className="mr-2 w-4 h-4" /> Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No Quiz Results Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start your learning journey by taking your first quiz!
          </p>
          <Button
            onClick={() => navigate("/generate-quiz")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="mr-2 w-4 h-4" /> Take Your First Quiz
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <BarChart3 className="w-4 h-4" />
              Performance Analytics
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              Quiz Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Track your progress, analyze your performance, and master new
              topics
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
          >
            {[
              {
                icon: Flame,
                value: statistics?.overall?.total_quizzes_taken || 0,
                label: "Total Quizzes",
                color: "from-orange-500 to-red-500",
                bg: "bg-orange-500/10",
              },
              {
                icon: Target,
                value: statistics?.overall?.total_attempts || 0,
                label: "Practice Sessions",
                color: "from-green-500 to-emerald-500",
                bg: "bg-green-500/10",
              },
              {
                icon: Award,
                value: `${Math.round(
                  statistics?.overall?.average_score || 0
                )}%`,
                label: "Avg. Score",
                color: "from-purple-500 to-violet-500",
                bg: "bg-purple-500/10",
              },
              {
                icon: Trophy,
                value: `${statistics?.overall?.highest_score || 0}%`,
                label: "Best Score",
                color: "from-yellow-500 to-amber-500",
                bg: "bg-yellow-500/10",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div
                  className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} rounded-full blur-2xl -mr-10 -mt-10`}
                />
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Learning Journey Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Learning Journey
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your progress over time
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Quiz
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {statistics?.overall?.first_attempt
                    ? new Date(
                        statistics.overall.first_attempt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not started yet"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Latest Quiz
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {statistics?.overall?.last_attempt
                    ? new Date(
                        statistics.overall.last_attempt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not started yet"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Topics Explored
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatLearningJourney.topics}
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Difficulty Levels
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatLearningJourney.difficulties}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent Results Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Recent Quizzes
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your latest quiz attempts
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/generate-quiz")}
                className="hidden sm:flex"
              >
                <Sparkles className="w-4 h-4 mr-2" /> New Quiz
              </Button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Score Badge */}
                        <div
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${getGradeBg(
                            getValidScore(result.highest_score),
                            result.num_questions
                          )} flex items-center justify-center shadow-lg flex-shrink-0`}
                        >
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-black text-white">
                              {Math.round(
                                (getValidScore(result.highest_score) /
                                  result.num_questions) *
                                  100
                              )}
                              %
                            </p>
                          </div>
                        </div>

                        {/* Quiz Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                {result.topic}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {result.difficulty}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.question_type}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {result.num_questions} questions
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5">
                              <Trophy
                                className={`w-4 h-4 ${getGradeColor(
                                  getValidScore(result.highest_score),
                                  result.num_questions
                                )}`}
                              />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {getValidScore(result.highest_score)}/
                                {result.num_questions}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <RotateCcw className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {result.attempts_count || 0}{" "}
                                {result.attempts_count === 1
                                  ? "attempt"
                                  : "attempts"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(result.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={async () => {
                            try {
                              const response = await axios.get(
                                `${API_BASE_URL}/api/quizzes/${result.id}`,
                                {
                                  headers: {
                                    "Content-Type": "application/json",
                                    "user-id": userId,
                                    username: userId,
                                  },
                                }
                              );

                              if (
                                response.data?.status === "success" &&
                                response.data?.quiz
                              ) {
                                const formattedQuiz = {
                                  ...response.data.quiz,
                                  questions: response.data.quiz.questions.map(
                                    (q) => ({
                                      ...q,
                                      options:
                                        q.options ||
                                        (q.question_type === "True/False"
                                          ? ["True", "False"]
                                          : []),
                                    })
                                  ),
                                };
                                navigate(`/quiz-details/${result.id}`, {
                                  state: { quizData: formattedQuiz },
                                });
                              } else {
                                throw new Error("Failed to fetch quiz details");
                              }
                            } catch (error) {
                              toast.error(
                                "Failed to load quiz details. Please try again."
                              );
                              console.error(
                                "Error fetching quiz details:",
                                error
                              );
                            }
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          <span className="hidden xs:inline">View Details</span>
                          <span className="xs:hidden">View</span>
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <Progress
                          value={
                            (getValidScore(result.highest_score) /
                              result.num_questions) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Mobile New Quiz Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="sm:hidden mt-6"
          >
            <Button
              onClick={() => navigate("/generate-quiz")}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Create New Quiz
            </Button>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default QuizResults;
