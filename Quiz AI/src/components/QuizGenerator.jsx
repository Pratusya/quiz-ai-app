import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Loader2, Share2, Download, Redo } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://quiz-ai-app-pqyh.onrender.com";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  WhatsappShareButton,
  FacebookShareButton,
  TwitterShareButton,
  EmailShareButton,
  WhatsappIcon,
  FacebookIcon,
  TwitterIcon,
  EmailIcon,
} from "react-share";

// Helper Components
function QuizSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, optionIndex) => (
                <div
                  key={optionIndex}
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const ShareModal = ({ isOpen, onClose, quizUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Quiz</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="flex justify-around mb-4">
          <WhatsappShareButton url={quizUrl}>
            <WhatsappIcon size={32} round />
          </WhatsappShareButton>
          <FacebookShareButton url={quizUrl}>
            <FacebookIcon size={32} round />
          </FacebookShareButton>
          <TwitterShareButton url={quizUrl}>
            <TwitterIcon size={32} round />
          </TwitterShareButton>
          <EmailShareButton url={quizUrl}>
            <EmailIcon size={32} round />
          </EmailShareButton>
        </div>
        <div className="flex">
          <input
            type="text"
            value={quizUrl}
            readOnly
            className="flex-grow border rounded-l px-2 py-1"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(quizUrl);
              toast.success("Link copied to clipboard!");
            }}
            className="bg-blue-500 text-white px-4 py-1 rounded-r"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Functions
const formatQuizQuestions = (quizData, questionType) => {
  if (!quizData) return [];

  return quizData.map((q, index) => {
    let formattedQuestion = {
      question: q.question,
      explanation: q.explanation || "",
    };

    if (questionType === "True/False") {
      // Convert boolean answer to index (true = 0, false = 1)
      const boolValue =
        typeof q.correctAnswer === "boolean"
          ? q.correctAnswer
          : String(q.correctAnswer).toLowerCase() === "true" ||
            String(q.correctAnswer) === "1";
      formattedQuestion.correctAnswer = boolValue ? 0 : 1;
      formattedQuestion.options = ["True", "False"];
    } else if (
      questionType === "Fill in the Blanks" ||
      questionType === "MCQ"
    ) {
      // Ensure all options are strings and array has 4 items
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      formattedQuestion.options = q.options.map((opt) => String(opt));

      // Normalize answer to number - handle both index and text answer
      let answerIndex = parseInt(q.correctAnswer, 10);

      // If parsing failed or answer is text, find it in options
      if (isNaN(answerIndex)) {
        // Try to find the answer text in options
        answerIndex = formattedQuestion.options.findIndex(
          (opt) =>
            opt.toLowerCase().trim() ===
            String(q.correctAnswer).toLowerCase().trim()
        );

        if (answerIndex === -1) {
          console.error(
            `Question ${index + 1}: Could not find answer "${
              q.correctAnswer
            }" in options:`,
            formattedQuestion.options
          );
          throw new Error(
            `Question ${index + 1}: Invalid answer "${
              q.correctAnswer
            }" - not found in options`
          );
        }
      }

      // Validate the index is within range
      if (answerIndex < 0 || answerIndex > 3) {
        throw new Error(
          `Question ${
            index + 1
          }: Answer index ${answerIndex} is out of range (must be 0-3)`
        );
      }

      formattedQuestion.correctAnswer = answerIndex;
    }

    return formattedQuestion;
  });
};

// Helper function to normalize quiz data - ensures correctAnswer is a numeric index
const normalizeQuizData = (quizData, questionType) => {
  if (!quizData || !Array.isArray(quizData)) return quizData;

  return quizData.map((question, index) => {
    const normalizedQuestion = { ...question };

    if (questionType === "True/False") {
      // For True/False, convert boolean/string to index (0 for True, 1 for False)
      // If correctAnswer is already a valid number (0 or 1), use it directly
      if (
        typeof question.correctAnswer === "number" &&
        (question.correctAnswer === 0 || question.correctAnswer === 1)
      ) {
        normalizedQuestion.correctAnswer = question.correctAnswer;
      } else {
        const boolValue =
          typeof question.correctAnswer === "boolean"
            ? question.correctAnswer
            : String(question.correctAnswer).toLowerCase() === "true" ||
              String(question.correctAnswer) === "1" ||
              String(question.correctAnswer) === "0";
        normalizedQuestion.correctAnswer = boolValue ? 0 : 1;
      }

      // Ensure options exist for True/False
      normalizedQuestion.options = ["True", "False"];
    } else {
      // For MCQ and Fill in the Blanks
      let answerIndex = parseInt(question.correctAnswer, 10);

      // If correctAnswer is not a valid number, try to find it in options
      if (isNaN(answerIndex) && Array.isArray(question.options)) {
        answerIndex = question.options.findIndex(
          (opt) =>
            String(opt).toLowerCase().trim() ===
            String(question.correctAnswer).toLowerCase().trim()
        );

        if (answerIndex === -1) {
          console.warn(
            `Question ${index + 1}: Could not find answer "${
              question.correctAnswer
            }" in options, defaulting to 0`
          );
          answerIndex = 0;
        }
      }

      // Validate and clamp the index
      if (isNaN(answerIndex) || answerIndex < 0 || answerIndex > 3) {
        console.warn(
          `Question ${
            index + 1
          }: Invalid answer index ${answerIndex}, defaulting to 0`
        );
        answerIndex = 0;
      }

      normalizedQuestion.correctAnswer = answerIndex;
    }

    return normalizedQuestion;
  });
};

function QuizGenerator() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in retake mode
  const retakeData = location.state?.retakeMode
    ? location.state.quizData
    : null;

  // Initialize state from localStorage, retake data, or default values
  const [topic, setTopic] = useState(() => {
    if (retakeData) return retakeData.topic;
    return localStorage.getItem("quizTopic") || "";
  });
  const [numQuestions, setNumQuestions] = useState(() => {
    if (retakeData) return retakeData.numQuestions;
    return parseInt(localStorage.getItem("quizNumQuestions")) || 5;
  });
  const [difficulty, setDifficulty] = useState(() => {
    if (retakeData) return retakeData.difficulty;
    return localStorage.getItem("quizDifficulty") || "Easy";
  });
  const [questionType, setQuestionType] = useState(() => {
    if (retakeData) return retakeData.questionType;
    return localStorage.getItem("quizQuestionType") || "MCQ";
  });
  const [language, setLanguage] = useState(() => {
    if (retakeData) return retakeData.language;
    return localStorage.getItem("quizLanguage") || "english";
  });
  const [questionLanguage, setQuestionLanguage] = useState(() => {
    if (retakeData) return retakeData.language;
    return localStorage.getItem("quizQuestionLanguage") || "english";
  });
  // Normalize retake quiz data to ensure correctAnswer is numeric
  const [quiz, setQuiz] = useState(() => {
    if (retakeData?.questions) {
      return normalizeQuizData(
        retakeData.questions,
        retakeData.questionType || "MCQ"
      );
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [quizId, setQuizId] = useState(retakeData?.id || null);
  const [error, setError] = useState(null);
  const [isRetakeMode, setIsRetakeMode] = useState(!!retakeData);
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState(null);
  const [showAdaptiveCard, setShowAdaptiveCard] = useState(false);

  // New restriction state for answer selection
  const [answerRestriction, setAnswerRestriction] = useState(() => {
    if (retakeData) return false; // Default to allow changes for retakes
    return localStorage.getItem("quizAnswerRestriction") === "true" || false;
  });
  const [lockedAnswers, setLockedAnswers] = useState(new Set());

  // Effect to handle retake mode initialization - runs when location.state changes
  useEffect(() => {
    const newRetakeData = location.state?.retakeMode
      ? location.state.quizData
      : null;

    if (newRetakeData) {
      console.log("Retake mode detected, setting up quiz:", newRetakeData);

      // Set all the states from retake data
      setTopic(newRetakeData.topic || "");
      setNumQuestions(newRetakeData.numQuestions || 5);
      setDifficulty(newRetakeData.difficulty || "Easy");
      setQuestionType(newRetakeData.questionType || "MCQ");
      setLanguage(newRetakeData.language || "english");
      setQuestionLanguage(newRetakeData.language || "english");
      setQuizId(newRetakeData.id || null);
      setIsRetakeMode(true);
      setUserAnswers({});
      setLockedAnswers(new Set());

      // Normalize and set the quiz data
      if (newRetakeData.questions) {
        const normalized = normalizeQuizData(
          newRetakeData.questions,
          newRetakeData.questionType || "MCQ"
        );
        setQuiz(normalized);
        console.log("Quiz data set:", normalized);
      }

      toast.success(`Quiz loaded: ${newRetakeData.topic}`);

      // Clear the navigation state to prevent re-initialization on refresh
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location.state]);

  // Function to get adaptive learning recommendations
  const getAdaptiveRecommendation = async (topic) => {
    if (!topic.trim() || isRetakeMode) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/adaptive-learning/recommendation`,
        {
          params: { topic },
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            username: userId,
          },
        }
      );

      if (response.data.status === "success") {
        setAdaptiveRecommendation(response.data.data);
        setShowAdaptiveCard(true);

        // Auto-apply recommendation if different from current difficulty
        if (response.data.data.recommended_difficulty !== difficulty) {
          toast.info(
            `AI suggests ${response.data.data.recommended_difficulty} difficulty for this topic`,
            { duration: 4000 }
          );
        }
      }
    } catch (error) {
      console.error("Failed to get adaptive recommendation:", error);
    }
  };

  // Debounced topic change handler for adaptive learning
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (topic && topic.length > 2) {
        getAdaptiveRecommendation(topic);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [topic, userId]);

  useEffect(() => {
    // Cleanup function to clear stored configurations
    return () => {
      // Only clear if the component is unmounting, not on every effect cleanup
      if (!document.hidden) {
        localStorage.removeItem("quizTopic");
        localStorage.removeItem("quizNumQuestions");
        localStorage.removeItem("quizDifficulty");
        localStorage.removeItem("quizQuestionType");
        localStorage.removeItem("quizLanguage");
        localStorage.removeItem("quizQuestionLanguage");
      }
    };
  }, []);

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  const constructPrompt = () => {
    let prompt = `Generate a ${difficulty.toLowerCase()} difficulty quiz about ${topic} with ${numQuestions} ${questionType} questions in ${language}. `;

    if (language === "hindi") {
      prompt +=
        "Please provide all questions, options, and explanations in Hindi. Use Devanagari script. ";

      if (questionLanguage === "both") {
        prompt +=
          "Also provide English transliteration in parentheses for each question and option. ";
      }
    }
    switch (questionType) {
      case "MCQ":
        prompt +=
          "Format as JSON array with each question having: 'question' (string), 'options' (array of 4 distinct choices), 'correctAnswer' (number 0-3 indicating correct option index), 'explanation' (string). Example: {'question': 'What is 2+2?', 'options': ['3', '4', '5', '6'], 'correctAnswer': 1, 'explanation': '2+2=4'}";
        break;
      case "True/False":
        prompt +=
          "Format as JSON array with each question having: 'question' (a statement to evaluate), 'correctAnswer' (boolean true/false), 'explanation' (why true/false). Example: {'question': 'The Earth is flat', 'correctAnswer': false, 'explanation': 'The Earth is approximately spherical'}";
        break;
      case "Fill in the Blanks":
        prompt +=
          "Format as JSON array with each question having: 'question' (string with ___ for blank), 'options' (array of 4 possible answers), 'correctAnswer' (number 0-3 indicating correct option index), 'explanation' (string). Example: {'question': 'The capital of France is ___', 'options': ['London', 'Paris', 'Berlin', 'Madrid'], 'correctAnswer': 1, 'explanation': 'Paris is the capital of France'}";
        break;
    }

    return (
      prompt +
      " Return only valid JSON array with no markdown formatting or additional text."
    );
  };

  const cleanResponseText = (text) => {
    return text.replace(/```json\n?|\n?```/g, "").trim();
  };
  const validateAndParseQuizData = (text) => {
    try {
      const data = JSON.parse(text);

      // Validate basic structure
      if (!Array.isArray(data) || data.length !== numQuestions) {
        throw new Error("Invalid quiz format - questions array mismatch");
      } // Validate each question
      data.forEach((question, index) => {
        const questionNum = index + 1;

        // Common validations
        if (
          !question.question ||
          typeof question.question !== "string" ||
          question.question.trim() === ""
        ) {
          throw new Error(
            `Question ${questionNum} is missing or has invalid question text`
          );
        }

        if (
          question.correctAnswer === undefined ||
          question.correctAnswer === null
        ) {
          throw new Error(
            `Question ${questionNum} is missing the correct answer`
          );
        }

        if (!question.explanation || typeof question.explanation !== "string") {
          question.explanation = ""; // Set default empty explanation
        }

        // Type-specific validations
        if (questionType === "True/False") {
          // Clean up question text for True/False
          question.question = question.question.trim();
          if (
            !question.question.endsWith("?") &&
            !question.question.endsWith(".")
          ) {
            question.question += ".";
          } // Normalize answer to numeric index (0 for True, 1 for False)
          const boolValue =
            typeof question.correctAnswer === "boolean"
              ? question.correctAnswer
              : String(question.correctAnswer).toLowerCase() === "true" ||
                String(question.correctAnswer) === "1";
          question.correctAnswer = boolValue ? 0 : 1;

          // Remove options if present
          delete question.options;
        } else {
          // MCQ and Fill in the Blanks validations
          if (!Array.isArray(question.options)) {
            throw new Error(`Question ${questionNum} is missing options array`);
          }

          // Validate options
          if (question.options.length !== 4) {
            throw new Error(
              `Question ${questionNum} must have exactly 4 options`
            );
          }

          // Ensure all options are strings and not empty
          question.options = question.options.map((opt) => String(opt).trim());
          if (question.options.some((opt) => opt === "")) {
            throw new Error(`Question ${questionNum} has empty options`);
          }

          // Check for duplicate options
          const uniqueOptions = new Set(question.options);
          if (uniqueOptions.size !== question.options.length) {
            throw new Error(`Question ${questionNum} has duplicate options`);
          }

          // Specific Fill in the Blanks validation
          if (questionType === "Fill in the Blanks") {
            if (!question.question.includes("___")) {
              throw new Error(
                `Question ${questionNum} must contain ___ to indicate the blank`
              );
            }
            // Ensure only one blank per question
            if ((question.question.match(/___/g) || []).length > 1) {
              throw new Error(
                `Question ${questionNum} should have only one blank (___)`
              );
            }
          }

          // Validate and normalize correct answer index
          const answerIndex = parseInt(question.correctAnswer, 10);
          if (isNaN(answerIndex) || answerIndex < 0 || answerIndex > 3) {
            throw new Error(
              `Question ${questionNum} has invalid correct answer index. Must be 0-3`
            );
          }
          question.correctAnswer = answerIndex;
        }

        // Ensure explanation exists (can be empty string)
        if (!question.explanation && question.explanation !== "") {
          question.explanation = ""; // Set default empty explanation
        }
      });

      return data;
    } catch (error) {
      console.error("Quiz data parsing error:", error);
      return null;
    }
  };
  const handleQuizGenerationError = (error) => {
    console.error("Error generating quiz:", error);
    let errorMessage = "Failed to generate quiz. Please try again.";

    // Add more specific error messages based on error type
    if (error.message.includes("parse")) {
      errorMessage = "Failed to generate valid quiz format. Please try again.";
    } else if (error.message.includes("options")) {
      errorMessage =
        "Failed to generate valid options for questions. Please try again.";
    }

    setError(errorMessage);
    toast.error(errorMessage);
  };
  const saveQuiz = async (quizData) => {
    try {
      // Format questions based on question type
      const formattedQuestions = formatQuizQuestions(quizData, questionType);

      const requestPayload = {
        title: `${topic} Quiz`,
        topic: topic,
        numQuestions: Number(numQuestions),
        difficulty: difficulty,
        questionType: questionType,
        language: language.toLowerCase(),
        questions: formattedQuestions,
      };

      const response = await axios.post(
        `${API_URL}/api/quizzes`,
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            username: userId,
          },
        }
      );

      if (response.data?.status === "success" && response.data?.quiz?.id) {
        setQuizId(response.data.quiz.id);
        return response.data.quiz.id;
      } else {
        throw new Error("No quiz ID received from server");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        error.response?.data?.message || error.message || "Failed to save quiz"
      );
    }
  };
  const generateQuiz = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare auth headers - works for both signed-in and guest users
      const headers = {
        "Content-Type": "application/json",
        "user-id": userId || "guest",
        username: userId || "Guest User",
      };

      // Call backend API to generate quiz using OpenAI
      const response = await axios.post(
        `${API_URL}/api/generate-quiz`,
        {
          topic: topic,
          difficulty: difficulty,
          numQuestions: numQuestions,
          questionType: questionType,
          language: language,
        },
        {
          headers: headers,
        }
      );

      if (response.data.status !== "success" || !response.data.quiz) {
        throw new Error("Invalid response from server");
      }

      const quizData = response.data.quiz.questions;

      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("No questions generated");
      }

      // Normalize quiz data - convert correctAnswer to numeric index using helper function
      const normalizedQuizData = normalizeQuizData(quizData, questionType);

      setQuiz(normalizedQuizData);
      // Don't reset user answers when regenerating quiz
      // setUserAnswers({});

      // Save quiz only if user is signed in
      if (isAuthenticated && userId) {
        try {
          const savedQuizId = await saveQuiz(normalizedQuizData);
          if (savedQuizId) {
            // Save quiz history with proper parameters
            await saveQuizHistory(savedQuizId, `Quiz on ${topic}`, {
              topic: topic,
              difficulty: difficulty,
              numQuestions: numQuestions,
              questionType: questionType,
              language: language,
            });
            toast.success("Quiz generated and saved successfully!");
          }
        } catch (saveError) {
          console.error("Error saving quiz:", saveError);
          toast.error(
            saveError.message ||
              "Quiz generated but failed to save. You can still take it!",
            { duration: 4000 }
          );
        }
      } else {
        toast.success("Quiz generated! Sign in to save your progress.");
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate quiz"
      );
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate quiz"
      );
    } finally {
      setLoading(false);
    }
  };
  const handleAnswerSelect = (questionIndex, answer, questionType) => {
    // Check if answer restriction is enabled and this question is already locked
    if (answerRestriction && lockedAnswers.has(questionIndex)) {
      toast.error(
        `Answer for question ${
          questionIndex + 1
        } is locked and cannot be changed. Answer restriction mode is enabled.`
      );
      return;
    }

    // For all question types, including True/False, store as numeric indices
    const numericAnswer = parseInt(answer, 10);

    if (!isNaN(numericAnswer)) {
      setUserAnswers((prev) => ({
        ...prev,
        [questionIndex]: numericAnswer,
      }));

      // If answer restriction is enabled, lock this question after selection
      if (answerRestriction) {
        setLockedAnswers((prev) => {
          const newLocked = new Set(prev);
          newLocked.add(questionIndex);
          return newLocked;
        });

        toast.success(
          `Answer locked for question ${
            questionIndex + 1
          }. You cannot change this answer.`,
          { duration: 2000 }
        );
      }
    }
  };

  const calculateScore = () => {
    let score = 0;
    console.log("Calculating score...");
    console.log("Quiz questions:", quiz);
    console.log("User answers:", userAnswers);

    quiz.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      // Skip questions that haven't been answered
      if (userAnswer === undefined || userAnswer === null) {
        console.log(`Question ${index + 1}: Not answered`);
        return;
      }

      // For all question types, compare the selected index with correct answer index
      const isCorrect = userAnswer === question.correctAnswer;
      console.log(
        `Question ${index + 1}: userAnswer=${userAnswer}, correctAnswer=${
          question.correctAnswer
        }, isCorrect=${isCorrect}`
      );

      if (isCorrect) {
        score++;
      }
    });
    console.log("Final score:", score);
    return score;
  };
  const submitQuiz = async () => {
    try {
      if (!quizId) {
        toast.error("Quiz ID is missing. Please generate a new quiz.");
        return;
      }

      const rawScore = calculateScore();
      const answeredQuestions = Object.keys(userAnswers).length;
      const isPerfectScore = rawScore === quiz.length;
      const completionRate = answeredQuestions / quiz.length;

      // Calculate XP based on performance and difficulty
      const calculateXP = () => {
        let baseXP = rawScore * 10; // 10 XP per correct answer

        // Difficulty multiplier
        const difficultyMultiplier = {
          Easy: 1.0,
          Medium: 1.5,
          Hard: 2.0,
        };

        // Completion bonus
        const completionBonus = completionRate === 1 ? 50 : 0;

        // Perfect score bonus
        const perfectBonus = isPerfectScore ? 100 : 0;

        const totalXP = Math.round(
          baseXP * (difficultyMultiplier[difficulty] || 1) +
            completionBonus +
            perfectBonus
        );

        return Math.max(totalXP, 10); // Minimum 10 XP
      };

      const xpEarned = calculateXP();

      const formattedUserAnswers = quiz.map((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;

        return {
          userAnswer: userAnswer,
          isCorrect: isCorrect,
        };
      });

      const quizData = {
        quizId: quizId,
        score: rawScore,
        totalQuestions: quiz.length,
        answers: formattedUserAnswers,
        timeTaken: 0, // TODO: Add timer functionality to track time taken
      };

      // Submit quiz results
      const response = await axios.post(
        `${API_URL}/api/quiz-results`,
        {
          quizId: quizData.quizId,
          score: quizData.score,
          totalQuestions: quizData.totalQuestions,
          userAnswers: quizData.answers.map((answer, index) => ({
            questionIndex: index,
            answer: answer.userAnswer,
            correct: answer.isCorrect,
          })),
          timeTaken: quizData.timeTaken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            username: userId,
          },
        }
      );

      if (response.data) {
        // Award XP and check for badges
        try {
          const xpResponse = await axios.post(
            `${API_URL}/api/gamification/award-xp`,
            {
              xp_earned: xpEarned,
              quiz_score: rawScore,
              perfect_score: isPerfectScore,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "user-id": userId,
                username: userId,
              },
            }
          );

          if (xpResponse.data.status === "success") {
            const { new_badges, total_xp, current_level } =
              xpResponse.data.data;

            // Show XP earned notification
            toast.success(
              `🎉 +${xpEarned} XP earned! Total: ${total_xp} XP (Level ${current_level})`
            );

            // Show new badge notifications
            if (new_badges && new_badges.length > 0) {
              new_badges.forEach((badge) => {
                toast.success(
                  `🏆 New Badge: ${badge.name}! ${badge.description}`,
                  { duration: 5000 }
                );
              });
            }
          }
        } catch (xpError) {
          console.error("Failed to award XP:", xpError);
          // Don't block quiz submission if XP fails
        }

        // Update learning analytics
        try {
          await axios.post(
            `${API_URL}/api/adaptive-learning/update`,
            {
              topic: topic,
              difficulty: difficulty,
              score: rawScore,
              total_questions: quiz.length,
              time_taken: quizData.timeTaken || 60, // Default if no timer
            },
            {
              headers: {
                "Content-Type": "application/json",
                "user-id": userId,
                username: userId,
              },
            }
          );
        } catch (analyticsError) {
          console.error("Failed to update learning analytics:", analyticsError);
          // Don't block quiz submission if analytics fails
        }

        // Store quiz results in localStorage as backup
        localStorage.setItem("quizScore", rawScore.toString());
        localStorage.setItem("quizTotal", quiz.length.toString());
        localStorage.setItem("quizXP", xpEarned.toString());

        // Clear quiz configurations after successful submission
        localStorage.removeItem("quizTopic");
        localStorage.removeItem("quizNumQuestions");
        localStorage.removeItem("quizDifficulty");
        localStorage.removeItem("quizQuestionType");
        localStorage.removeItem("quizLanguage");
        localStorage.removeItem("quizQuestionLanguage");

        toast.success("Quiz submitted successfully!");

        // Navigate with score data in state for immediate display
        navigate("/quiz-completed", {
          state: {
            score: rawScore,
            total: quiz.length,
            xpEarned: xpEarned,
          },
        });
      }
    } catch (error) {
      console.error(
        "Error submitting quiz:",
        error.response?.data?.message || error.message
      );
      toast.error("Failed to submit quiz. Please try again.");
    }
  };
  const saveQuizHistory = async (quizId, promptUsed, generationParams) => {
    try {
      // Add validation and default values
      const parameters = {
        topic: generationParams.topic || "General",
        difficulty: generationParams.difficulty || "Medium",
        numQuestions: parseInt(generationParams.numQuestions) || 10,
        questionType: generationParams.questionType || "MCQ",
        language: generationParams.language || "english",
      };

      const response = await axios.post(
        `${API_URL}/api/quiz-history`,
        {
          quizId: parseInt(quizId),
          promptUsed: promptUsed || "Default prompt",
          generationParameters: parameters,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            username: userId,
          },
        }
      );

      if (!response.data || response.data.status !== "success") {
        console.error("Quiz history save failed:", response.data);
        throw new Error(
          response.data?.message || "Failed to save quiz history"
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error saving quiz history:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error("Failed to save quiz history");
    }
  };

  const exportQuiz = () => {
    const quizData = {
      topic,
      numQuestions,
      difficulty,
      questionType,
      language,
      questionLanguage,
      questions: quiz,
    };
    const blob = new Blob([JSON.stringify(quizData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_${topic.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Quiz exported successfully!");
  };

  const shareQuiz = () => {
    setIsShareModalOpen(true);
  };
  const retakeQuiz = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all your answers and start over?"
      )
    ) {
      setUserAnswers({});
      setLockedAnswers(new Set()); // Reset locked answers
      toast.success("Answers cleared. You can now retake the quiz!");
    }
  };

  const quizUrl = `${window.location.origin}/take-quiz/${quizId}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Guest User Banner */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👋</span>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Welcome, Guest!
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You can generate quizzes as a guest. Sign in to save your
                progress and track your performance.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {isRetakeMode ? "Retaking Quiz" : "Quiz Configuration"}
          </CardTitle>
          {isRetakeMode && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              You are retaking the quiz: "{topic}". The quiz configuration is
              locked for this retake.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic</Label>{" "}
              <Input
                id="topic"
                value={topic}
                onChange={(e) => {
                  const newTopic = e.target.value;
                  setTopic(newTopic);
                  localStorage.setItem("quizTopic", newTopic);
                }}
                placeholder="Enter quiz topic"
                disabled={isRetakeMode}
              />
            </div>

            {/* Language Selection */}
            <div>
              <Label htmlFor="language">Quiz Language</Label>{" "}
              <Select
                value={language}
                onValueChange={(newValue) => {
                  setLanguage(newValue);
                  localStorage.setItem("quizLanguage", newValue);
                }}
                disabled={isRetakeMode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select quiz language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Language Format for Hindi quizzes */}
            {language === "hindi" && (
              <div>
                <Label htmlFor="questionLanguage">Question Format</Label>
                <Select
                  value={questionLanguage}
                  onValueChange={(newValue) => {
                    setQuestionLanguage(newValue);
                    localStorage.setItem("quizQuestionLanguage", newValue);
                  }}
                  disabled={isRetakeMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select question format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hindi">Hindi Only</SelectItem>
                    <SelectItem value="both">
                      Hindi with English Transliteration
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Select
                  value={numQuestions.toString()}
                  onValueChange={(value) => {
                    const numValue = parseInt(value, 10);
                    setNumQuestions(numValue);
                    localStorage.setItem("quizNumQuestions", numValue);
                  }}
                  disabled={isRetakeMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select number of questions" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>{" "}
                <Select
                  value={difficulty}
                  onValueChange={(newValue) => {
                    setDifficulty(newValue);
                    localStorage.setItem("quizDifficulty", newValue);
                  }}
                  disabled={isRetakeMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Easy", "Medium", "Hard"].map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="questionType">Question Type</Label>{" "}
              <Select
                value={questionType}
                onValueChange={(newValue) => {
                  setQuestionType(newValue);
                  localStorage.setItem("quizQuestionType", newValue);
                }}
                disabled={isRetakeMode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {["MCQ", "True/False", "Fill in the Blanks"].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Answer Restriction Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                <Label
                  htmlFor="answerRestriction"
                  className="text-sm font-medium"
                >
                  Answer Restriction Mode
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {answerRestriction
                    ? "Once selected, answers cannot be changed (Final Answer Mode)"
                    : "Allow changing answers multiple times (Default Mode)"}
                </p>
              </div>
              <Switch
                id="answerRestriction"
                checked={answerRestriction}
                onCheckedChange={(checked) => {
                  setAnswerRestriction(checked);
                  localStorage.setItem(
                    "quizAnswerRestriction",
                    checked.toString()
                  );
                  if (!checked) {
                    // Reset locked answers when disabling restriction
                    setLockedAnswers(new Set());
                  }
                  toast.success(
                    checked
                      ? "Answer restriction enabled - answers will be locked after selection"
                      : "Answer restriction disabled - answers can be changed freely"
                  );
                }}
                disabled={isRetakeMode}
              />
            </div>
          </div>
          {!isRetakeMode ? (
            <Button
              onClick={generateQuiz}
              disabled={loading || !topic}
              className="w-full mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          ) : (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                Quiz is ready for retaking! Scroll down to begin answering the
                questions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adaptive Learning Recommendation Card */}
      {showAdaptiveCard && adaptiveRecommendation && !isRetakeMode && (
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              🧠 AI Learning Assistant
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdaptiveCard(false)}
                className="ml-auto text-blue-600 hover:text-blue-800"
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-800 dark:text-blue-200">
                <strong>
                  Recommendation for "{adaptiveRecommendation.topic}":
                </strong>
              </p>
              <div className="bg-white dark:bg-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📈 Suggested Difficulty:{" "}
                  {adaptiveRecommendation.recommended_difficulty}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {adaptiveRecommendation.reasoning}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setDifficulty(
                      adaptiveRecommendation.recommended_difficulty
                    );
                    localStorage.setItem(
                      "quizDifficulty",
                      adaptiveRecommendation.recommended_difficulty
                    );
                    toast.success(
                      `Difficulty updated to ${adaptiveRecommendation.recommended_difficulty}!`
                    );
                    setShowAdaptiveCard(false);
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply Recommendation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdaptiveCard(false)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  Keep Current Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {loading ? (
          <QuizSkeleton />
        ) : quiz ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <CardTitle>
                    {isRetakeMode ? "Retaking Quiz" : "Generated Quiz"}
                  </CardTitle>
                  {answerRestriction && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                      🔒 <strong>Final Answer Mode:</strong>{" "}
                      {lockedAnswers.size} of {quiz.length} answers locked
                      {lockedAnswers.size === 0 &&
                        " - Answers will be locked after selection"}
                    </div>
                  )}
                </div>
                {isRetakeMode && (
                  <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                    You are retaking this quiz. Answer all questions and submit
                    when ready.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {!isRetakeMode && (
                    <>
                      <Button onClick={exportQuiz} size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button onClick={shareQuiz} size="sm">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </>
                  )}
                  <Button onClick={retakeQuiz} size="sm">
                    <Redo className="mr-2 h-4 w-4" />
                    {isRetakeMode ? "Clear Answers" : "Retake"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {quiz.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <p className="text-base sm:text-lg font-medium text-gray-800 dark:text-white break-words">
                        {index + 1}. {question.question}
                      </p>
                    </div>
                    <div className="space-y-4">
                      {/* Question Status Indicator */}
                      {answerRestriction && (
                        <div className="mb-4 p-3 rounded-lg border">
                          {lockedAnswers.has(index) ? (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <span className="text-sm font-medium">
                                🔒 Answer Locked
                              </span>
                              <span className="text-xs">Cannot be changed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <span className="text-sm font-medium">
                                ⚠️ Final Answer Mode
                              </span>
                              <span className="text-xs">
                                Answer will be locked after selection
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {questionType === "MCQ" &&
                        question.options.map((option, optionIndex) => {
                          const isLocked =
                            answerRestriction && lockedAnswers.has(index);
                          const isSelected = userAnswers[index] === optionIndex;

                          return (
                            <label
                              key={optionIndex}
                              className={`flex items-center space-x-3 p-3 rounded-md transition-colors border-2
                                ${
                                  isSelected
                                    ? isLocked
                                      ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-600"
                                      : "bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600"
                                    : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                                }
                                ${
                                  isLocked && !isSelected
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }
                              `}
                            >
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={optionIndex}
                                checked={isSelected}
                                onChange={() =>
                                  handleAnswerSelect(
                                    index,
                                    optionIndex,
                                    questionType
                                  )
                                }
                                disabled={isLocked && !isSelected}
                                className="form-radio text-primary-500 focus:ring-primary-500"
                              />
                              <span
                                className={`text-gray-800 dark:text-gray-200 ${
                                  isLocked && isSelected ? "font-semibold" : ""
                                }`}
                              >
                                {option}
                                {isLocked && isSelected && (
                                  <span className="ml-2 text-red-500 text-sm">
                                    🔒
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}{" "}
                      {questionType === "True/False" && (
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center justify-center">
                          {[
                            { value: 0, label: "True" },
                            { value: 1, label: "False" },
                          ].map((option) => {
                            const isLocked =
                              answerRestriction && lockedAnswers.has(index);
                            const isSelected =
                              userAnswers[index] === option.value;

                            return (
                              <label
                                key={option.label}
                                className={`flex items-center justify-center space-x-3 p-4 rounded-md transition-colors border-2 min-w-[120px]
                                  ${
                                    isSelected
                                      ? isLocked
                                        ? "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-600"
                                        : "bg-primary-100 border-primary-500 dark:bg-primary-900/30"
                                      : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }
                                  ${
                                    isLocked && !isSelected
                                      ? "opacity-50 cursor-not-allowed"
                                      : "cursor-pointer"
                                  }
                                `}
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option.value}
                                  checked={isSelected}
                                  onChange={() =>
                                    handleAnswerSelect(
                                      index,
                                      option.value,
                                      questionType
                                    )
                                  }
                                  disabled={isLocked && !isSelected}
                                  className="form-radio text-primary-500 focus:ring-primary-500"
                                />
                                <span
                                  className={`text-lg font-medium text-gray-800 dark:text-gray-200 ${
                                    isLocked && isSelected ? "font-bold" : ""
                                  }`}
                                >
                                  {option.label}
                                  {isLocked && isSelected && (
                                    <span className="ml-2 text-red-500 text-sm">
                                      🔒
                                    </span>
                                  )}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}{" "}
                      {questionType === "Fill in the Blanks" && (
                        <>
                          <div className="mb-4 text-lg">
                            {question.question
                              .split("___")
                              .map((part, partIndex, parts) => (
                                <React.Fragment key={partIndex}>
                                  <span>{part}</span>
                                  {partIndex < parts.length - 1 && (
                                    <span className="mx-2 px-4 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                                      {userAnswers[index] !== undefined
                                        ? question.options[userAnswers[index]]
                                        : "?"}
                                    </span>
                                  )}
                                </React.Fragment>
                              ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {question.options.map((option, optionIndex) => {
                              const isLocked =
                                answerRestriction && lockedAnswers.has(index);
                              const isSelected =
                                userAnswers[index] === optionIndex;

                              return (
                                <label
                                  key={optionIndex}
                                  className={`flex items-center space-x-3 p-4 rounded-md transition-colors border-2
                                    ${
                                      isSelected
                                        ? isLocked
                                          ? "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-600"
                                          : "bg-primary-100 border-primary-500 dark:bg-primary-900/30"
                                        : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }
                                    ${
                                      isLocked && !isSelected
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                    }
                                  `}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${index}`}
                                    value={optionIndex}
                                    checked={isSelected}
                                    onChange={() =>
                                      handleAnswerSelect(
                                        index,
                                        optionIndex,
                                        questionType
                                      )
                                    }
                                    disabled={isLocked && !isSelected}
                                    className="form-radio text-primary-500 focus:ring-primary-500"
                                  />
                                  <span
                                    className={`text-gray-800 dark:text-gray-200 text-lg ${
                                      isLocked && isSelected
                                        ? "font-semibold"
                                        : ""
                                    }`}
                                  >
                                    {option}
                                    {isLocked && isSelected && (
                                      <span className="ml-2 text-red-500 text-sm">
                                        🔒
                                      </span>
                                    )}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}

                <Button onClick={submitQuiz} className="w-full mt-4">
                  Submit Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizUrl={quizUrl}
      />
    </div>
  );
}

export default QuizGenerator;
