// App.jsx
import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner, { FullPageLoader } from "./components/LoadingSpinner";
import { motion } from "framer-motion";
import { Home as HomeIcon, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "./components/ui/button";

// Lazy loaded components
const Home = lazy(() => import("./components/Home"));
const QuizGenerator = lazy(() => import("./components/QuizGenerator"));
const About = lazy(() => import("./components/About"));
const Contact = lazy(() => import("./components/Contact"));
const QuizResults = lazy(() => import("./components/QuizResults"));
const QuizCompleted = lazy(() => import("./components/QuizCompleted"));
const QuizDetails = lazy(() => import("./components/QuizDetails"));
const AdvancedAnalytics = lazy(() => import("./components/AdvancedAnalytics"));
const MultiModalQuizGenerator = lazy(() =>
  import("./components/MultiModalQuizGenerator")
);
const MultiplayerQuiz = lazy(() => import("./components/MultiplayerQuiz"));

// Auth components
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const AuthCallback = lazy(() => import("./components/AuthCallback"));
const VerifyEmail = lazy(() => import("./components/VerifyEmail"));

// User account components
const Profile = lazy(() => import("./components/Profile"));
const Settings = lazy(() => import("./components/Settings"));
const Security = lazy(() => import("./components/Security"));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Layout>
              <Suspense fallback={<FullPageLoader message="Loading..." />}>
                <Routes>
                  {/* Main routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/generate-quiz" element={<QuizGenerator />} />

                  {/* Auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* User account routes */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/security" element={<Security />} />

                  {/* New Feature Routes */}
                  <Route
                    path="/multi-modal"
                    element={<MultiModalQuizGenerator />}
                  />
                  <Route path="/multiplayer" element={<MultiplayerQuiz />} />

                  {/* Quiz related routes */}
                  <Route path="/results" element={<QuizResults />} />
                  <Route path="/quiz-completed" element={<QuizCompleted />} />
                  <Route
                    path="/quiz-details/:quizId"
                    element={<QuizDetails />}
                  />
                  <Route path="/analytics" element={<AdvancedAnalytics />} />

                  {/* Information routes */}
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />

                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.2)",
              },
              success: {
                iconTheme: {
                  primary: "hsl(var(--primary))",
                  secondary: "white",
                },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Modern 404 Component
const NotFound = () => (
  <div className="min-h-[70vh] flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-lg"
    >
      {/* Animated 404 */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <span className="text-[150px] md:text-[200px] font-black gradient-text leading-none">
          404
        </span>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12 text-primary/30" />
        </motion.div>
      </motion.div>

      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Oops! Page Not Found
      </h1>
      <p className="text-muted-foreground text-lg mb-8">
        The page you're looking for seems to have wandered off into the digital
        void. Let's get you back on track!
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          size="lg"
          className="group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Go Back
        </Button>
        <Link to="/">
          <Button
            variant="gradient"
            size="lg"
            shimmer
            className="w-full sm:w-auto"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Decorative elements */}
      <div className="mt-16 flex justify-center gap-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40"
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  </div>
);

export default App;
