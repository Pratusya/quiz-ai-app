import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  X,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  Clock,
  History,
  Trophy,
  Calendar,
  Percent,
  RotateCcw,
  Share2,
  Printer,
  Eye,
  EyeOff,
  Star,
  StarHalf,
  User,
  Target,
  Award,
  Sparkles,
  ChevronLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Zap,
} from "lucide-react";

const QuizDetails = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const authLoaded = !authLoading;

  // State management
  const [quiz, setQuiz] = useState(location.state?.quizData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0, attempts: 0 });
  const [latestUserAnswers, setLatestUserAnswers] = useState([]);
  const [retrying, setRetrying] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(0);

  // Memoized calculations
  const scorePercentage = useMemo(() => {
    return score.total > 0
      ? Math.round((score.correct / score.total) * 100)
      : 0;
  }, [score.correct, score.total]);

  const difficultyColor = useMemo(() => {
    switch (quiz?.difficulty?.toLowerCase()) {
      case "easy":
        return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
      case "hard":
        return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300";
    }
  }, [quiz?.difficulty]);

  const performanceRating = useMemo(() => {
    if (scorePercentage >= 90) return { stars: 5, label: "Excellent" };
    if (scorePercentage >= 80) return { stars: 4, label: "Good" };
    if (scorePercentage >= 70) return { stars: 3, label: "Average" };
    if (scorePercentage >= 60) return { stars: 2, label: "Below Average" };
    return { stars: 1, label: "Needs Improvement" };
  }, [scorePercentage]);

  // Ensure all questions have options array - moved here to be before early returns
  const questions = useMemo(() => {
    if (!quiz?.questions || !Array.isArray(quiz.questions)) {
      return [];
    }
    return quiz.questions.map((question) => ({
      ...question,
      options:
        question.options ||
        (quiz.question_type === "True/False" ? ["True", "False"] : []),
    }));
  }, [quiz?.questions, quiz?.question_type]);

  // Calculate score from user answers - moved before fetchQuizDetails
  const calculateScoreFromAnswers = useCallback(
    (userAnswers, questions) => {
      if (
        !userAnswers ||
        !questions ||
        !Array.isArray(userAnswers) ||
        !Array.isArray(questions)
      ) {
        return { correct: 0, total: questions?.length || 0 };
      }

      let correct = 0;
      const total = questions.length;

      questions.forEach((question, index) => {
        if (userAnswers[index] !== null && userAnswers[index] !== undefined) {
          // Check if answer is correct using the same logic
          const userAnswer = userAnswers[index];
          const correctAnswer = question.correctAnswer;

          // For True/False questions
          if (quiz?.question_type === "True/False") {
            let userBool, correctBool;

            if (typeof userAnswer === "boolean") {
              userBool = userAnswer;
            } else if (typeof userAnswer === "string") {
              userBool = userAnswer.toLowerCase() === "true";
            } else if (typeof userAnswer === "number") {
              userBool = userAnswer === 0;
            } else {
              return;
            }

            if (typeof correctAnswer === "boolean") {
              correctBool = correctAnswer;
            } else if (typeof correctAnswer === "string") {
              correctBool = correctAnswer.toLowerCase() === "true";
            } else if (typeof correctAnswer === "number") {
              correctBool = correctAnswer === 0;
            } else {
              return;
            }

            if (userBool === correctBool) correct++;
          } else {
            // For MCQ questions
            if (
              typeof userAnswer === "number" &&
              typeof correctAnswer === "number"
            ) {
              if (userAnswer === correctAnswer) correct++;
            } else if (typeof userAnswer === "string" && question.options) {
              const userAnswerIndex = question.options.findIndex(
                (option) => option.toLowerCase() === userAnswer.toLowerCase()
              );
              if (userAnswerIndex === correctAnswer) correct++;
            } else if (userAnswer === correctAnswer) {
              correct++;
            }
          }
        }
      });

      return { correct, total };
    },
    [quiz?.question_type]
  );

  // Fetch quiz details function
  const fetchQuizDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to use quiz data from navigation state first
      if (
        location.state?.quizData &&
        location.state.quizData.id === parseInt(quizId)
      ) {
        const quizData = location.state.quizData;
        setQuiz(quizData);
        setScore({
          correct: quizData.highest_score || 0,
          total: quizData.num_questions,
          attempts: quizData.attempt_history?.length || 0,
        });

        // Set latest user answers
        if (quizData.attempt_history?.length > 0) {
          const latestAttempt = quizData.attempt_history[0];

          // Convert from database format to simple array format
          let userAnswers;
          if (Array.isArray(latestAttempt.user_answers)) {
            // Check if it's the new format (array of objects)
            if (
              latestAttempt.user_answers.length > 0 &&
              typeof latestAttempt.user_answers[0] === "object" &&
              latestAttempt.user_answers[0] !== null &&
              "questionIndex" in latestAttempt.user_answers[0]
            ) {
              // New format: convert to simple array
              userAnswers = new Array(quizData.questions.length).fill(null);
              latestAttempt.user_answers.forEach((answerObj) => {
                if (answerObj && typeof answerObj.questionIndex === "number") {
                  userAnswers[answerObj.questionIndex] = answerObj.answer;
                }
              });
            } else {
              // Old format: use as is
              userAnswers = latestAttempt.user_answers;
            }
          } else {
            userAnswers = new Array(quizData.questions.length).fill(null);
          }

          console.log("Debug - User answers from navigation state:", {
            originalFormat: latestAttempt.user_answers,
            convertedFormat: userAnswers,
            attemptHistory: quizData.attempt_history,
            latestAttempt,
          });

          setLatestUserAnswers(userAnswers);

          // Calculate the actual score from user answers
          const calculatedScore = calculateScoreFromAnswers(
            userAnswers,
            quizData.questions
          );
          setScore({
            correct: calculatedScore.correct,
            total: calculatedScore.total,
            attempts: quizData.attempt_history?.length || 0,
          });
        } else {
          setLatestUserAnswers(new Array(quizData.questions.length).fill(null));
          setScore({
            correct: 0,
            total: quizData.num_questions,
            attempts: 0,
          });
        }
        setLoading(false);
        return;
      }

      // Fetch from API
      if (!userId) {
        throw new Error("User authentication required");
      }

      const API_URL =
        import.meta.env.VITE_API_URL || "https://quiz-ai-app-pqyh.onrender.com";
      const response = await axios.get(`${API_URL}/api/quizzes/${quizId}`, {
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
          username: userId,
        },
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 404) {
        throw new Error("Quiz not found");
      }

      if (response.status >= 400) {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.data?.status === "success" || !response.data?.quiz) {
        throw new Error("Invalid response format received from server");
      }

      const quizData = response.data.quiz;

      if (
        !Array.isArray(quizData.questions) ||
        quizData.questions.length === 0
      ) {
        throw new Error("Quiz data is missing questions");
      }

      // Helper function to normalize correctAnswer to numeric index
      const normalizeCorrectAnswer = (question, questionType) => {
        const { correctAnswer, options } = question;

        // If already a valid number, return it
        if (
          typeof correctAnswer === "number" &&
          correctAnswer >= 0 &&
          correctAnswer < (options?.length || 4)
        ) {
          return correctAnswer;
        }

        // For True/False questions
        if (questionType === "True/False") {
          if (typeof correctAnswer === "boolean") {
            return correctAnswer ? 0 : 1;
          }
          if (typeof correctAnswer === "string") {
            return correctAnswer.toLowerCase() === "true" ? 0 : 1;
          }
          return 0;
        }

        // For MCQ/Fill in Blanks - if correctAnswer is text, find its index in options
        if (typeof correctAnswer === "string" && Array.isArray(options)) {
          const foundIndex = options.findIndex(
            (opt) =>
              String(opt).toLowerCase().trim() ===
              String(correctAnswer).toLowerCase().trim()
          );
          if (foundIndex !== -1) {
            return foundIndex;
          }
          // Try parsing as number
          const parsed = parseInt(correctAnswer, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < options.length) {
            return parsed;
          }
        }

        return 0; // Default to first option
      };

      // Format quiz data with normalized correctAnswer
      const formattedQuizData = {
        ...quizData,
        questions: quizData.questions.map((q) => ({
          ...q,
          options:
            q.options ||
            (quizData.question_type === "True/False" ? ["True", "False"] : []),
          correctAnswer: normalizeCorrectAnswer(q, quizData.question_type),
        })),
      };

      setQuiz(formattedQuizData);

      // Set latest user answers
      if (formattedQuizData.attempt_history?.length > 0) {
        const latestAttempt = formattedQuizData.attempt_history[0];

        // Convert from database format to simple array format
        let userAnswers;
        if (Array.isArray(latestAttempt.user_answers)) {
          // Check if it's the new format (array of objects)
          if (
            latestAttempt.user_answers.length > 0 &&
            typeof latestAttempt.user_answers[0] === "object" &&
            latestAttempt.user_answers[0] !== null &&
            "questionIndex" in latestAttempt.user_answers[0]
          ) {
            // New format: convert to simple array
            userAnswers = new Array(formattedQuizData.questions.length).fill(
              null
            );
            latestAttempt.user_answers.forEach((answerObj) => {
              if (answerObj && typeof answerObj.questionIndex === "number") {
                userAnswers[answerObj.questionIndex] = answerObj.answer;
              }
            });
          } else {
            // Old format: use as is
            userAnswers = latestAttempt.user_answers;
          }
        } else {
          userAnswers = new Array(formattedQuizData.questions.length).fill(
            null
          );
        }

        console.log("Debug - User answers from API:", {
          originalFormat: latestAttempt.user_answers,
          convertedFormat: userAnswers,
          attemptHistory: formattedQuizData.attempt_history,
          latestAttempt,
          formattedQuizData,
        });

        setLatestUserAnswers(userAnswers);

        // Calculate the actual score from user answers
        const calculatedScore = calculateScoreFromAnswers(
          userAnswers,
          formattedQuizData.questions
        );
        setScore({
          correct: calculatedScore.correct,
          total: calculatedScore.total,
          attempts: formattedQuizData.attempt_history?.length || 0,
        });
      } else {
        setLatestUserAnswers(
          new Array(formattedQuizData.questions.length).fill(null)
        );
        setScore({
          correct: 0,
          total:
            formattedQuizData.num_questions ||
            formattedQuizData.questions.length,
          attempts: formattedQuizData.attempt_history?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching quiz details:", error);

      let errorMessage;
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage =
          "Could not reach the server. Please check your connection.";
      } else {
        errorMessage =
          error.message || "Failed to load quiz details. Please try again.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [quizId, userId, location.state, calculateScoreFromAnswers]);

  // Retry fetch function
  const retryFetch = useCallback(async () => {
    setRetrying(true);
    try {
      await fetchQuizDetails();
    } finally {
      setRetrying(false);
    }
  }, [fetchQuizDetails]);
  // Effect for fetching quiz details
  useEffect(() => {
    if (quizId && userId) {
      fetchQuizDetails();
    } else if (!userId && authLoaded) {
      setError("Please sign in to view quiz details");
      setLoading(false);
    }
  }, [quizId, userId, authLoaded, fetchQuizDetails]);

  // Utility functions
  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  }, []);

  const getUserAnswerText = useCallback(
    (questionIndex, question) => {
      if (!question.options || !Array.isArray(question.options)) {
        return "N/A";
      }

      const userAnswer = latestUserAnswers[questionIndex];

      if (userAnswer === null || userAnswer === undefined) {
        return "Not answered";
      }

      // If userAnswer is a number (index), use it to get the option
      if (
        typeof userAnswer === "number" &&
        userAnswer >= 0 &&
        userAnswer < question.options.length
      ) {
        return question.options[userAnswer];
      }

      // If userAnswer is a string, try to find it in options
      if (typeof userAnswer === "string") {
        const optionIndex = question.options.findIndex(
          (option) => option.toLowerCase() === userAnswer.toLowerCase()
        );
        if (optionIndex !== -1) {
          return question.options[optionIndex];
        }
        // If exact match not found, return the string itself
        return userAnswer;
      }

      // If userAnswer is boolean (for True/False questions)
      if (typeof userAnswer === "boolean") {
        return userAnswer ? "True" : "False";
      }

      console.log("Debug - Unexpected userAnswer format:", {
        questionIndex,
        userAnswer,
        type: typeof userAnswer,
        options: question.options,
      });

      return "N/A";
    },
    [latestUserAnswers]
  );

  const isUserAnswerCorrect = useCallback(
    (questionIndex, question) => {
      const userAnswer = latestUserAnswers[questionIndex];

      if (userAnswer === null || userAnswer === undefined) {
        return false;
      }

      const correctAnswer = question.correctAnswer;

      // For True/False questions, handle boolean vs string comparison
      if (quiz?.question_type === "True/False") {
        // Convert everything to boolean for comparison
        let userBool, correctBool;

        if (typeof userAnswer === "boolean") {
          userBool = userAnswer;
        } else if (typeof userAnswer === "string") {
          userBool = userAnswer.toLowerCase() === "true";
        } else if (typeof userAnswer === "number") {
          userBool = userAnswer === 0; // 0 = True, 1 = False typically
        } else {
          return false;
        }

        if (typeof correctAnswer === "boolean") {
          correctBool = correctAnswer;
        } else if (typeof correctAnswer === "string") {
          correctBool = correctAnswer.toLowerCase() === "true";
        } else if (typeof correctAnswer === "number") {
          correctBool = correctAnswer === 0; // 0 = True, 1 = False typically
        } else {
          return false;
        }

        return userBool === correctBool;
      }

      // For MCQ questions, compare indices
      if (typeof userAnswer === "number" && typeof correctAnswer === "number") {
        return userAnswer === correctAnswer;
      }

      // If userAnswer is string, find its index and compare
      if (typeof userAnswer === "string" && question.options) {
        const userAnswerIndex = question.options.findIndex(
          (option) => option.toLowerCase() === userAnswer.toLowerCase()
        );
        return userAnswerIndex === correctAnswer;
      }

      // Fallback: direct comparison
      return userAnswer === correctAnswer;
    },
    [latestUserAnswers, quiz?.question_type]
  );

  const isUserSelectedOption = useCallback(
    (questionIndex, optionIndex, question) => {
      const userAnswer = latestUserAnswers[questionIndex];

      if (userAnswer === null || userAnswer === undefined) {
        return false;
      }

      // If userAnswer is a number (index), compare directly
      if (typeof userAnswer === "number") {
        return userAnswer === optionIndex;
      }

      // If userAnswer is a string, compare with the option text
      if (typeof userAnswer === "string" && question.options) {
        return (
          question.options[optionIndex]?.toLowerCase() ===
          userAnswer.toLowerCase()
        );
      }

      // For True/False questions with boolean answers
      if (
        typeof userAnswer === "boolean" &&
        quiz?.question_type === "True/False"
      ) {
        const optionText = question.options[optionIndex];
        return (
          (userAnswer && optionText === "True") ||
          (!userAnswer && optionText === "False")
        );
      }

      return false;
    },
    [latestUserAnswers, quiz?.question_type]
  );

  const handleRetakeQuiz = useCallback(async () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      toast.error("Quiz data not available for retaking");
      return;
    }

    try {
      // Show confirmation dialog
      const confirmRetake = window.confirm(
        "Are you sure you want to retake this quiz? This will start a new attempt."
      );

      if (!confirmRetake) {
        return;
      }

      // Navigate to QuizGenerator with the quiz data
      // We'll pass the quiz data so it can be loaded for retaking
      navigate("/generate-quiz", {
        state: {
          retakeMode: true,
          quizData: {
            id: quiz.id,
            topic: quiz.topic,
            numQuestions: quiz.num_questions,
            difficulty: quiz.difficulty,
            questionType: quiz.question_type,
            language: quiz.language || "english",
            questions: quiz.questions.map((q) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            })),
          },
        },
      });

      toast.success("Loading quiz for retaking...");
    } catch (error) {
      console.error("Error preparing quiz retake:", error);
      toast.error("Failed to prepare quiz for retaking");
    }
  }, [quiz, navigate]);

  const getTimeTaken = useCallback((seconds) => {
    if (!seconds || seconds <= 0) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quiz: ${quiz?.topic || "Quiz Details"}`,
          text: `Check out my quiz results: ${score.correct}/${score.total} (${scorePercentage}%)`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
        toast.error("Could not share quiz details");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Quiz link copied to clipboard!");
      } catch (error) {
        toast.error("Could not copy link to clipboard");
      }
    }
  }, [quiz?.topic, score.correct, score.total, scorePercentage]);

  // Render performance stars
  const renderStars = useCallback((rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        );
      } else if (i - 0.5 <= rating) {
        stars.push(
          <StarHalf
            key={i}
            className="w-5 h-5 text-yellow-400 fill-yellow-400"
          />
        );
      } else {
        stars.push(
          <Star key={i} className="w-5 h-5 text-gray-300 dark:text-gray-600" />
        );
      }
    }
    return stars;
  }, []);

  // Early returns for various states
  if (!authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to view quiz details and track your progress.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Go to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500 border-t-transparent"
          />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Quiz Details
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we fetch your quiz information...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
            Error Loading Quiz
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={retryFetch}
              disabled={retrying}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {retrying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Retrying...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 w-4 h-4" />
                  Try Again
                </>
              )}
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ChevronLeft className="mr-2 w-4 h-4" />
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Lightbulb className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Quiz Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {quiz
              ? "This quiz doesn't have any questions yet."
              : "The requested quiz could not be found."}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl"
        />
      </div>

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                >
                  <Brain className="w-6 h-6 text-white" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Quiz Details
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                Comprehensive analysis of your quiz performance
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all"
                >
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Share</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all"
                >
                  <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Print</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-green-400 transition-all"
                >
                  {showCorrectAnswers ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {showCorrectAnswers ? "Hide" : "Show"} Answers
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Quiz Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mb-6 sm:mb-8 overflow-hidden shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
            <CardHeader className="relative pb-4 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0"
                    >
                      <BookOpen className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {quiz.topic}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full">
                          <Calendar className="w-4 h-4" />
                          Created {formatDate(quiz.created_at)}
                        </div>
                        {quiz.language && quiz.language !== "english" && (
                          <Badge
                            variant="secondary"
                            className="capitalize bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          >
                            {quiz.language}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="flex items-center justify-center lg:justify-end gap-1 mb-1">
                    {renderStars(performanceRating.stars)}
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {performanceRating.label}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Quiz Information */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-4 rounded-xl shadow-sm border border-blue-200/50 dark:border-blue-700/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Difficulty
                        </span>
                      </div>
                      <Badge className={`${difficultyColor} font-semibold`}>
                        {quiz.difficulty}
                      </Badge>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 p-4 rounded-xl shadow-sm border border-amber-200/50 dark:border-amber-700/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                          <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Type
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {quiz.question_type}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 p-4 rounded-xl shadow-sm border border-green-200/50 dark:border-green-700/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Questions
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {quiz.num_questions}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-4 rounded-xl shadow-sm border border-purple-200/50 dark:border-purple-700/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                          <History className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Attempts
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {score.attempts}
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* Performance Summary */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl shadow-lg border border-yellow-200/50 dark:border-yellow-700/30"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                      className="inline-block"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                        {score.correct} / {score.total}
                      </div>
                      <div className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {scorePercentage}%
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scorePercentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`absolute h-full rounded-full ${
                          scorePercentage >= 80
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : scorePercentage >= 60
                            ? "bg-gradient-to-r from-blue-400 to-cyan-500"
                            : scorePercentage >= 40
                            ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                            : "bg-gradient-to-r from-red-400 to-pink-500"
                        }`}
                      />
                    </div>
                    <Badge
                      className={`text-sm font-medium ${
                        scorePercentage >= 70
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      Highest Score
                    </Badge>
                  </div>

                  {quiz.attempt_history?.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-yellow-200/50 dark:border-yellow-700/30">
                      <h4 className="font-semibold text-center text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Performance Analytics
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
                          <span className="text-gray-600 dark:text-gray-400">
                            Average Score:
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {Math.round(
                              quiz.attempt_history.reduce(
                                (sum, attempt) =>
                                  sum +
                                  (attempt.score / quiz.num_questions) * 100,
                                0
                              ) / quiz.attempt_history.length
                            )}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
                          <span className="text-gray-600 dark:text-gray-400">
                            Last Attempt:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(
                              quiz.attempt_history[0].attempt_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {quiz.attempt_history[0]?.time_taken && (
                          <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
                            <span className="text-gray-600 dark:text-gray-400">
                              Time Taken:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeTaken(quiz.attempt_history[0].time_taken)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Questions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Question Analysis
              </h2>
            </div>
            {quiz.attempt_history?.length > 1 && (
              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  View attempt:
                </span>
                <select
                  value={selectedAttempt}
                  onChange={(e) => setSelectedAttempt(parseInt(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  {quiz.attempt_history.map((attempt, index) => (
                    <option key={index} value={index}>
                      Attempt {quiz.attempt_history.length - index} -{" "}
                      {formatDate(attempt.attempt_date)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {questions.map((question, index) => {
              const userAnswerExists =
                latestUserAnswers[index] !== null &&
                latestUserAnswers[index] !== undefined;
              const isCorrect =
                userAnswerExists && isUserAnswerCorrect(index, question);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <AccordionItem
                    value={`question-${index}`}
                    className="border-0 rounded-2xl overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <AccordionTrigger className="px-6 py-5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                      <div className="flex items-start gap-4 w-full">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`
                          w-12 h-12 flex items-center justify-center rounded-xl font-bold text-white flex-shrink-0 shadow-lg
                          ${
                            isCorrect
                              ? "bg-gradient-to-br from-green-400 to-emerald-500"
                              : userAnswerExists
                              ? "bg-gradient-to-br from-red-400 to-pink-500"
                              : "bg-gradient-to-br from-gray-400 to-gray-500"
                          }
                        `}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : userAnswerExists ? (
                            <XCircle className="w-6 h-6" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                            {question.question}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {userAnswerExists && (
                              <Badge
                                className={`text-xs ${
                                  isCorrect
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" /> Correct
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3 mr-1" /> Incorrect
                                  </>
                                )}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                            >
                              {quiz.question_type}
                            </Badge>
                            {!userAnswerExists && (
                              <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                Not Answered
                              </Badge>
                            )}
                            {userAnswerExists && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <span className="font-medium">
                                  Your answer:
                                </span>{" "}
                                <span
                                  className={`font-semibold ${
                                    isCorrect
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {getUserAnswerText(index, question)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-6 py-6 bg-gray-50/50 dark:bg-gray-900/50">
                      <div className="space-y-4">
                        {/* Answer Summary */}
                        {userAnswerExists ? (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500 shadow-sm"
                          >
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <Target className="w-5 h-5 text-blue-500" />
                              Answer Summary
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                  Your Answer:
                                </span>
                                <div
                                  className={`mt-2 p-3 rounded-lg flex items-center gap-2 ${
                                    isCorrect
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                  }`}
                                >
                                  {isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                  )}
                                  {getUserAnswerText(index, question)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                  Correct Answer:
                                </span>
                                <div className="mt-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                  {question.options[question.correctAnswer] ||
                                    "N/A"}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-xl border-l-4 border-amber-500 shadow-sm"
                          >
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <HelpCircle className="w-5 h-5 text-amber-500" />
                              Question Not Answered
                            </h4>
                            <div className="text-sm">
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                  Correct Answer:
                                </span>
                                <div className="mt-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  {question.options[question.correctAnswer] ||
                                    "N/A"}
                                </div>
                              </div>
                              <div className="mt-3 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                This question was not answered during the quiz.
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Options */}
                        <div className="space-y-3">
                          {question.options.map((option, optionIndex) => {
                            const isCorrectOption =
                              optionIndex === question.correctAnswer;
                            const isUserAnswer = isUserSelectedOption(
                              index,
                              optionIndex,
                              question
                            );

                            let optionStyles = {
                              container:
                                "flex items-center p-4 rounded-xl transition-all duration-200 border-2",
                              bg: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                              text: "text-gray-700 dark:text-gray-300",
                              icon: (
                                <div className="w-6 h-6 mr-3 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                              ),
                              badges: [],
                            };

                            if (showCorrectAnswers && userAnswerExists) {
                              if (isUserAnswer && isCorrectOption) {
                                optionStyles.bg =
                                  "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-500";
                                optionStyles.text =
                                  "text-green-700 dark:text-green-300 font-semibold";
                                optionStyles.icon = (
                                  <div className="w-6 h-6 mr-3 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                );
                                optionStyles.badges = [
                                  <Badge
                                    key="correct"
                                    className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
                                  >
                                    <Check className="w-3 h-3 mr-1" /> Correct
                                  </Badge>,
                                  <Badge
                                    key="your"
                                    className="bg-blue-500 text-white border-0 font-semibold flex items-center gap-1"
                                  >
                                    <Award className="w-3 h-3" /> Your Answer
                                  </Badge>,
                                ];
                              } else if (isUserAnswer && !isCorrectOption) {
                                optionStyles.bg =
                                  "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-500";
                                optionStyles.text =
                                  "text-red-700 dark:text-red-300 font-semibold";
                                optionStyles.icon = (
                                  <div className="w-6 h-6 mr-3 rounded-full bg-red-500 flex items-center justify-center">
                                    <X className="w-4 h-4 text-white" />
                                  </div>
                                );
                                optionStyles.badges = [
                                  <Badge
                                    key="incorrect"
                                    className="bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100"
                                  >
                                    <X className="w-3 h-3 mr-1" /> Incorrect
                                  </Badge>,
                                  <Badge
                                    key="your"
                                    className="bg-blue-500 text-white border-0 font-semibold flex items-center gap-1"
                                  >
                                    <Award className="w-3 h-3" /> Your Answer
                                  </Badge>,
                                ];
                              } else if (isCorrectOption) {
                                optionStyles.bg =
                                  "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-500";
                                optionStyles.text =
                                  "text-green-700 dark:text-green-300 font-semibold";
                                optionStyles.icon = (
                                  <div className="w-6 h-6 mr-3 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                );
                                optionStyles.badges = [
                                  <Badge
                                    key="correct"
                                    className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
                                  >
                                    <Check className="w-3 h-3 mr-1" /> Correct
                                    Answer
                                  </Badge>,
                                ];
                              }
                            } else if (
                              showCorrectAnswers &&
                              !userAnswerExists &&
                              isCorrectOption
                            ) {
                              optionStyles.bg =
                                "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-500";
                              optionStyles.text =
                                "text-blue-700 dark:text-blue-300 font-medium";
                              optionStyles.icon = (
                                <div className="w-6 h-6 mr-3 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              );
                              optionStyles.badges = [
                                <Badge
                                  key="answer"
                                  className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100"
                                >
                                  Correct Answer
                                </Badge>,
                              ];
                            }

                            return (
                              <motion.div
                                key={optionIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: optionIndex * 0.05 }}
                                className={`${optionStyles.container} ${
                                  optionStyles.bg
                                } ${
                                  isUserAnswer
                                    ? "ring-2 ring-purple-300 dark:ring-purple-600 ring-offset-2"
                                    : ""
                                }`}
                                role="listitem"
                                aria-label={`Option ${optionIndex + 1}${
                                  isCorrectOption ? " (Correct)" : ""
                                }${isUserAnswer ? " (Your Answer)" : ""}`}
                              >
                                {optionStyles.icon}
                                <span
                                  className={`${optionStyles.text} flex-grow`}
                                >
                                  {option}
                                </span>
                                {optionStyles.badges.length > 0 && (
                                  <div className="flex flex-wrap gap-2 ml-2">
                                    {optionStyles.badges}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Explanation and Learning Tips */}
                        {showCorrectAnswers &&
                          latestUserAnswers[index] !== null && (
                            <div className="space-y-4 pt-4">
                              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                              {/* Explanation */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm"
                              >
                                <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                    <Lightbulb className="w-4 h-4 text-white" />
                                  </div>
                                  Explanation
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {question.explanation ||
                                    "No explanation provided for this question."}
                                </p>
                              </motion.div>

                              {/* Learning Tips for incorrect answers */}
                              {latestUserAnswers[index] !==
                                question.correctAnswer && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                  className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm"
                                >
                                  <h4 className="text-lg font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                                      <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    Learning Tip
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    The correct answer is "
                                    <strong className="text-amber-700 dark:text-amber-300">
                                      {question.options[question.correctAnswer]}
                                    </strong>
                                    ". Review the explanation above and consider
                                    why this option is correct. Understanding
                                    the reasoning will help improve your
                                    performance in similar questions.
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-gray-400 transition-all"
            >
              <ChevronLeft className="mr-2 w-5 h-5" />
              Back to Results
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate("/generate-quiz")}
              size="lg"
              className="px-8 py-3 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 transition-all"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Create New Quiz
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleRetakeQuiz}
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
            >
              <RotateCcw className="mr-2 w-5 h-5" />
              Retake Quiz
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizDetails;
