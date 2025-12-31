// src/components/About.jsx

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Users,
  Target,
  Award,
  BookOpen,
  Zap,
  Globe,
  Shield,
  Heart,
} from "lucide-react";

function About() {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered",
      description:
        "Advanced machine learning algorithms create intelligent, contextual questions.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Generate comprehensive quizzes in seconds, not hours.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multiplayer",
      description:
        "Challenge friends in real-time quiz battles and climb leaderboards.",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Multi-Modal",
      description: "Upload PDFs, images, videos, or audio to create quizzes.",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Adaptive Learning",
      description: "AI adjusts difficulty based on your performance.",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Achievements",
      description: "Earn badges, XP, and track your progress over time.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Quizzes Generated" },
    { value: "50K+", label: "Active Users" },
    { value: "95%", label: "Satisfaction" },
    { value: "24/7", label: "Available" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 sm:mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>About Quiz AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
          <span className="gradient-text">Revolutionizing Learning</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
          We're passionate about creating engaging, intelligent quizzes that
          make learning fun and effective. Our AI-powered platform transforms
          any content into interactive learning experiences.
        </p>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16"
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            className="glass-card rounded-xl p-4 sm:p-6 text-center"
          >
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1">
              {stat.value}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12 sm:mb-16"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10">
          <span className="gradient-text">What Makes Us Special</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 sm:mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6 sm:p-8 md:p-12 text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white mb-4 sm:mb-6">
          <Heart className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
          Our Mission
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Whether you're a student testing your knowledge, a teacher creating
          materials for your class, or a lifelong learner exploring new topics,
          Quiz AI is here to transform how you learn. We believe that education
          should be accessible, engaging, and personalized for everyone.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span>Global Access</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span>Secure Platform</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span>Always Improving</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default About;
