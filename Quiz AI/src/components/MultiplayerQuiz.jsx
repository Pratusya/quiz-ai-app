import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Users,
  Gamepad2,
  Trophy,
  Clock,
  Zap,
  Crown,
  Plus,
  LogIn,
  Loader2,
  CheckCircle,
  X,
  Copy,
  Check,
  Settings,
  BookOpen,
  Timer,
  Play,
  ListChecks,
  RefreshCw,
  Sparkles,
  Target,
  Brain,
  Search,
  FileText,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MultiplayerQuiz = () => {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameState, setGameState] = useState("menu"); // menu, lobby, quiz-setup, playing, waiting-for-others, finished
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finalResults, setFinalResults] = useState(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const questionStartTime = useRef(null);
  const navigate = useNavigate();

  // States for independent question progression
  const [showAnswerResult, setShowAnswerResult] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState(null);
  const [playerFinished, setPlayerFinished] = useState(false);
  const [myFinalScore, setMyFinalScore] = useState(null);

  // New states for quiz selection and configuration
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizSource, setQuizSource] = useState("existing"); // existing, new
  const [timeLimit, setTimeLimit] = useState(30); // seconds per question
  const [totalTimeLimit, setTotalTimeLimit] = useState(0); // 0 means per-question timer
  const [quizData, setQuizData] = useState(null);
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [setupStep, setSetupStep] = useState(1); // 1: select quiz, 2: configure settings, 3: preview
  const [loadingQuizDetails, setLoadingQuizDetails] = useState(false); // Loading state for fetching quiz details

  // New quiz generation states
  const [newQuizConfig, setNewQuizConfig] = useState({
    topic: "",
    numQuestions: 5,
    difficulty: "Medium",
    questionType: "MCQ",
  });
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Fetch user's existing quizzes
  const fetchExistingQuizzes = async () => {
    if (!userId) return;

    setLoadingQuizzes(true);
    try {
      const response = await axios.get(`${API_URL}/api/quizzes`, {
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
          username: userId,
        },
        params: {
          limit: 20,
          sort: "created_at:desc",
        },
      });

      if (response.data.status === "success") {
        setExistingQuizzes(response.data.quizzes || []);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load existing quizzes");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Generate new quiz
  const generateNewQuiz = async () => {
    if (!newQuizConfig.topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setGeneratingQuiz(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/generate-quiz`,
        {
          topic: newQuizConfig.topic,
          difficulty: newQuizConfig.difficulty,
          numQuestions: newQuizConfig.numQuestions,
          questionType: newQuizConfig.questionType,
          language: "english",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "user-id": userId || "guest",
            username: userId || "Guest",
          },
        }
      );

      if (response.data.status === "success" && response.data.quiz) {
        const generatedQuiz = {
          id: Date.now(),
          title: `${newQuizConfig.topic} Quiz`,
          topic: newQuizConfig.topic,
          difficulty: newQuizConfig.difficulty,
          question_type: newQuizConfig.questionType,
          questions: response.data.quiz.questions,
          num_questions: response.data.quiz.questions.length,
        };

        setQuizData(generatedQuiz);
        setSelectedQuiz(generatedQuiz);
        toast.success("Quiz generated successfully!");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // Select an existing quiz - fetch full quiz data with questions
  const selectExistingQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    setLoadingQuizDetails(true);

    // If quiz already has questions array with content, use it directly
    if (quiz.questions && quiz.questions.length > 0) {
      setQuizData({
        id: quiz.id,
        title: quiz.title || quiz.topic,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        question_type: quiz.question_type,
        questions: quiz.questions,
        num_questions: quiz.num_questions || quiz.questions.length,
      });
      setLoadingQuizDetails(false);
      toast.success(`Selected: ${quiz.title || quiz.topic}`);
      return;
    }

    // Otherwise, fetch full quiz data from API
    try {
      const response = await axios.get(`${API_URL}/api/quizzes/${quiz.id}`, {
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
          username: userId,
        },
      });

      if (response.data.status === "success" && response.data.quiz) {
        const fullQuiz = response.data.quiz;
        setQuizData({
          id: fullQuiz.id,
          title: fullQuiz.title || fullQuiz.topic,
          topic: fullQuiz.topic,
          difficulty: fullQuiz.difficulty,
          question_type: fullQuiz.question_type,
          questions: fullQuiz.questions || [],
          num_questions:
            fullQuiz.num_questions || fullQuiz.questions?.length || 0,
        });
        toast.success(`Selected: ${fullQuiz.title || fullQuiz.topic}`);
      } else {
        toast.error("Failed to load quiz details");
        setSelectedQuiz(null);
      }
    } catch (error) {
      console.error("Error fetching quiz details:", error);
      toast.error("Failed to load quiz details");
      setSelectedQuiz(null);
    } finally {
      setLoadingQuizDetails(false);
    }
  };

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected to multiplayer server");
    });

    newSocket.on("error", (data) => {
      setError(data.message);
      toast.error(data.message);
      setTimeout(() => setError(""), 5000);
    });

    newSocket.on("room-created", (data) => {
      console.log("Room created:", data);
      setCurrentRoom(data.room);
      setPlayers(data.room.players);
      setGameState("lobby");
      setRoomCode(data.roomCode);
    });

    newSocket.on("room-joined", (data) => {
      console.log("Joined room:", data);
      setCurrentRoom(data.room);
      setPlayers(data.room.players);
      setGameState("lobby");
      setTimeLimit(data.room.timeLimit || 30);
    });

    newSocket.on("player-joined", (data) => {
      console.log("Player joined:", data);
      setPlayers(data.players);
      toast.success(`${data.username} joined the room!`);
    });

    newSocket.on("player-left", (data) => {
      console.log("Player left:", data);
      setPlayers(data.players);
      toast.info(`${data.username} left the room`);
    });

    newSocket.on("player-ready-update", (data) => {
      console.log("Player ready update:", data);
      setPlayers(data.players);
    });

    newSocket.on("all-players-ready", () => {
      console.log("All players ready!");
      toast.success("All players are ready!");
    });

    newSocket.on("quiz-updated", (data) => {
      console.log("Quiz updated:", data);
      setCurrentRoom((prev) => ({ ...prev, quizData: data.quizData }));
      toast.info(`Host updated the quiz: ${data.quizData.topic}`);
    });

    newSocket.on("time-limit-updated", (data) => {
      console.log("Time limit updated:", data);
      setTimeLimit(data.timeLimit);
      toast.info(`Time limit set to ${data.timeLimit} seconds per question`);
    });

    newSocket.on("game-started", (data) => {
      console.log("Game started:", data);
      setGameState("playing");
      setQuestionIndex(0);
      setCurrentQuestion(data.quizData.questions[0]);
      setTimeLeft(data.timeLimit || 30);
      setSelectedAnswer(null);
      setShowAnswerResult(false);
      questionStartTime.current = Date.now();
      startTimer(data.timeLimit || 30);
    });

    newSocket.on("answer-submitted", (data) => {
      console.log("Answer submitted:", data);
      setLeaderboard(data.leaderboard);
    });

    // Handle individual player's next question (independent progression)
    newSocket.on("player-next-question", (data) => {
      console.log("Player next question:", data);
      // Show result briefly before moving to next question
      setShowAnswerResult(true);
      setLastAnswerResult({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        points: data.points,
      });

      // After showing result, move to next question
      setTimeout(() => {
        setShowAnswerResult(false);
        setQuestionIndex(data.currentQuestion);
        setCurrentQuestion(data.question);
        setSelectedAnswer(null);
        setTimeLeft(data.timeLimit || 30);
        questionStartTime.current = Date.now();
        startTimer(data.timeLimit || 30);
      }, 500); // Small additional delay on frontend
    });

    // Keep legacy next-question for backwards compatibility
    newSocket.on("next-question", (data) => {
      console.log("Next question (legacy):", data);
      setQuestionIndex(data.currentQuestion);
      setCurrentQuestion(data.question);
      setSelectedAnswer(null);
      setTimeLeft(data.timeLimit || 30);
      questionStartTime.current = Date.now();
      startTimer(data.timeLimit || 30);
    });

    // Handle when this player finishes all questions
    newSocket.on("player-finished", (data) => {
      console.log("Player finished:", data);
      setGameState("waiting-for-others");
      setPlayerFinished(true);
      setMyFinalScore({
        score: data.score,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
      });
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success("You've completed the quiz! Waiting for others...");
    });

    // Handle when another player finishes
    newSocket.on("player-completed-quiz", (data) => {
      console.log("Player completed quiz:", data);
      setLeaderboard(data.leaderboard);
      toast.info(`${data.username} has finished the quiz!`);
    });

    newSocket.on("game-finished", (data) => {
      console.log("Game finished:", data);
      setGameState("finished");
      setFinalResults(data.results);
      setPlayerFinished(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success("Game finished! 🎉");
    });

    newSocket.on("room-closed", (data) => {
      toast.info(data.message);
      setGameState("menu");
      setCurrentRoom(null);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = (limit = 30) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeLeft(limit);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-submit null answer when time runs out
          handleAnswerSubmit(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const createRoom = () => {
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    // Create room with default quiz - host will select later
    const defaultQuizData = {
      topic: "Waiting for host to select...",
      questions: [],
    };

    socket.emit("create-room", {
      roomName: `${username}'s Room`,
      quizId: null,
      username: username,
      quizData: defaultQuizData,
      timeLimit: timeLimit,
    });
  };

  const joinRoom = () => {
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter room code");
      return;
    }

    socket.emit("join-room", {
      roomCode: roomCode.toUpperCase(),
      username: username,
    });
  };

  const toggleReady = () => {
    setIsReady(!isReady);
    socket.emit("player-ready", { roomCode: currentRoom.code });
  };

  const openQuizSetup = () => {
    fetchExistingQuizzes();
    setShowQuizSetup(true);
    setSetupStep(1);
  };

  const updateQuizForRoom = () => {
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      toast.error("Please select or generate a quiz first");
      return;
    }

    socket.emit("update-quiz", {
      roomCode: currentRoom.code,
      quizData: quizData,
      timeLimit: timeLimit,
    });

    setCurrentRoom((prev) => ({ ...prev, quizData: quizData }));
    setShowQuizSetup(false);
    setSetupStep(1);
    toast.success("Quiz updated for the room!");
  };

  const startGame = () => {
    if (
      !currentRoom?.quizData?.questions ||
      currentRoom.quizData.questions.length === 0
    ) {
      toast.error("Please select a quiz before starting the game");
      return;
    }

    socket.emit("start-game", {
      roomCode: currentRoom.code,
      timeLimit: timeLimit,
    });
  };

  const handleAnswerSubmit = (answer) => {
    if (selectedAnswer !== null) return; // Already answered

    const timeTaken = (Date.now() - questionStartTime.current) / 1000;
    setSelectedAnswer(answer);

    socket.emit("submit-answer", {
      roomCode: currentRoom.code,
      questionIndex: questionIndex,
      answer: answer,
      timeTaken: timeTaken,
    });

    if (timerRef.current) clearInterval(timerRef.current);
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit("leave-room", { roomCode: currentRoom.code });
    }
    setGameState("menu");
    setCurrentRoom(null);
    setIsReady(false);
    setSelectedQuiz(null);
    setQuizData(null);
    // Reset independent progression states
    setShowAnswerResult(false);
    setLastAnswerResult(null);
    setPlayerFinished(false);
    setMyFinalScore(null);
    setSelectedAnswer(null);
    setQuestionIndex(0);
    setCurrentQuestion(null);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter quizzes based on search
  const filteredQuizzes = existingQuizzes.filter(
    (quiz) =>
      quiz.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Enhanced Quiz Selection Dialog Component
  const QuizSetupDialog = () => (
    <Dialog
      open={showQuizSetup}
      onOpenChange={(open) => {
        setShowQuizSetup(open);
        if (!open) setSetupStep(1);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header with Steps */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl text-white">
              <Settings className="h-7 w-7" />
              Quiz Setup
            </DialogTitle>
            <DialogDescription className="text-purple-100 mt-1">
              Configure the perfect quiz experience for your multiplayer battle
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[
              { num: 1, label: "Select Quiz" },
              { num: 2, label: "Settings" },
              { num: 3, label: "Preview" },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer ${
                    setupStep === step.num
                      ? "bg-white text-purple-600 font-semibold"
                      : setupStep > step.num
                      ? "bg-purple-400/50 text-white"
                      : "bg-purple-500/30 text-purple-200"
                  }`}
                  onClick={() => {
                    if (
                      step.num === 1 ||
                      (step.num === 2 && quizData) ||
                      (step.num === 3 && quizData)
                    ) {
                      setSetupStep(step.num);
                    }
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                      setupStep > step.num ? "bg-green-500 text-white" : ""
                    }`}
                  >
                    {setupStep > step.num ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {idx < 2 && (
                  <ChevronRight
                    className={`h-5 w-5 ${
                      setupStep > step.num ? "text-white" : "text-purple-300"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Step 1: Select Quiz */}
          {setupStep === 1 && (
            <div className="space-y-6">
              <Tabs
                defaultValue="existing"
                onValueChange={setQuizSource}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger
                    value="existing"
                    className="flex items-center gap-2 py-3"
                  >
                    <ListChecks className="h-4 w-4" />
                    My Quizzes
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    className="flex items-center gap-2 py-3"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate New
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="mt-0">
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search your quizzes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {loadingQuizzes ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-3" />
                      <p className="text-gray-500">Loading your quizzes...</p>
                    </div>
                  ) : filteredQuizzes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <BookOpen className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {searchQuery
                          ? "No matching quizzes"
                          : "No quizzes found"}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 mb-4">
                        {searchQuery
                          ? "Try a different search term"
                          : "Generate a new quiz or take quizzes in the Quiz Generator first"}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setQuizSource("new")}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate New Quiz
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="grid gap-3">
                        {filteredQuizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            onClick={() =>
                              !loadingQuizDetails && selectExistingQuiz(quiz)
                            }
                            className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedQuiz?.id === quiz.id
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md"
                                : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                            } ${
                              loadingQuizDetails
                                ? "pointer-events-none opacity-70"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                  <h4 className="font-semibold text-lg truncate">
                                    {quiz.title || quiz.topic}
                                  </h4>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                                  <Target className="h-3.5 w-3.5" />
                                  {quiz.topic}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    className={getDifficultyColor(
                                      quiz.difficulty
                                    )}
                                  >
                                    {quiz.difficulty}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Brain className="h-3 w-3" />
                                    {quiz.question_type}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {quiz.num_questions} questions
                                  </Badge>
                                </div>
                              </div>
                              <div
                                className={`p-2 rounded-full transition-all ${
                                  selectedQuiz?.id === quiz.id
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30"
                                }`}
                              >
                                {selectedQuiz?.id === quiz.id &&
                                loadingQuizDetails ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : selectedQuiz?.id === quiz.id ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  <Button
                    variant="ghost"
                    onClick={fetchExistingQuizzes}
                    className="mt-4 w-full"
                    disabled={loadingQuizzes}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${
                        loadingQuizzes ? "animate-spin" : ""
                      }`}
                    />
                    Refresh List
                  </Button>
                </TabsContent>

                <TabsContent value="new" className="mt-0">
                  <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Generate AI Quiz
                      </CardTitle>
                      <CardDescription>
                        Create a custom quiz on any topic using AI
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Quiz Topic *
                        </Label>
                        <Input
                          placeholder="e.g., World History, JavaScript, Space Exploration..."
                          value={newQuizConfig.topic}
                          onChange={(e) =>
                            setNewQuizConfig((prev) => ({
                              ...prev,
                              topic: e.target.value,
                            }))
                          }
                          className="h-12"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Questions
                          </Label>
                          <Select
                            value={newQuizConfig.numQuestions.toString()}
                            onValueChange={(value) =>
                              setNewQuizConfig((prev) => ({
                                ...prev,
                                numQuestions: parseInt(value),
                              }))
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 10, 15, 20, 25].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} Questions
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Difficulty
                          </Label>
                          <Select
                            value={newQuizConfig.difficulty}
                            onValueChange={(value) =>
                              setNewQuizConfig((prev) => ({
                                ...prev,
                                difficulty: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easy">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Easy
                                </span>
                              </SelectItem>
                              <SelectItem value="Medium">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                  Medium
                                </span>
                              </SelectItem>
                              <SelectItem value="Hard">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Hard
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Type</Label>
                          <Select
                            value={newQuizConfig.questionType}
                            onValueChange={(value) =>
                              setNewQuizConfig((prev) => ({
                                ...prev,
                                questionType: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MCQ">MCQ</SelectItem>
                              <SelectItem value="True/False">
                                True/False
                              </SelectItem>
                              <SelectItem value="Fill in the Blanks">
                                Fill Blanks
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        onClick={generateNewQuiz}
                        disabled={generatingQuiz || !newQuizConfig.topic.trim()}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        {generatingQuiz ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generating Quiz...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-5 w-5" />
                            Generate Quiz with AI
                          </>
                        )}
                      </Button>

                      {quizData && quizSource === "new" && (
                        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800 dark:text-green-400">
                            <span className="font-semibold">
                              Quiz generated!
                            </span>{" "}
                            {quizData.questions?.length} questions ready.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 2: Settings */}
          {setupStep === 2 && (
            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {quizData?.title || quizData?.topic}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quizData?.questions?.length} questions •{" "}
                      {quizData?.difficulty} • {quizData?.question_type}
                    </p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Timer className="h-5 w-5 text-orange-500" />
                    Time Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how much time players have to answer each question
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { value: 15, label: "15s", desc: "Quick fire" },
                      { value: 20, label: "20s", desc: "Fast pace" },
                      { value: 30, label: "30s", desc: "Standard" },
                      { value: 45, label: "45s", desc: "Relaxed" },
                      { value: 60, label: "60s", desc: "Plenty of time" },
                      { value: 90, label: "90s", desc: "Extra time" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        onClick={() => setTimeLimit(option.value)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                          timeLimit === option.value
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                        }`}
                      >
                        <div
                          className={`text-2xl font-bold mb-1 ${
                            timeLimit === option.value
                              ? "text-orange-600"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {option.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-400">
                  <span className="font-semibold">Pro tip:</span> Faster time
                  limits add more excitement but may be challenging for complex
                  questions.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Preview */}
          {setupStep === 3 && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Ready to Start!
                  </CardTitle>
                  <CardDescription>
                    Review your quiz configuration before applying
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Quiz Topic
                      </div>
                      <div className="font-semibold">
                        {quizData?.topic || quizData?.title}
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Questions
                      </div>
                      <div className="font-semibold">
                        {quizData?.questions?.length} questions
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Difficulty
                      </div>
                      <Badge
                        className={getDifficultyColor(quizData?.difficulty)}
                      >
                        {quizData?.difficulty}
                      </Badge>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">
                        Time per Question
                      </div>
                      <div className="font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        {timeLimit} seconds
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">
                      Sample Questions
                    </div>
                    <div className="space-y-2">
                      {quizData?.questions?.slice(0, 2).map((q, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <span className="font-medium">Q{idx + 1}:</span>{" "}
                          {q.question?.substring(0, 80)}...
                        </div>
                      ))}
                      {quizData?.questions?.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          + {quizData.questions.length - 2} more questions
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3 w-full">
            {setupStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setSetupStep(setupStep - 1)}
                className="flex-1"
                disabled={loadingQuizDetails}
              >
                Back
              </Button>
            )}
            {setupStep === 1 && (
              <Button
                variant="outline"
                onClick={() => setShowQuizSetup(false)}
                className="flex-1"
                disabled={loadingQuizDetails}
              >
                Cancel
              </Button>
            )}
            {setupStep < 3 ? (
              <Button
                onClick={() => setSetupStep(setupStep + 1)}
                disabled={
                  !quizData || !quizData.questions?.length || loadingQuizDetails
                }
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loadingQuizDetails ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={updateQuizForRoom}
                disabled={!quizData || !quizData.questions?.length}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Apply Quiz Settings
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Menu Screen
  if (gameState === "menu") {
    return (
      <div className="w-full max-w-2xl mx-auto py-4 sm:py-8 px-4">
        <Card className="w-full">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Gamepad2 className="h-10 w-10 sm:h-16 sm:w-16 text-purple-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Multiplayer Quiz Battle
            </CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg">
              Compete with friends in real-time quiz battles!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-base sm:text-lg p-4 sm:p-6 h-12 sm:h-14"
              />

              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={createRoom}
                  className="p-4 sm:p-6 text-base sm:text-lg h-auto"
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Create Room
                </Button>

                <div className="space-y-2">
                  <Input
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="text-base sm:text-lg p-4 sm:p-6 h-12 sm:h-14"
                    maxLength={6}
                  />
                  <Button
                    onClick={joinRoom}
                    variant="outline"
                    className="w-full p-4 sm:p-6 text-base sm:text-lg h-auto"
                  >
                    <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Join Room
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                How to Play:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>🎮 Create or join a room with friends</li>
                <li>
                  📚 Host selects a quiz from results or generates new one
                </li>
                <li>⏱️ Host sets time limit per question</li>
                <li>⚡ Answer questions faster to earn bonus points</li>
                <li>🏆 Compete on the live leaderboard</li>
                <li>👑 The highest scorer wins!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lobby Screen
  if (gameState === "lobby") {
    const isHost = currentRoom && socket && currentRoom.host === socket.id;
    const allReady = players.every(
      (p) => p.ready || p.id === currentRoom?.host
    );
    const hasQuiz =
      currentRoom?.quizData?.questions &&
      currentRoom.quizData.questions.length > 0;

    return (
      <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 px-4">
        <QuizSetupDialog />

        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2">
                  Waiting Lobby
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1">
                  <span>Room Code:</span>
                  <span className="font-bold text-lg sm:text-2xl text-purple-600">
                    {currentRoom?.code}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyRoomCode}
                    className="ml-1 p-1"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={leaveRoom}
                size="sm"
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Leave
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiz Info Card */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Quiz:
                    </h4>
                    {hasQuiz ? (
                      <div className="mt-2">
                        <p className="text-lg font-medium">
                          {currentRoom.quizData.topic}
                        </p>
                        <p className="text-sm text-gray-600">
                          {currentRoom.quizData.questions.length} questions •{" "}
                          {timeLimit}s per question
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600 mt-2">
                        Waiting for host to select a quiz...
                      </p>
                    )}
                  </div>
                  {isHost && (
                    <Button onClick={openQuizSetup}>
                      <Settings className="mr-2 h-4 w-4" />
                      {hasQuiz ? "Change Quiz" : "Select Quiz"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Players List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({players.length})
                </h3>
              </div>

              <div className="grid gap-3">
                {players.map((player, idx) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {player.id === currentRoom.host && (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-medium">{player.username}</span>
                      {player.id === socket.id && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    {player.id !== currentRoom.host && player.ready && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {player.id === currentRoom.host && (
                      <Badge variant="outline">Host</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ready / Start Buttons */}
            <div className="space-y-3">
              {!isHost && (
                <Button
                  onClick={toggleReady}
                  className="w-full p-6 text-lg"
                  variant={isReady ? "outline" : "default"}
                >
                  {isReady ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Ready!
                    </>
                  ) : (
                    "Click to Ready Up"
                  )}
                </Button>
              )}

              {isHost && (
                <Button
                  onClick={startGame}
                  disabled={!hasQuiz || !allReady || players.length < 1}
                  className="w-full p-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {!hasQuiz ? (
                    "Select a quiz first..."
                  ) : !allReady ? (
                    "Waiting for players to be ready..."
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Start Game
                    </>
                  )}
                </Button>
              )}
            </div>

            {allReady && hasQuiz && players.length >= 1 && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-400">
                  All players ready!{" "}
                  {isHost
                    ? "You can start the game."
                    : "Waiting for host to start..."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing Screen
  if (gameState === "playing" && currentQuestion) {
    const totalQuestions = currentRoom?.quizData?.questions?.length || 1;
    const progress = ((questionIndex + 1) / totalQuestions) * 100;
    const options =
      currentQuestion.options ||
      (currentRoom?.quizData?.question_type === "True/False"
        ? ["True", "False"]
        : []);

    return (
      <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 px-4">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                Question {questionIndex + 1} of {totalQuestions}
              </h2>
              <Progress value={progress} className="w-full sm:w-64 mt-2" />
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 text-xl sm:text-2xl md:text-3xl font-bold px-3 sm:px-4 py-2 rounded-lg ${
                  timeLeft <= 10
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                }`}
              >
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl md:text-2xl">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid gap-2 sm:gap-3">
                {options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  return (
                    <Button
                      key={idx}
                      onClick={() => handleAnswerSubmit(idx)}
                      disabled={selectedAnswer !== null}
                      variant={isSelected ? "default" : "outline"}
                      className={`p-6 text-lg justify-start h-auto ${
                        isSelected
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="mr-3 font-bold">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {option}
                    </Button>
                  );
                })}
              </div>
              {selectedAnswer !== null && (
                <Alert
                  className={`mt-4 ${
                    showAnswerResult && lastAnswerResult
                      ? lastAnswerResult.isCorrect
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-900/20"
                  }`}
                >
                  {showAnswerResult && lastAnswerResult ? (
                    lastAnswerResult.isCorrect ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-400">
                          ✓ Correct! +{lastAnswerResult.points} points
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 dark:text-red-400">
                          ✗ Incorrect. Moving to next question...
                        </AlertDescription>
                      </>
                    )
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <AlertDescription className="text-blue-800 dark:text-blue-400">
                        Answer submitted! Loading next question...
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Live Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Live Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.length > 0 ? (
                  leaderboard.map((player, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        idx === 0
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-6">
                          {idx + 1}.
                        </span>
                        {idx === 0 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <span>{player.username}</span>
                      </div>
                      <span className="font-bold text-lg text-purple-600">
                        {player.score} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    Leaderboard will update after answers...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Waiting for Others Screen (when this player finishes before others)
  if (gameState === "waiting-for-others" && myFinalScore) {
    return (
      <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 px-4">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Quiz Completed!
            </h2>
            <p className="text-green-100">
              Great job! Waiting for other players to finish...
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Your Score Summary */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                {myFinalScore.score}
              </div>
              <div className="text-gray-600 dark:text-gray-400 mb-4">
                Your Score
              </div>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {myFinalScore.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-500">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {myFinalScore.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      (myFinalScore.correctAnswers /
                        myFinalScore.totalQuestions) *
                        100
                    )}
                    %
                  </div>
                  <div className="text-sm text-gray-500">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Current Standings
              </h3>
              <div className="space-y-2">
                {leaderboard.length > 0 ? (
                  leaderboard.map((player, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        idx === 0
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-6">
                          {idx + 1}.
                        </span>
                        {idx === 0 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <span>{player.username}</span>
                        {player.currentQuestion !== undefined && (
                          <Badge variant="outline" className="ml-2">
                            Q{(player.currentQuestion || 0) + 1}
                          </Badge>
                        )}
                      </div>
                      <span className="font-bold text-lg text-purple-600">
                        {player.score} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    Loading standings...
                  </p>
                )}
              </div>
            </div>

            {/* Waiting Animation */}
            <div className="flex flex-col items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 animate-pulse">
                Waiting for other players to complete the quiz...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen
  if (gameState === "finished" && finalResults) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <Trophy className="h-20 w-20 text-yellow-600 mx-auto mb-4" />
            <CardTitle className="text-4xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Game Over!
            </CardTitle>
            <CardDescription className="text-2xl mt-2">
              🎉 Winner:{" "}
              <span className="font-bold text-purple-600">
                {finalResults[0]?.username}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Podium for top 3 */}
            <div className="flex justify-center items-end gap-4 mb-8">
              {finalResults.slice(0, 3).map((player, idx) => {
                const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd positions
                const pos = podiumOrder[idx];
                const heights = ["h-24", "h-32", "h-20"];
                const colors = [
                  "bg-gray-300",
                  "bg-yellow-400",
                  "bg-orange-300",
                ];
                const medals = ["🥈", "🥇", "🥉"];

                return (
                  <div
                    key={player.username}
                    className="flex flex-col items-center"
                    style={{ order: pos }}
                  >
                    <span className="text-4xl mb-2">{medals[idx]}</span>
                    <span className="font-bold text-lg mb-2">
                      {player.username}
                    </span>
                    <div
                      className={`w-24 ${heights[idx]} ${colors[idx]} rounded-t-lg flex items-end justify-center pb-2`}
                    >
                      <span className="font-bold text-xl">{player.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full Results Table */}
            <div className="space-y-3">
              <h3 className="font-semibold text-xl">Final Results:</h3>
              {finalResults.map((player, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    idx === 0
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 dark:from-yellow-900/20 dark:to-orange-900/20"
                      : idx === 1
                      ? "bg-gray-100 dark:bg-gray-800"
                      : idx === 2
                      ? "bg-orange-50 dark:bg-orange-900/10"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-2xl w-8">{idx + 1}</span>
                    {idx === 0 && <Crown className="h-6 w-6 text-yellow-600" />}
                    <div>
                      <div className="font-semibold text-lg">
                        {player.username}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {player.correctAnswers}/{player.totalAnswers} correct •{" "}
                        {Math.round(
                          (player.correctAnswers / player.totalAnswers) * 100
                        )}
                        % accuracy
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {player.score}
                    </div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setGameState("menu");
                  setCurrentRoom(null);
                  setSelectedQuiz(null);
                  setQuizData(null);
                  setFinalResults(null);
                }}
                className="flex-1"
              >
                Back to Menu
              </Button>
              <Button
                onClick={() => navigate("/results")}
                variant="outline"
                className="flex-1"
              >
                View All Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};

export default MultiplayerQuiz;
