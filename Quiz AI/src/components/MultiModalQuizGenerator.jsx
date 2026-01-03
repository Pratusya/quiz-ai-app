import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Video,
  Image,
  Mic,
  Loader2,
  CheckCircle,
  AlertCircle,
  Youtube,
  Settings,
  BookOpen,
  Play,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://quiz-ai-app-pqyh.onrender.com";

const MultiModalQuizGenerator = () => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState("pdf");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const navigate = useNavigate();

  // New states for quiz configuration
  const [uploadComplete, setUploadComplete] = useState(false);
  const [extractedContent, setExtractedContent] = useState(null);
  const [showQuizOptions, setShowQuizOptions] = useState(false);
  const [quizConfig, setQuizConfig] = useState({
    questionType: "MCQ",
    numQuestions: 5,
    difficulty: "Medium",
    topic: "",
    customTopic: "",
  });
  const [detectedTopics, setDetectedTopics] = useState([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  // Redirect to sign in if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    // Validate file size (50MB max)
    if (uploadedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }

    setFile(uploadedFile);
    setError("");
    setSuccess("");
    setUploadComplete(false);
    setShowQuizOptions(false);
    setGeneratedQuiz(null);

    // Process the file upload
    await processFileUpload(uploadedFile, contentType);
  };

  const processFileUpload = async (fileToUpload, type) => {
    setLoading(true);
    setUploadProgress(0);
    setError("");

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      // Just mark as uploaded - actual processing happens when generating quiz
      await new Promise((resolve) => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Set default topics based on content type
      const defaultTopics =
        type === "pdf"
          ? ["Document Content", "General Knowledge"]
          : type === "image"
          ? ["Image Content", "Visual Information"]
          : ["Audio Content", "Spoken Information"];

      setDetectedTopics(defaultTopics);
      setUploadComplete(true);
      setShowQuizOptions(true);
      setSuccess(
        "✅ File uploaded successfully! Now configure your quiz options below."
      );
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Failed to upload file. Please try again.");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const generateQuizFromContent = async () => {
    setGeneratingQuiz(true);
    setError("");

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      formData.append("contentType", contentType);
      formData.append("numQuestions", quizConfig.numQuestions.toString());
      formData.append("difficulty", quizConfig.difficulty);
      formData.append("questionType", quizConfig.questionType);
      formData.append(
        "topic",
        quizConfig.customTopic || quizConfig.topic || "General"
      );
      formData.append("language", "english");

      const response = await fetch(`${API_URL}/api/generate-from-content`, {
        method: "POST",
        headers: {
          "user-id": userId,
          username: userId,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate quiz");
      }

      const data = await response.json();
      setGeneratedQuiz(data);
      setSuccess(
        `🎉 Successfully generated ${data.questions?.length || 0} questions!`
      );
      toast.success(
        `Quiz generated with ${data.questions?.length || 0} questions!`
      );
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Failed to generate quiz. Please try again.");
      toast.error("Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl) {
      setError("Please enter a YouTube URL");
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadComplete(false);
    setShowQuizOptions(false);

    try {
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setDetectedTopics(["Video Content", "Educational Material"]);
      setUploadComplete(true);
      setShowQuizOptions(true);
      setSuccess(
        "✅ Video processed successfully! Now configure your quiz options below."
      );
      toast.success("Video processed successfully!");
    } catch (error) {
      console.error("Error:", error);
      setError(
        "Failed to process video. Make sure the video has subtitles/captions."
      );
    } finally {
      setLoading(false);
    }
  };

  const generateYoutubeQuiz = async () => {
    setGeneratingQuiz(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/generate-from-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
          username: userId,
        },
        body: JSON.stringify({
          url: youtubeUrl,
          numQuestions: quizConfig.numQuestions,
          difficulty: quizConfig.difficulty,
          questionType: quizConfig.questionType,
          topic: quizConfig.customTopic || quizConfig.topic || "Video Content",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate quiz");
      }

      const data = await response.json();
      setGeneratedQuiz(data);
      setSuccess(
        `🎉 Successfully generated ${
          data.questions?.length || 0
        } questions from video!`
      );
      toast.success(
        `Quiz generated with ${data.questions?.length || 0} questions!`
      );
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Failed to generate quiz from video.");
      toast.error("Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/wav" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        // Mark upload complete after recording stops
        setUploadComplete(true);
        setShowQuizOptions(true);
        setDetectedTopics(["Audio Content", "Spoken Information"]);
        setSuccess(
          "✅ Recording complete! Now configure your quiz options below."
        );
        toast.success("Recording saved successfully!");
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAudioQuizGeneration = async () => {
    if (!audioBlob) {
      setError("Please record audio first");
      return;
    }

    setGeneratingQuiz(true);
    setError("");

    try {
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });

      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("contentType", "audio");
      formData.append("numQuestions", quizConfig.numQuestions.toString());
      formData.append("difficulty", quizConfig.difficulty);
      formData.append("questionType", quizConfig.questionType);
      formData.append(
        "topic",
        quizConfig.customTopic || quizConfig.topic || "Audio Content"
      );

      const response = await fetch(`${API_URL}/api/generate-from-content`, {
        method: "POST",
        headers: {
          "user-id": userId,
          username: userId,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate quiz");
      }

      const data = await response.json();
      setGeneratedQuiz(data);
      setSuccess(
        `🎉 Successfully generated ${
          data.questions?.length || 0
        } questions from audio!`
      );
      toast.success(
        `Quiz generated with ${data.questions?.length || 0} questions!`
      );
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Failed to generate quiz from audio.");
      toast.error("Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const startQuiz = () => {
    console.log("startQuiz called, generatedQuiz:", generatedQuiz);
    if (generatedQuiz?.quizId) {
      const quizData = {
        id: generatedQuiz.quizId,
        questions: generatedQuiz.questions,
        topic: quizConfig.customTopic || quizConfig.topic || "General",
        difficulty: quizConfig.difficulty,
        questionType: quizConfig.questionType,
        numQuestions:
          generatedQuiz.questions?.length || quizConfig.numQuestions,
        language: "english",
      };
      console.log("Navigating to /generate-quiz with quizData:", quizData);

      // Navigate to quiz generator with the generated quiz data
      navigate("/generate-quiz", {
        state: {
          retakeMode: true,
          quizData: quizData,
        },
      });
    } else {
      console.error("Cannot start quiz - no quizId found:", generatedQuiz);
      toast.error("Quiz not ready. Please generate a quiz first.");
    }
  };

  const viewQuizDetails = () => {
    if (generatedQuiz?.quizId) {
      navigate(`/quiz-details/${generatedQuiz.quizId}`);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadComplete(false);
    setShowQuizOptions(false);
    setExtractedContent(null);
    setGeneratedQuiz(null);
    setSuccess("");
    setError("");
    setUploadProgress(0);
    setYoutubeUrl("");
    setAudioBlob(null);
    setQuizConfig({
      questionType: "MCQ",
      numQuestions: 5,
      difficulty: "Medium",
      topic: "",
      customTopic: "",
    });
  };

  // Quiz Options Configuration Panel
  const QuizOptionsPanel = () => (
    <Card className="mt-4 sm:mt-6 border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
          Quiz Configuration
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Customize how your quiz will be generated
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Question Type Selection */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label
            htmlFor="questionType"
            className="text-sm sm:text-base font-medium"
          >
            Question Type
          </Label>
          <Select
            value={quizConfig.questionType}
            onValueChange={(value) =>
              setQuizConfig((prev) => ({ ...prev, questionType: value }))
            }
          >
            <SelectTrigger className="w-full text-sm sm:text-base">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
              <SelectItem value="True/False">True / False</SelectItem>
              <SelectItem value="Fill in the Blanks">
                Fill in the Blanks
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Number of Questions */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label
            htmlFor="numQuestions"
            className="text-sm sm:text-base font-medium"
          >
            Number of Questions
          </Label>
          <Select
            value={quizConfig.numQuestions.toString()}
            onValueChange={(value) =>
              setQuizConfig((prev) => ({
                ...prev,
                numQuestions: parseInt(value),
              }))
            }
          >
            <SelectTrigger className="w-full text-sm sm:text-base">
              <SelectValue placeholder="Select number of questions" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} Questions
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Level */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label
            htmlFor="difficulty"
            className="text-sm sm:text-base font-medium"
          >
            Difficulty Level
          </Label>
          <Select
            value={quizConfig.difficulty}
            onValueChange={(value) =>
              setQuizConfig((prev) => ({ ...prev, difficulty: value }))
            }
          >
            <SelectTrigger className="w-full text-sm sm:text-base">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Topic Selection */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="topic" className="text-sm sm:text-base font-medium">
            Select Topic from Content
          </Label>
          {detectedTopics.length > 0 ? (
            <Select
              value={quizConfig.topic}
              onValueChange={(value) =>
                setQuizConfig((prev) => ({
                  ...prev,
                  topic: value,
                  customTopic: "",
                }))
              }
            >
              <SelectTrigger className="w-full text-sm sm:text-base">
                <SelectValue placeholder="Choose a detected topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics (General)</SelectItem>
                {detectedTopics.map((topic, idx) => (
                  <SelectItem key={idx} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Enter topic for quiz generation"
              value={quizConfig.topic}
              onChange={(e) =>
                setQuizConfig((prev) => ({ ...prev, topic: e.target.value }))
              }
              className="text-sm sm:text-base"
            />
          )}
        </div>

        {/* Custom Topic Override */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label
            htmlFor="customTopic"
            className="text-sm sm:text-base font-medium"
          >
            Or Enter Custom Topic (Optional)
          </Label>
          <Input
            placeholder="Enter a specific topic to focus on..."
            value={quizConfig.customTopic}
            onChange={(e) =>
              setQuizConfig((prev) => ({
                ...prev,
                customTopic: e.target.value,
              }))
            }
            className="text-sm sm:text-base"
          />
          <p className="text-[10px] sm:text-xs text-gray-500">
            Override detected topics with your own specific topic
          </p>
        </div>

        {/* Generate Quiz Button */}
        <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
          <Button
            className="w-full p-4 sm:p-6 text-sm sm:text-base md:text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={
              contentType === "video"
                ? generateYoutubeQuiz
                : contentType === "audio" && audioBlob
                ? handleAudioQuizGeneration
                : generateQuizFromContent
            }
            disabled={generatingQuiz}
          >
            {generatingQuiz ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Generate Quiz
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={resetUpload}
          >
            Upload Different File
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Generated Quiz Actions Panel
  const GeneratedQuizPanel = () => (
    <Card className="mt-4 sm:mt-6 border-2 border-green-200 dark:border-green-800">
      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          Quiz Generated Successfully!
        </CardTitle>
        <CardDescription className="text-sm">
          {generatedQuiz?.questions?.length || 0} questions ready •{" "}
          {quizConfig.questionType} • {quizConfig.difficulty}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:pt-6 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            className="p-4 sm:p-6 text-sm sm:text-lg bg-green-600 hover:bg-green-700"
            onClick={startQuiz}
          >
            <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Start Quiz Now
          </Button>
          <Button
            variant="outline"
            className="p-4 sm:p-6 text-sm sm:text-lg"
            onClick={viewQuizDetails}
          >
            <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            View Details
          </Button>
        </div>
        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={resetUpload}
        >
          Generate Another Quiz
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6">
      <Card className="w-full overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
            🚀 Multi-Modal Quiz Generator
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
            Upload PDFs, videos, images, or audio to generate intelligent
            AI-powered quizzes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          {error && (
            <Alert variant="destructive" className="mb-3 sm:mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm ml-2">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-3 sm:mb-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-400 ml-2">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="pdf"
            onValueChange={(value) => {
              setContentType(value);
              if (!uploadComplete) {
                resetUpload();
              }
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full h-auto p-1 gap-1">
              <TabsTrigger
                value="pdf"
                disabled={uploadComplete && contentType !== "pdf"}
                className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>PDF</span>
              </TabsTrigger>
              <TabsTrigger
                value="video"
                disabled={uploadComplete && contentType !== "video"}
                className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1"
              >
                <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Video</span>
              </TabsTrigger>
              <TabsTrigger
                value="image"
                disabled={uploadComplete && contentType !== "image"}
                className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1"
              >
                <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Image</span>
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                disabled={uploadComplete && contentType !== "audio"}
                className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1"
              >
                <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Audio</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="mt-4 sm:mt-6">
              {!uploadComplete ? (
                <div className="border-2 border-dashed rounded-lg p-4 sm:p-8 md:p-12 text-center hover:border-purple-400 transition-colors">
                  <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 mb-2 sm:mb-4" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Upload PDF Documents
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    Max file size: 50MB | Supported: .pdf
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                    disabled={loading}
                  />
                  <label htmlFor="pdf-upload">
                    <Button
                      className="mt-2 sm:mt-4 text-sm"
                      variant="outline"
                      disabled={loading}
                      asChild
                    >
                      <span>
                        {loading ? (
                          <>
                            <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Choose PDF File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  {file && contentType === "pdf" && (
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 break-all px-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-green-600 mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-lg font-medium text-green-700 dark:text-green-400 break-all px-2">
                    {file?.name || "PDF"} uploaded successfully!
                  </p>
                  {extractedContent?.extractedTextLength && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Extracted{" "}
                      {extractedContent.extractedTextLength.toLocaleString()}{" "}
                      characters
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="video" className="mt-4 sm:mt-6">
              {!uploadComplete ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Youtube className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold">
                      Generate Quiz from YouTube Video
                    </h3>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter YouTube URL..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="text-sm sm:text-base md:text-lg p-3 sm:p-4 md:p-6"
                    disabled={loading}
                  />
                  <Button
                    className="w-full p-3 sm:p-4 md:p-6 text-sm sm:text-base md:text-lg"
                    onClick={handleYoutubeSubmit}
                    disabled={loading || !youtubeUrl}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Processing Video...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Process Video
                      </>
                    )}
                  </Button>
                  <p className="text-xs sm:text-sm text-gray-500 text-center">
                    The video must have English captions/subtitles enabled
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-green-600 mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-lg font-medium text-green-700 dark:text-green-400">
                    Video processed successfully!
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 truncate max-w-full px-2">
                    {youtubeUrl}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="image" className="mt-4 sm:mt-6">
              {!uploadComplete ? (
                <div className="border-2 border-dashed rounded-lg p-4 sm:p-8 md:p-12 text-center hover:border-blue-400 transition-colors">
                  <Image className="mx-auto h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 mb-2 sm:mb-4" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Upload Images with Text
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 px-2">
                    OCR will extract text from images | Supported: .jpg, .png,
                    .jpeg
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={loading}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      className="mt-2 sm:mt-4 text-sm"
                      variant="outline"
                      disabled={loading}
                      asChild
                    >
                      <span>
                        {loading ? (
                          <>
                            <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Image className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Choose Image
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  {file && contentType === "image" && (
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 break-all px-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-green-600 mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-lg font-medium text-green-700 dark:text-green-400 break-all px-2">
                    {file?.name || "Image"} uploaded successfully!
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="audio" className="mt-4 sm:mt-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <Mic className="mx-auto h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 mb-2 sm:mb-4" />
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">
                    Record Audio
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 px-2">
                    Record a lecture or explanation to generate quiz questions
                  </p>
                </div>

                {!isRecording && !audioBlob && !uploadComplete && (
                  <Button
                    className="w-full p-4 sm:p-6 text-sm sm:text-base md:text-lg"
                    onClick={startRecording}
                    disabled={loading}
                  >
                    <Mic className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Start Recording
                  </Button>
                )}

                {isRecording && (
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-600 rounded-full animate-pulse" />
                      <span className="text-sm sm:text-base md:text-lg font-medium">
                        Recording...
                      </span>
                    </div>
                    <Button
                      className="w-full p-4 sm:p-6 text-sm sm:text-base md:text-lg"
                      onClick={stopRecording}
                      variant="destructive"
                    >
                      Stop Recording
                    </Button>
                  </div>
                )}

                {uploadComplete && contentType === "audio" && (
                  <div className="text-center p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-green-600 mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-lg font-medium text-green-700 dark:text-green-400">
                      Recording complete!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Show Quiz Options Panel when upload is complete */}
          {showQuizOptions && !generatedQuiz && <QuizOptionsPanel />}

          {/* Show Generated Quiz Actions */}
          {generatedQuiz && <GeneratedQuizPanel />}

          {loading && uploadProgress > 0 && (
            <div className="mt-4 sm:mt-6 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {!uploadComplete && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
              <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                How it works:
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">📄</span>
                  <span>
                    <strong>PDF:</strong> Extracts text and generates contextual
                    questions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">🎥</span>
                  <span>
                    <strong>Video:</strong> Uses transcripts to create
                    comprehensive quizzes
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">🖼️</span>
                  <span>
                    <strong>Image:</strong> OCR technology reads text from
                    images
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0">🎤</span>
                  <span>
                    <strong>Audio:</strong> Transcribes speech and creates
                    intelligent questions
                  </span>
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiModalQuizGenerator;
