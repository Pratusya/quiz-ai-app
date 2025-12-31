// Home.jsx - Modern AI Quiz Generator Landing Page

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { GlassCard, GradientBorderCard, StatsCard } from "./ui/GlassCard";
import { FeatureCard } from "./ui/card";
import AnimatedBackground, { ParticleField } from "./ui/AnimatedBackground";
import {
  ArrowRight,
  Brain,
  Zap,
  Users,
  Sparkles,
  Trophy,
  Target,
  BookOpen,
  Cpu,
  Globe,
  Shield,
  TrendingUp,
  Play,
  Star,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import GamificationDisplay from "./GamificationDisplay";

function Home() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Brain className="w-7 h-7" />,
      title: "AI-Powered Generation",
      description:
        "Advanced neural networks create intelligent, contextual questions tailored to your learning needs.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: "Instant Creation",
      description:
        "Generate comprehensive quizzes in seconds, not hours. Save time while maintaining quality.",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Multiplayer Mode",
      description:
        "Challenge friends in real-time quiz battles. Compete on leaderboards and earn achievements.",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      icon: <BookOpen className="w-7 h-7" />,
      title: "Multi-Modal Learning",
      description:
        "Upload documents, images, or videos. Our AI extracts key concepts and generates quizzes automatically.",
      gradient: "from-emerald-500 to-teal-600",
    },
  ];

  const stats = [
    {
      value: "10K+",
      label: "Quizzes Generated",
      icon: <Target className="w-5 h-5" />,
    },
    {
      value: "50K+",
      label: "Active Users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      value: "95%",
      label: "Satisfaction Rate",
      icon: <Star className="w-5 h-5" />,
    },
    {
      value: "24/7",
      label: "AI Availability",
      icon: <Cpu className="w-5 h-5" />,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <ParticleField count={50} />

      {/* Aurora Effect */}
      <div className="aurora" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Hero Section */}
        <section className="pt-6 sm:pt-8 md:pt-12 pb-10 sm:pb-16 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto px-2 sm:px-0"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 md:mb-8"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Powered by Advanced AI</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 leading-tight">
              <span className="block text-foreground">Transform Learning</span>
              <span className="block gradient-text">With AI Quizzes</span>
            </h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4"
            >
              Create intelligent, personalized quizzes on any topic in seconds.
              Perfect for educators, students, and lifelong learners.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0"
            >
              {isSignedIn ? (
                <>
                  <Button
                    onClick={() => navigate("/generate-quiz")}
                    size="xl"
                    variant="gradient"
                    shimmer
                    className="group"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Start Creating
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    onClick={() => navigate("/multiplayer")}
                    size="xl"
                    variant="outline"
                    className="group"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Join Multiplayer
                  </Button>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button
                      size="xl"
                      variant="gradient"
                      shimmer
                      className="group"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </SignInButton>
                  <Button
                    onClick={() => navigate("/about")}
                    size="xl"
                    variant="outline"
                  >
                    Learn More
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Floating 3D Elements */}
          <div className="absolute top-20 left-10 hidden lg:block">
            <motion.div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-purple-500/30"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            />
          </div>
          <div className="absolute top-40 right-20 hidden lg:block">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-blue-500/30"
              animate={{
                y: [0, 15, 0],
                x: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </div>
          <div className="absolute bottom-20 left-1/4 hidden lg:block">
            <motion.div
              className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-orange-500/30"
              animate={{
                y: [0, -15, 0],
                rotate: [0, -15, 0],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 sm:py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className="p-3 sm:p-4 md:p-6 text-center"
                  tiltEnabled={false}
                >
                  <div className="inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 text-primary mb-2 sm:mb-3">
                    {React.cloneElement(stat.icon, {
                      className: "w-4 h-4 sm:w-5 sm:h-5",
                    })}
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold gradient-text mb-0.5 sm:mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-10 sm:py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16 px-2"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, share, and master knowledge through
              intelligent quizzes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <GlassCard
                  className={`p-4 sm:p-5 md:p-6 h-full cursor-pointer transition-all duration-300 ${
                    activeFeature === index
                      ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                      : ""
                  }`}
                  glowEnabled={activeFeature === index}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-3 sm:mb-4 shadow-lg`}
                  >
                    {React.cloneElement(feature.icon, {
                      className: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7",
                    })}
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section className="py-10 sm:py-16 md:py-20">
          <GradientBorderCard className="p-0 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left - Info */}
              <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                    <Cpu className="w-3 h-3 sm:w-4 sm:h-4" />
                    AI-Powered
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                    Experience the Future of Learning
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                    Our AI understands context, difficulty levels, and learning
                    objectives to create perfectly tailored assessments that
                    adapt to your needs.
                  </p>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      {
                        icon: <Target className="w-5 h-5" />,
                        text: "Adaptive difficulty based on performance",
                      },
                      {
                        icon: <Shield className="w-5 h-5" />,
                        text: "Anti-cheating measures built-in",
                      },
                      {
                        icon: <TrendingUp className="w-5 h-5" />,
                        text: "Progress tracking & analytics",
                      },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 sm:gap-3 text-foreground text-sm sm:text-base"
                      >
                        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary">
                          {item.icon}
                        </div>
                        <span>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right - Visual */}
              <div className="relative bg-gradient-to-br from-primary/5 to-purple-500/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[280px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center">
                <div className="relative w-full max-w-[280px] sm:max-w-sm">
                  {/* Floating quiz preview cards */}
                  <motion.div
                    className="absolute -top-2 sm:-top-4 -left-2 sm:-left-4 w-full"
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <GlassCard className="p-3 sm:p-4" tiltEnabled={false}>
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm sm:text-base">
                          AI Quiz
                        </span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="h-2 sm:h-3 bg-muted rounded-full w-full" />
                        <div className="h-2 sm:h-3 bg-muted rounded-full w-3/4" />
                      </div>
                    </GlassCard>
                  </motion.div>

                  <motion.div
                    className="absolute top-14 sm:top-20 -right-2 sm:-right-4 w-4/5"
                    animate={{ y: [0, 10, 0] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  >
                    <GlassCard className="p-3 sm:p-4" tiltEnabled={false}>
                      <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium">
                          Score
                        </span>
                        <span className="text-primary font-bold text-sm sm:text-base">
                          95%
                        </span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-purple-500"
                          initial={{ width: 0 }}
                          whileInView={{ width: "95%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </GlassCard>
                  </motion.div>

                  <motion.div
                    className="absolute bottom-0 left-4 sm:left-8 w-3/4"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2,
                    }}
                  >
                    <GlassCard className="p-3 sm:p-4" tiltEnabled={false}>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        <span className="font-medium">
                          Achievement Unlocked!
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>
              </div>
            </div>
          </GradientBorderCard>
        </section>

        {/* Gamification Display for signed-in users */}
        {isSignedIn && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-8 sm:py-12 md:py-16"
          >
            <GamificationDisplay compact={true} />
          </motion.section>
        )}

        {/* CTA Section */}
        <section className="py-10 sm:py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

            <div className="relative px-4 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16 lg:py-20 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6"
              >
                Ready to Transform Your Learning?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg text-white/80 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4"
              >
                Join thousands of educators and learners who are already
                creating smarter quizzes with AI.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                {isSignedIn ? (
                  <Button
                    onClick={() => navigate("/generate-quiz")}
                    size="xl"
                    className="bg-white text-primary hover:bg-white/90 shadow-2xl"
                  >
                    Create Your First Quiz
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button
                      size="xl"
                      className="bg-white text-primary hover:bg-white/90 shadow-2xl"
                    >
                      Get Started for Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </SignInButton>
                )}
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

export default Home;
