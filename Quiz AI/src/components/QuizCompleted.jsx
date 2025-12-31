// QuizCompleted.jsx - Beautiful Quiz Completion Celebration Page
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Trophy,
  Star,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  Medal,
  Crown,
  Award,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

function QuizCompleted() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [countUpScore, setCountUpScore] = useState(0);

  // Get score from navigation state first, then fallback to localStorage
  const [scoreData, setScoreData] = useState({
    score: location.state?.score ?? localStorage.getItem("quizScore") ?? 0,
    total: location.state?.total ?? localStorage.getItem("quizTotal") ?? 0,
    xpEarned: location.state?.xpEarned ?? localStorage.getItem("quizXP") ?? 0,
  });

  // Calculate percentage and performance
  const percentage = useMemo(() => {
    const score = parseInt(scoreData.score) || 0;
    const total = parseInt(scoreData.total) || 1;
    return Math.round((score / total) * 100);
  }, [scoreData]);

  const performance = useMemo(() => {
    if (percentage >= 90)
      return {
        label: "Outstanding!",
        color: "from-yellow-400 to-amber-500",
        icon: Crown,
        message: "You're a quiz master!",
      };
    if (percentage >= 80)
      return {
        label: "Excellent!",
        color: "from-green-400 to-emerald-500",
        icon: Trophy,
        message: "Amazing performance!",
      };
    if (percentage >= 70)
      return {
        label: "Great Job!",
        color: "from-blue-400 to-cyan-500",
        icon: Medal,
        message: "Keep up the good work!",
      };
    if (percentage >= 60)
      return {
        label: "Good Effort!",
        color: "from-purple-400 to-violet-500",
        icon: Award,
        message: "You're improving!",
      };
    return {
      label: "Keep Trying!",
      color: "from-orange-400 to-red-500",
      icon: Target,
      message: "Practice makes perfect!",
    };
  }, [percentage]);

  const PerformanceIcon = performance.icon;

  // Re-read from localStorage on mount
  useEffect(() => {
    const storedScore = localStorage.getItem("quizScore");
    const storedTotal = localStorage.getItem("quizTotal");
    const storedXP = localStorage.getItem("quizXP");

    setScoreData({
      score: location.state?.score ?? storedScore ?? 0,
      total: location.state?.total ?? storedTotal ?? 0,
      xpEarned: location.state?.xpEarned ?? storedXP ?? 0,
    });
  }, [location.state]);

  // Count up animation for score
  useEffect(() => {
    const targetScore = parseInt(scoreData.score) || 0;
    const duration = 1500;
    const steps = 30;
    const increment = targetScore / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setCountUpScore(targetScore);
        clearInterval(timer);
      } else {
        setCountUpScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [scoreData.score]);

  // Confetti and content reveal
  useEffect(() => {
    // Show content after a brief delay
    const contentTimer = setTimeout(() => setShowContent(true), 500);

    // Celebration confetti
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const colors =
      percentage >= 70
        ? ["#FFD700", "#FFA500", "#FF6347", "#00FF00", "#00CED1"]
        : ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors,
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors,
      });
    }, 250);

    // Special burst for high scores
    if (percentage >= 80) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FFD700", "#FFA500"],
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(contentTimer);
    };
  }, [percentage]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/30 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        />

        {/* Floating Stars */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Star className="w-4 h-4 text-yellow-400/60" fill="currentColor" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center max-w-lg w-full"
            >
              {/* Success Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${performance.color} text-white font-semibold shadow-lg`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Quiz Completed!
                </div>
              </motion.div>

              {/* Main Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl"
              >
                {/* Performance Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
                  className={`w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-full bg-gradient-to-br ${performance.color} flex items-center justify-center shadow-2xl`}
                >
                  <PerformanceIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                </motion.div>

                {/* Performance Label */}
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className={`text-3xl sm:text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r ${performance.color} bg-clip-text text-transparent`}
                >
                  {performance.label}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-white/70 text-lg mb-8"
                >
                  {performance.message}
                </motion.p>

                {/* Score Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10"
                >
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-5xl sm:text-6xl font-black text-white mb-1">
                        {countUpScore}
                        <span className="text-3xl text-white/50">
                          /{scoreData.total}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm">Questions Correct</p>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-white/10"
                      />
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 352" }}
                        animate={{
                          strokeDasharray: `${(percentage / 100) * 352} 352`,
                        }}
                        transition={{
                          duration: 1.5,
                          delay: 1,
                          ease: "easeOut",
                        }}
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* XP Earned */}
                {scoreData.xpEarned && parseInt(scoreData.xpEarned) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex items-center justify-center gap-3 mb-6"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="p-2 rounded-full bg-yellow-500/20"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-lg">
                        +{scoreData.xpEarned} XP
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, -360] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="p-2 rounded-full bg-yellow-500/20"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                  </motion.div>
                )}

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="grid grid-cols-3 gap-3 mb-6"
                >
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                    <p className="text-white font-bold">{scoreData.score}</p>
                    <p className="text-white/50 text-xs">Correct</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <p className="text-white font-bold">{scoreData.total}</p>
                    <p className="text-white/50 text-xs">Total</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
                    <p className="text-white font-bold">{percentage}%</p>
                    <p className="text-white/50 text-xs">Score</p>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Button
                    onClick={() => navigate("/results")}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg group"
                  >
                    View Full Results
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    onClick={() => navigate("/generate-quiz")}
                    variant="outline"
                    className="flex-1 border-white/30 text-white hover:bg-white/10 py-3 rounded-xl"
                  >
                    New Quiz
                  </Button>
                </motion.div>
              </motion.div>

              {/* Auto-redirect notice */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-white/40 text-sm mt-6"
              >
                Click above to view your detailed results
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default QuizCompleted;
