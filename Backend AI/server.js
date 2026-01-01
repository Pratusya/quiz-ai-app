// --- Core Dependencies ---
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const http = require("http");
const rateLimit = require("express-rate-limit");
const { upload, processMultiModalContent } = require("./multiModalProcessor");
const {
  initializeMultiplayer,
  getActiveRooms,
  getRoomInfo,
} = require("./multiplayer");

// --- Authentication Module ---
const { initAuthRoutes } = require("./auth/routes");
const authMiddleware = require("./auth/middleware");

dotenv.config();

// Initialize database adapter (works with both PostgreSQL and SQLite)
const dbAdapter = require("./database");
dbAdapter.initDatabase();

// Get dbType dynamically to ensure it's always current
const getDbType = () => dbAdapter.dbType;

// Create a wrapper pool object that works with both PostgreSQL and SQLite
const pool = {
  query: (...args) => dbAdapter.query(...args),
  connect: () => dbAdapter.getClient(),
  end: () => dbAdapter.close(),
};

// --- Custom Error Classes ---
class AppError extends Error {
  constructor(message, statusCode, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database operation failed", code = "DB_ERROR") {
    super(message, 500, code);
  }
}

// --- Validation Schemas ---
const quizSchema = Joi.object({
  title: Joi.string().required().trim().max(255),
  topic: Joi.string().trim().max(255).optional(),
  numQuestions: Joi.number().integer().min(1).required(),
  difficulty: Joi.string().valid("Easy", "Medium", "Hard").required(),
  questionType: Joi.string()
    .valid("MCQ", "True/False", "Fill in the Blanks")
    .required(),
  language: Joi.string()
    .valid(
      "english",
      "hindi",
      "spanish",
      "french",
      "german",
      "chinese",
      "japanese",
      "korean",
      "arabic"
    )
    .default("english"),
  questions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(),
        correctAnswer: Joi.number().integer().min(0).required(),
        explanation: Joi.string().allow("", null).optional(),
        options: Joi.array().items(Joi.string()).min(2).required(),
      })
    )
    .min(1)
    .required(),
}).required();

const quizResultSchema = Joi.object({
  quizId: Joi.number().integer().required(),
  score: Joi.number().integer().min(0).required(),
  totalQuestions: Joi.number().integer().min(1).required(),
  userAnswers: Joi.array()
    .items(
      Joi.object({
        questionIndex: Joi.number().integer().required(),
        answer: Joi.alternatives()
          .try(Joi.string(), Joi.number(), Joi.boolean(), null)
          .required(),
        correct: Joi.boolean().required(),
      })
    )
    .required(),
  timeTaken: Joi.number().integer().min(0).required(),
});

// Update the quiz history schema to match frontend data
const quizHistorySchema = Joi.object({
  quizId: Joi.number().integer().required(),
  promptUsed: Joi.string().required(),
  generationParameters: Joi.object({
    topic: Joi.string().required(),
    difficulty: Joi.string().valid("Easy", "Medium", "Hard").required(),
    numQuestions: Joi.number().integer().min(1).required(),
    questionType: Joi.string()
      .valid("MCQ", "True/False", "Fill in the Blanks")
      .required(),
    language: Joi.string()
      .valid(
        "english",
        "hindi",
        "spanish",
        "french",
        "german",
        "chinese",
        "japanese",
        "korean",
        "arabic"
      )
      .default("english"),
  }).required(),
}).required();

// --- Express Setup ---
const app = express();
const server = http.createServer(app);

// --- Database Setup ---
// Database is initialized at the top with dbAdapter.initDatabase()
// The 'pool' variable is available for all database operations

// --- Middleware ---
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://ai-quizlab.netlify.app",
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "user-id",
    "username",
    "authorization",
    "Authorization",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS before other middleware
app.use(cors(corsOptions));
app.use(express.json());

// --- Authentication Routes ---
// Initialize auth routes with database
const authRouter = initAuthRoutes(dbAdapter.db, getDbType());
app.use("/api/auth", authRouter);

// Add security headers middleware
app.use(authMiddleware.securityHeaders);

// Rate limiting for AI endpoints (10 requests per minute per user)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    status: "error",
    message:
      "Too many requests. Please wait a minute before generating more quizzes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers["user-id"] || req.ip,
});

// --- Auth Middleware ---
const simpleAuth = (req, res, next) => {
  const userId = req.headers["user-id"];
  const username = req.headers["username"];

  if (!userId || !username) {
    return res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
  }

  req.user = { userId, username };
  next();
};

// Optional Auth - allows guest users
const optionalAuth = (req, res, next) => {
  const userId = req.headers["user-id"];
  const username = req.headers["username"];

  if (userId && username) {
    req.user = { userId, username };
  } else {
    // Guest user
    req.user = { userId: "guest", username: "Guest User", isGuest: true };
  }
  next();
};

// --- Database Initialization ---
const initializeTables = async () => {
  // Skip PostgreSQL-specific initialization if using SQLite
  if (getDbType() === "sqlite") {
    console.log(
      "Using SQLite - tables already initialized by database adapter"
    );
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create Quizzes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(255),
        num_questions INTEGER NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        language VARCHAR(20) DEFAULT 'english' CHECK (
          language IN (
            'english', 'hindi', 'spanish', 'french', 
            'german', 'chinese', 'japanese', 'korean', 'arabic'
          )
        ),
        questions JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Quiz Results Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        user_answers JSONB,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        time_taken INTEGER
      );
    `);

    // Add Quiz History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_history (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        prompt_used TEXT NOT NULL,
        generation_parameters JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create User Gamification Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_gamification (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        total_xp INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        total_quizzes_completed INTEGER DEFAULT 0,
        total_perfect_scores INTEGER DEFAULT 0,
        last_quiz_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Badges Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        requirement_type VARCHAR(50) NOT NULL,
        requirement_value INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create User Badges Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id)
      );
    `);

    // Create User Learning Analytics Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_learning_analytics (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        topic VARCHAR(255),
        difficulty VARCHAR(20),
        total_attempts INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        average_score DECIMAL(5,2) DEFAULT 0,
        average_time_per_question DECIMAL(8,2) DEFAULT 0,
        mastery_level DECIMAL(3,2) DEFAULT 0,
        recommended_difficulty VARCHAR(20),
        last_attempt_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, topic, difficulty)
      );
    `);

    // Insert default badges
    await client.query(`
      INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value) 
      VALUES 
        ('First Steps', 'Complete your first quiz', '🌟', 'milestone', 'quizzes_completed', 1),
        ('Quiz Master', 'Complete 10 quizzes', '🏆', 'milestone', 'quizzes_completed', 10),
        ('Perfect Score', 'Get 100% on any quiz', '💯', 'achievement', 'perfect_scores', 1),
        ('Perfectionist', 'Get 5 perfect scores', '👑', 'achievement', 'perfect_scores', 5),
        ('Streak Starter', 'Complete quizzes for 3 days in a row', '🔥', 'streak', 'daily_streak', 3),
        ('Week Warrior', 'Complete quizzes for 7 days in a row', '⚡', 'streak', 'daily_streak', 7),
        ('Level Up', 'Reach level 5', '📈', 'level', 'current_level', 5),
        ('Knowledge Seeker', 'Complete 25 quizzes', '🧠', 'milestone', 'quizzes_completed', 25),
        ('Scholar', 'Complete 50 quizzes', '🎓', 'milestone', 'quizzes_completed', 50),
        ('Einstein', 'Complete 100 quizzes', '🧪', 'milestone', 'quizzes_completed', 100)
      ON CONFLICT (name) DO NOTHING;
    `);

    // Create Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON quiz_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_history_quiz_id ON quiz_history(quiz_id);
      CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_learning_analytics_user_id ON user_learning_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_learning_analytics_topic ON user_learning_analytics(user_id, topic);
    `);

    await client.query("COMMIT");
    console.log("Database tables initialized successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error initializing tables:", error);
    throw new DatabaseError("Failed to initialize database tables");
  } finally {
    client.release();
  }
};

// --- API Routes ---

// Health Check
app.get("/health", async (req, res) => {
  try {
    // Use database-agnostic query
    const query =
      getDbType() === "sqlite"
        ? "SELECT datetime('now') as now"
        : "SELECT NOW()";

    const dbCheck = await pool.query(query);
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        type: getDbType(),
        timestamp: dbCheck.rows[0].now,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      status: "error",
      message: "Service unavailable",
      details: error.message,
    });
  }
});

// --- Contact Form Endpoint ---
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Please provide name, email, and message",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    // Create table if not exists
    const createTableQuery =
      getDbType() === "sqlite"
        ? `CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            is_read INTEGER DEFAULT 0
          )`
        : `CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            is_read BOOLEAN DEFAULT FALSE
          )`;

    await pool.query(createTableQuery);

    // Insert the contact message
    const insertQuery =
      getDbType() === "sqlite"
        ? `INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)`
        : `INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING id`;

    const result = await pool.query(insertQuery, [
      trimmedName,
      trimmedEmail,
      trimmedMessage,
    ]);

    console.log(
      `New contact form submission from: ${trimmedName} (${trimmedEmail})`
    );

    // Send email notifications using emailUtils
    const emailUtils = require("./auth/emailUtils");

    if (emailUtils.isEmailConfigured()) {
      try {
        // Send notification to admin
        await emailUtils.sendContactNotification(
          trimmedName,
          trimmedEmail,
          trimmedMessage
        );

        // Send auto-reply to user
        await emailUtils.sendContactAutoReply(
          trimmedName,
          trimmedEmail,
          trimmedMessage
        );

        console.log("Contact form emails sent successfully");
      } catch (emailError) {
        console.error("Failed to send contact form email:", emailError);
        // Don't fail the request if email fails - message is still saved to DB
      }
    } else {
      console.log(
        "[DEV MODE] Email notification would be sent for contact form"
      );
    }

    res.status(200).json({
      success: true,
      message: "Your message has been received. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      error: "Failed to process your message. Please try again later.",
    });
  }
});

// === QUIZ GENERATION ENDPOINT ===
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

// Initialize AI clients
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Groq client (OpenAI-compatible) - PRIMARY provider
const groqClient = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

// Log which AI providers are available
console.log("AI Providers Status:");
console.log(
  "  - Groq:",
  groqClient ? "✓ Configured" : "✗ Not configured (missing GROQ_API_KEY)"
);
console.log(
  "  - Gemini:",
  genAI ? "✓ Configured" : "✗ Not configured (missing GEMINI_API_KEY)"
);

// Helper function to generate quiz with Groq
async function generateQuizWithGroq(prompt) {
  if (!groqClient) {
    throw new Error("Groq API key not configured");
  }

  console.log("Generating quiz with Groq...");

  const completion = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a quiz generator. Return only valid JSON with no additional text or markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0].message.content.trim();
}

// Helper function to generate quiz with Gemini
async function generateQuizWithGemini(prompt) {
  if (!genAI) {
    throw new Error("Gemini API key not configured");
  }

  console.log("Generating quiz with Gemini...");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

// Generate Quiz - tries Groq first, then Gemini as backup
app.post(
  "/api/generate-quiz",
  aiRateLimiter,
  optionalAuth,
  async (req, res, next) => {
    try {
      const { topic, difficulty, numQuestions, questionType, language } =
        req.body;

      if (!topic || !difficulty || !numQuestions) {
        return res.status(400).json({
          status: "error",
          message: "Topic, difficulty, and number of questions are required",
        });
      }

      // Construct prompt
      const prompt = `Generate a ${difficulty} difficulty quiz about "${topic}" with ${numQuestions} questions.

Question Type: ${questionType || "MCQ"}
Language: ${language || "English"}

Requirements:
1. Each question must have 4 options (A, B, C, D) for MCQ type
2. Mark the correct answer clearly
3. Ensure questions are relevant and educational
4. Return response in valid JSON format

JSON Format:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct option text"
    }
  ]
}

Generate EXACTLY ${numQuestions} questions. Return ONLY the JSON, no additional text.`;

      let responseText;
      let usedProvider = "none";

      // Try Groq first (primary), then Gemini as backup
      if (groqClient) {
        try {
          responseText = await generateQuizWithGroq(prompt);
          usedProvider = "groq";
        } catch (groqError) {
          console.error("Groq error:", groqError.message);
          // Try Gemini as backup
          if (genAI) {
            console.log("Groq failed, trying Gemini...");
            responseText = await generateQuizWithGemini(prompt);
            usedProvider = "gemini";
          } else {
            throw groqError;
          }
        }
      } else if (genAI) {
        // No Groq, try Gemini
        try {
          responseText = await generateQuizWithGemini(prompt);
          usedProvider = "gemini";
        } catch (geminiError) {
          throw geminiError;
        }
      } else {
        // No AI provider configured
        return res.status(503).json({
          status: "error",
          message:
            "No AI service configured. Please add GROQ_API_KEY or GEMINI_API_KEY.",
          errorType: "no_ai_configured",
        });
      }

      // Clean the response - remove markdown code blocks if present
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Parse the JSON response
      const quizData = JSON.parse(responseText);

      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error("Invalid quiz data format");
      }

      console.log(
        `Successfully generated ${quizData.questions.length} questions using ${usedProvider}`
      );

      res.json({
        status: "success",
        quiz: quizData,
        metadata: {
          topic,
          difficulty,
          numQuestions: quizData.questions.length,
          questionType: questionType || "MCQ",
          language: language || "English",
          provider: usedProvider,
        },
      });
    } catch (error) {
      console.error("Quiz generation error:", error);

      // Handle Gemini API-specific errors with user-friendly messages
      if (
        error.status === 429 ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED")
      ) {
        return res.status(503).json({
          status: "error",
          message:
            "AI service is temporarily unavailable. The API quota has been exceeded. Please try again later or contact the administrator.",
          errorType: "quota_exceeded",
          technicalDetails: "Gemini API quota exceeded",
        });
      }

      if (
        error.status === 401 ||
        error.message?.includes("API_KEY_INVALID") ||
        error.message?.includes("authentication")
      ) {
        return res.status(503).json({
          status: "error",
          message:
            "AI service authentication failed. Please check your API key configuration.",
          errorType: "auth_failed",
        });
      }

      res.status(500).json({
        status: "error",
        message: error.message || "Failed to generate quiz",
        errorType: "generation_failed",
      });
    }
  }
);

// Create Quiz
app.post("/api/quizzes", simpleAuth, async (req, res, next) => {
  try {
    console.log("Quiz creation request:", {
      userId: req.user.userId,
      body: req.body,
    });

    // Add language to the request body if not provided
    if (!req.body.language) {
      req.body.language = "english";
    }

    const { error, value } = quizSchema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false,
    });

    if (error) {
      console.log("Validation error:", error.details);
      throw new ValidationError(error.details.map((d) => d.message).join(", "));
    }

    // Validate questions array
    if (!Array.isArray(value.questions) || value.questions.length === 0) {
      throw new ValidationError(
        "Questions array is required and must not be empty"
      );
    }

    // Validate that numQuestions matches actual questions length
    if (value.numQuestions !== value.questions.length) {
      throw new ValidationError(
        `numQuestions (${value.numQuestions}) does not match actual number of questions (${value.questions.length})`
      );
    }

    // Additional validation for question options
    value.questions.forEach((q, idx) => {
      if (
        value.questionType === "MCQ" &&
        (!Array.isArray(q.options) || q.options.length < 2)
      ) {
        throw new ValidationError(
          `Question ${idx + 1} must have at least 2 options for MCQ type`
        );
      }
    });

    const result = await pool.query(
      `INSERT INTO quizzes (
        user_id, title, topic, num_questions, difficulty, 
        question_type, questions, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, topic, num_questions, difficulty, question_type, language`,
      [
        req.user.userId,
        value.title,
        value.topic,
        value.numQuestions,
        value.difficulty,
        value.questionType,
        JSON.stringify(value.questions),
        value.language || "english",
      ]
    );

    const createdQuiz = result.rows[0];
    console.log("Quiz created successfully:", createdQuiz.id);

    res.status(201).json({
      status: "success",
      message: "Quiz created successfully",
      quiz: {
        id: createdQuiz.id,
        title: createdQuiz.title,
        topic: createdQuiz.topic,
        numQuestions: createdQuiz.num_questions,
        difficulty: createdQuiz.difficulty,
        questionType: createdQuiz.question_type,
        language: createdQuiz.language,
      },
    });
  } catch (error) {
    console.error("Quiz creation error:", {
      message: error.message,
      stack: error.stack,
      validation:
        error instanceof ValidationError ? "validation error" : "other error",
    });

    if (error instanceof ValidationError) {
      return res.status(400).json({
        status: "error",
        type: "validation",
        message: error.message,
      });
    }
    next(error);
  }
});

// Get User's Quizzes
app.get("/api/quizzes", simpleAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        q.id, q.title, q.topic, q.num_questions, 
        q.difficulty, q.question_type, q.created_at,
        COUNT(qr.id) as attempts_count,
        MAX(qr.score) as highest_score
      FROM quizzes q
      LEFT JOIN quiz_results qr ON q.id = qr.quiz_id AND qr.user_id = q.user_id
      WHERE q.user_id = $1 
      GROUP BY q.id
      ORDER BY q.created_at DESC 
      LIMIT $2 OFFSET $3`;

    const [quizzes, countResult] = await Promise.all([
      pool.query(query, [req.user.userId, limit, offset]),
      pool.query("SELECT COUNT(*) FROM quizzes WHERE user_id = $1", [
        req.user.userId,
      ]),
    ]);

    const totalQuizzes = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalQuizzes / limit);

    res.json({
      status: "success",
      quizzes: quizzes.rows.map((quiz) => ({
        ...quiz,
        attempts_count: parseInt(quiz.attempts_count || 0),
        highest_score: parseInt(quiz.highest_score || 0),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalQuizzes,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get Quiz for Taking
app.get("/api/quizzes/:id/take", simpleAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, topic, num_questions, difficulty, question_type, questions
       FROM quizzes WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError("Quiz not found");
    }

    const quiz = result.rows[0];

    // Parse questions if stored as JSON string
    let questions = quiz.questions;
    if (typeof questions === "string") {
      try {
        questions = JSON.parse(questions);
      } catch (e) {
        questions = [];
      }
    }

    // Format questions for taking (hide correct answers)
    const formattedQuestions = (questions || []).map((q) => ({
      question: q.question,
      options: q.options || [],
    }));

    res.json({
      id: quiz.id,
      title: quiz.title,
      topic: quiz.topic,
      num_questions: quiz.num_questions,
      difficulty: quiz.difficulty,
      question_type: quiz.question_type,
      questions: formattedQuestions,
    });
  } catch (error) {
    next(error);
  }
});

// Submit Quiz Result
app.post("/api/quiz-results", simpleAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    console.log("Received quiz results:", req.body);

    const { error, value } = quizResultSchema.validate(req.body);
    if (error) {
      console.log("Validation error:", error.details);
      throw new ValidationError(error.details[0].message);
    }

    // Verify quiz exists
    const quizCheck = await client.query(
      "SELECT id FROM quizzes WHERE id = $1",
      [value.quizId]
    );

    if (quizCheck.rows.length === 0) {
      throw new ValidationError("Invalid quiz ID");
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO quiz_results (
        user_id, quiz_id, score, total_questions, 
        user_answers, time_taken
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        req.user.userId,
        value.quizId,
        value.score,
        value.totalQuestions,
        JSON.stringify(value.userAnswers),
        value.timeTaken,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Quiz result saved successfully",
      result: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Quiz result error:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        status: "error",
        type: "validation",
        message: error.message,
      });
    }
    next(error);
  } finally {
    client.release();
  }
});

// Update the quiz history endpoint
app.post("/api/quiz-history", simpleAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Log incoming request for debugging
    console.log("Quiz history request:", {
      userId: req.user.userId,
      body: req.body,
    });

    const { error, value } = quizHistorySchema.validate(req.body);
    if (error) {
      console.log("Validation error:", error.details);
      throw new ValidationError(error.details[0].message);
    }

    // Verify quiz exists
    const quizCheck = await client.query(
      "SELECT id FROM quizzes WHERE id = $1",
      [value.quizId]
    );

    if (quizCheck.rows.length === 0) {
      throw new ValidationError("Invalid quiz ID");
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO quiz_history (
        user_id, quiz_id, prompt_used, generation_parameters
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        req.user.userId,
        value.quizId,
        value.promptUsed,
        JSON.stringify(value.generationParameters),
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      message: "Quiz history saved successfully",
      history: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Quiz history error:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        status: "error",
        type: "validation",
        message: error.message,
      });
    }
    next(error);
  } finally {
    client.release();
  }
});

// Add these utility functions at the top of the file
const processQuizStatistics = (rows) => {
  const topics = new Set();
  const difficulties = new Set();

  rows.forEach((quiz) => {
    if (quiz.topic) topics.add(quiz.topic);
    if (quiz.difficulty) difficulties.add(quiz.difficulty);
  });

  return {
    topics_attempted: Array.from(topics).join(", ") || "None",
    difficulty_levels_attempted: Array.from(difficulties).join(", ") || "None",
  };
};

// Update the statistics endpoint
app.get("/api/statistics", simpleAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    // SQLite-compatible queries
    const dateFormatFunc =
      getDbType() === "sqlite"
        ? "strftime('%Y-%m', completed_at)"
        : "TO_CHAR(completed_at, 'YYYY-MM')";

    // Get overall statistics
    const [quizResults, quizzes, monthlyStats] = await Promise.all([
      client.query(
        `
        SELECT 
          COUNT(DISTINCT quiz_id) as total_quizzes_taken,
          COUNT(*) as total_attempts,
          COALESCE(AVG(CASE WHEN total_questions > 0 
            THEN (CAST(score AS REAL) / total_questions * 100) 
            ELSE 0 END), 0) as average_score,
          COALESCE(MAX(score), 0) as highest_score,
          MIN(completed_at) as first_attempt,
          MAX(completed_at) as last_attempt
        FROM quiz_results 
        WHERE user_id = $1
      `,
        [req.user.userId]
      ),

      // Get all unique quizzes for topic and difficulty tracking
      client.query(
        `
        SELECT DISTINCT topic, difficulty 
        FROM quizzes 
        WHERE user_id = $1 
        AND id IN (SELECT quiz_id FROM quiz_results WHERE user_id = $1)
      `,
        [req.user.userId]
      ),

      // Get monthly progress - SQLite compatible
      client.query(
        getDbType() === "sqlite"
          ? `
            SELECT 
              strftime('%Y-%m', completed_at) as month,
              COUNT(*) as attempts,
              AVG(CASE WHEN total_questions > 0 
                THEN (CAST(score AS REAL) / total_questions * 100) 
                ELSE 0 END) as average_score
            FROM quiz_results
            WHERE user_id = $1
            GROUP BY strftime('%Y-%m', completed_at)
            ORDER BY month DESC
            LIMIT 12
          `
          : `
            SELECT 
              TO_CHAR(completed_at, 'YYYY-MM') as month,
              COUNT(*) as attempts,
              AVG(CASE WHEN total_questions > 0 
                THEN (CAST(score AS REAL) / total_questions * 100) 
                ELSE 0 END) as average_score
            FROM quiz_results
            WHERE user_id = $1
            GROUP BY TO_CHAR(completed_at, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT 12
          `,
        [req.user.userId]
      ),
    ]);

    // Process quiz statistics
    const { topics_attempted, difficulty_levels_attempted } =
      processQuizStatistics(quizzes.rows);

    // Format the response
    const statistics = {
      overall: {
        total_quizzes_taken: parseInt(
          quizResults.rows[0]?.total_quizzes_taken || 0
        ),
        total_attempts: parseInt(quizResults.rows[0]?.total_attempts || 0),
        average_score: parseFloat(
          quizResults.rows[0]?.average_score || 0
        ).toFixed(2),
        highest_score: parseInt(quizResults.rows[0]?.highest_score || 0),
        first_attempt: quizResults.rows[0]?.first_attempt || null,
        last_attempt: quizResults.rows[0]?.last_attempt || null,
        topics_attempted,
        difficulty_levels_attempted,
      },
      monthly_progress: monthlyStats.rows.map((stat) => ({
        month: stat.month,
        attempts: parseInt(stat.attempts),
        average_score: parseFloat(stat.average_score).toFixed(2),
      })),
    };

    res.json({
      status: "success",
      statistics,
    });
  } catch (error) {
    console.error("Statistics error:", error);
    next(error);
  } finally {
    client.release();
  }
});

// Update the quiz details endpoint
app.get("/api/quizzes/:id", simpleAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    // SQLite-compatible query - split into separate queries
    // First, get the quiz details
    const quizResult = await client.query(
      `SELECT 
        id, title, topic, num_questions, difficulty, 
        question_type, language, questions, created_at
      FROM quizzes 
      WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Quiz not found",
      });
    }

    const quiz = quizResult.rows[0];

    // Get attempt statistics
    const statsResult = await client.query(
      `SELECT 
        COUNT(*) as total_attempts,
        MAX(score) as highest_score,
        AVG(CAST(score AS REAL)) as avg_score
      FROM quiz_results
      WHERE quiz_id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    // Get attempt history separately
    const historyResult = await client.query(
      `SELECT 
        id, score, total_questions, time_taken, 
        completed_at, user_answers
      FROM quiz_results
      WHERE quiz_id = $1 AND user_id = $2
      ORDER BY completed_at DESC`,
      [req.params.id, req.user.userId]
    );

    const stats = statsResult.rows[0] || {
      total_attempts: 0,
      highest_score: 0,
      avg_score: 0,
    };

    // Parse questions if stored as JSON string
    let questions = quiz.questions;
    if (typeof questions === "string") {
      try {
        questions = JSON.parse(questions);
      } catch (e) {
        questions = [];
      }
    }

    // Format attempt history
    const attemptHistory = historyResult.rows.map((attempt) => {
      let userAnswers = attempt.user_answers;
      if (typeof userAnswers === "string") {
        try {
          userAnswers = JSON.parse(userAnswers);
        } catch (e) {
          userAnswers = [];
        }
      }
      return {
        id: attempt.id,
        score: parseInt(attempt.score),
        total_questions: parseInt(attempt.total_questions),
        time_taken: parseInt(attempt.time_taken || 0),
        completed_at: attempt.completed_at,
        user_answers: userAnswers,
        attempt_date: attempt.completed_at,
      };
    });

    // Format response with status field to match frontend expectations
    const response = {
      status: "success",
      quiz: {
        id: quiz.id,
        topic: quiz.topic,
        title: quiz.title,
        difficulty: quiz.difficulty,
        question_type: quiz.question_type,
        num_questions: quiz.num_questions,
        created_at: quiz.created_at,
        highest_score: parseInt(stats.highest_score || 0),
        attempts_count: parseInt(stats.total_attempts || 0),
        questions: (questions || []).map((q, index) => ({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "No explanation provided",
        })),
        attempt_history: attemptHistory,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Quiz details error:", {
      error,
      quizId: req.params.id,
      userId: req.user.userId,
    });
    next(error);
  } finally {
    client.release();
  }
});

// === GAMIFICATION API ENDPOINTS ===

// Get user gamification data
app.get("/api/gamification", optionalAuth, async (req, res, next) => {
  // Return early for guest users
  if (req.user.isGuest) {
    return res.json({
      status: "success",
      data: null,
    });
  }

  const client = await pool.connect();
  try {
    // Get or create user gamification record
    let result = await client.query(
      "SELECT * FROM user_gamification WHERE user_id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      // Create new gamification record
      await client.query(
        `INSERT INTO user_gamification (user_id) VALUES ($1)`,
        [req.user.userId]
      );

      result = await client.query(
        "SELECT * FROM user_gamification WHERE user_id = $1",
        [req.user.userId]
      );
    }

    // Get user badges
    const badgeResult = await client.query(
      `SELECT b.*, ub.earned_at 
       FROM badges b 
       JOIN user_badges ub ON b.id = ub.badge_id 
       WHERE ub.user_id = $1 
       ORDER BY ub.earned_at DESC`,
      [req.user.userId]
    );

    const gamificationData = result.rows[0];
    const userBadges = badgeResult.rows;

    res.json({
      status: "success",
      data: {
        ...gamificationData,
        badges: userBadges,
        next_level_xp: gamificationData.current_level * 1000, // 1000 XP per level
        progress_to_next_level:
          ((gamificationData.total_xp % 1000) / 1000) * 100,
      },
    });
  } catch (error) {
    console.error("Gamification error:", error);
    next(error);
  } finally {
    client.release();
  }
});

// Award XP and check for new badges/level ups
app.post("/api/gamification/award-xp", optionalAuth, async (req, res, next) => {
  // Skip for guest users
  if (req.user.isGuest) {
    return res.json({
      status: "success",
      message: "Sign in to earn XP and badges",
      data: null,
    });
  }

  const client = await pool.connect();
  try {
    const { xp_earned, quiz_score, perfect_score } = req.body;

    await client.query("BEGIN");

    // Check if user exists in gamification table
    const existingUser = await client.query(
      "SELECT * FROM user_gamification WHERE user_id = $1",
      [req.user.userId]
    );

    let userData;

    if (existingUser.rows.length > 0) {
      // Update existing record - use database-specific date functions
      await client.query(
        getDbType() === "sqlite"
          ? `UPDATE user_gamification 
             SET total_xp = total_xp + $1,
                 total_quizzes_completed = total_quizzes_completed + 1,
                 total_perfect_scores = total_perfect_scores + $2,
                 current_level = CAST((total_xp + $1) / 1000 AS INTEGER) + 1,
                 last_activity_date = date('now'),
                 updated_at = datetime('now')
             WHERE user_id = $3`
          : `UPDATE user_gamification 
             SET total_xp = total_xp + $1,
                 total_quizzes_completed = total_quizzes_completed + 1,
                 total_perfect_scores = total_perfect_scores + $2,
                 current_level = CAST((total_xp + $1) / 1000 AS INTEGER) + 1,
                 last_activity_date = CURRENT_DATE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3`,
        [xp_earned, perfect_score ? 1 : 0, req.user.userId]
      );

      // Fetch updated data
      const updatedResult = await client.query(
        "SELECT * FROM user_gamification WHERE user_id = $1",
        [req.user.userId]
      );
      userData = updatedResult.rows[0];
    } else {
      // Create new record - use database-specific date functions
      await client.query(
        getDbType() === "sqlite"
          ? `INSERT INTO user_gamification 
             (user_id, total_xp, total_quizzes_completed, total_perfect_scores, current_level, last_activity_date) 
             VALUES ($1, $2, 1, $3, CAST($2 / 1000 AS INTEGER) + 1, date('now'))`
          : `INSERT INTO user_gamification 
             (user_id, total_xp, total_quizzes_completed, total_perfect_scores, current_level, last_activity_date) 
             VALUES ($1, $2, 1, $3, CAST($2 / 1000 AS INTEGER) + 1, CURRENT_DATE)`,
        [req.user.userId, xp_earned, perfect_score ? 1 : 0]
      );

      // Fetch newly created data
      const newResult = await client.query(
        "SELECT * FROM user_gamification WHERE user_id = $1",
        [req.user.userId]
      );
      userData = newResult.rows[0];
    }

    // Check for new badges
    const newBadges = await checkAndAwardBadges(client, req.user.userId);

    await client.query("COMMIT");

    res.json({
      status: "success",
      data: {
        xp_earned,
        new_badges: newBadges,
        total_xp: userData?.total_xp || xp_earned,
        current_level: userData?.current_level || 1,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    console.error("Award XP error:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      status: "error",
      message: "Failed to award XP",
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// === ADAPTIVE LEARNING API ENDPOINTS ===

// Get recommended difficulty for user and topic
app.get(
  "/api/adaptive-learning/recommendation",
  simpleAuth,
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { topic } = req.query;

      if (!topic) {
        return res.status(400).json({
          status: "error",
          message: "Topic parameter is required",
        });
      }

      // Get user's performance for this topic
      const result = await client.query(
        `SELECT difficulty, average_score, total_attempts, mastery_level
       FROM user_learning_analytics
       WHERE user_id = $1 AND topic = $2
       ORDER BY last_attempt_date DESC`,
        [req.user.userId, topic]
      );

      let recommendedDifficulty = "Easy"; // Default for new topics
      let reasoning = "Starting with Easy difficulty for new topic";

      if (result.rows.length > 0) {
        const analytics = result.rows;

        // Calculate overall performance for topic
        const totalAttempts = analytics.reduce(
          (sum, row) => sum + row.total_attempts,
          0
        );
        const weightedScore =
          analytics.reduce(
            (sum, row) => sum + row.average_score * row.total_attempts,
            0
          ) / totalAttempts;

        // Adaptive algorithm
        if (weightedScore >= 85 && totalAttempts >= 3) {
          const currentHighestDifficulty = analytics.find(
            (a) => a.difficulty === "Hard"
          )
            ? "Hard"
            : analytics.find((a) => a.difficulty === "Medium")
            ? "Medium"
            : "Easy";

          if (currentHighestDifficulty === "Easy") {
            recommendedDifficulty = "Medium";
            reasoning = "Excellent performance on Easy - ready for Medium";
          } else if (currentHighestDifficulty === "Medium") {
            recommendedDifficulty = "Hard";
            reasoning = "Excellent performance on Medium - ready for Hard";
          } else {
            recommendedDifficulty = "Hard";
            reasoning = "Maintaining Hard difficulty due to strong performance";
          }
        } else if (weightedScore >= 70) {
          recommendedDifficulty = analytics[0].difficulty; // Stay at current level
          reasoning = "Maintaining current difficulty level";
        } else if (weightedScore < 60) {
          const currentDifficulty = analytics[0].difficulty;
          if (currentDifficulty === "Hard") {
            recommendedDifficulty = "Medium";
            reasoning = "Stepping down to Medium difficulty";
          } else if (currentDifficulty === "Medium") {
            recommendedDifficulty = "Easy";
            reasoning = "Stepping down to Easy difficulty";
          } else {
            recommendedDifficulty = "Easy";
            reasoning = "Continuing with Easy difficulty for improvement";
          }
        }
      }

      res.json({
        status: "success",
        data: {
          topic,
          recommended_difficulty: recommendedDifficulty,
          reasoning,
          performance_data: result.rows,
        },
      });
    } catch (error) {
      console.error("Adaptive learning error:", error);
      next(error);
    } finally {
      client.release();
    }
  }
);

// Update learning analytics after quiz completion
app.post(
  "/api/adaptive-learning/update",
  simpleAuth,
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { topic, difficulty, score, total_questions, time_taken } =
        req.body;

      const accuracy = (score / total_questions) * 100;
      const timePerQuestion = time_taken / total_questions;

      // SQLite compatible UPSERT
      await client.query(
        getDbType() === "sqlite"
          ? `INSERT INTO user_learning_analytics 
             (user_id, topic, difficulty, total_attempts, average_score, mastery_level, last_attempt_date)
             VALUES ($1, $2, $3, 1, $4, $4, datetime('now'))
             ON CONFLICT (user_id, topic, difficulty) 
             DO UPDATE SET
               total_attempts = user_learning_analytics.total_attempts + 1,
               average_score = ((user_learning_analytics.average_score * user_learning_analytics.total_attempts) + $4) / (user_learning_analytics.total_attempts + 1),
               mastery_level = MIN(((user_learning_analytics.average_score * user_learning_analytics.total_attempts + $4) / (user_learning_analytics.total_attempts + 1)), 100),
               last_attempt_date = datetime('now'),
               updated_at = datetime('now')`
          : `INSERT INTO user_learning_analytics 
             (user_id, topic, difficulty, total_attempts, average_score, mastery_level, last_attempt_date)
             VALUES ($1, $2, $3, 1, $4, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, topic, difficulty) 
             DO UPDATE SET
               total_attempts = user_learning_analytics.total_attempts + 1,
               average_score = ((user_learning_analytics.average_score * user_learning_analytics.total_attempts) + $4) / (user_learning_analytics.total_attempts + 1),
               mastery_level = LEAST(((user_learning_analytics.average_score * user_learning_analytics.total_attempts + $4) / (user_learning_analytics.total_attempts + 1)), 100.0),
               last_attempt_date = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP`,
        [req.user.userId, topic, difficulty, accuracy]
      );

      res.json({
        status: "success",
        message: "Learning analytics updated",
      });
    } catch (error) {
      console.error("Update learning analytics error:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        status: "error",
        message: "Failed to update learning analytics",
        details: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// === ADVANCED ANALYTICS API ENDPOINTS ===

// Get comprehensive learning analytics
app.get("/api/analytics/comprehensive", simpleAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Get topic mastery data
    const topicMastery = await client.query(
      `SELECT topic, difficulty, average_score, total_attempts, mastery_level
       FROM user_learning_analytics
       WHERE user_id = $1
       ORDER BY mastery_level DESC`,
      [req.user.userId]
    );

    // Get performance trends (last 30 days) - SQLite compatible
    const performanceTrends = await client.query(
      getDbType() === "sqlite"
        ? `SELECT DATE(completed_at) as date, 
                AVG(CAST(score AS FLOAT) / total_questions * 100) as average_score,
                COUNT(*) as quiz_count
         FROM quiz_results
         WHERE user_id = $1 AND completed_at >= datetime('now', '-30 days')
         GROUP BY DATE(completed_at)
         ORDER BY date`
        : `SELECT DATE(completed_at) as date, 
                AVG(CAST(score AS FLOAT) / total_questions * 100) as average_score,
                COUNT(*) as quiz_count
         FROM quiz_results
         WHERE user_id = $1 AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY DATE(completed_at)
         ORDER BY date`,
      [req.user.userId]
    );

    // Get difficulty distribution
    const difficultyStats = await client.query(
      `SELECT q.difficulty, 
              COUNT(*) as attempts,
              AVG(CAST(qr.score AS FLOAT) / qr.total_questions * 100) as average_score
       FROM quiz_results qr
       JOIN quizzes q ON qr.quiz_id = q.id
       WHERE qr.user_id = $1
       GROUP BY q.difficulty`,
      [req.user.userId]
    );

    // Get time analysis
    const timeAnalysis = await client.query(
      `SELECT q.difficulty,
              AVG(CAST(qr.time_taken AS REAL) / qr.total_questions) as avg_time_per_question
       FROM quiz_results qr
       JOIN quizzes q ON qr.quiz_id = q.id
       WHERE qr.user_id = $1 AND qr.time_taken IS NOT NULL
       GROUP BY q.difficulty`,
      [req.user.userId]
    );

    res.json({
      status: "success",
      analytics: {
        topic_mastery: topicMastery.rows,
        performance_trends: performanceTrends.rows,
        difficulty_stats: difficultyStats.rows,
        time_analysis: timeAnalysis.rows,
      },
    });
  } catch (error) {
    console.error("Comprehensive analytics error:", error);
    next(error);
  } finally {
    client.release();
  }
});

// === AI TUTOR API ENDPOINTS ===
// Gemini AI client already initialized above

// Get detailed explanation for a question
app.post("/api/ai-tutor/explain", simpleAuth, async (req, res, next) => {
  try {
    const { question, userAnswer, correctAnswer, topic } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({
        status: "error",
        message: "Question and correct answer are required",
      });
    }

    const prompt = `You are an expert tutor. A student just answered a quiz question.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer || "No answer provided"}
Topic: ${topic || "General"}

Please provide:
1. A clear explanation of why the correct answer is right
2. If the student answered incorrectly, explain why their answer was wrong
3. Additional context or examples to help them understand the concept better
4. A tip to remember this for future

Keep the explanation concise, friendly, and educational.`;

    // Use Gemini to generate explanation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    res.json({
      status: "success",
      explanation,
    });
  } catch (error) {
    console.error("AI Tutor explanation error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate explanation",
    });
  }
});

// Chat with AI Tutor for follow-up questions
app.post("/api/ai-tutor/chat", simpleAuth, async (req, res, next) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        status: "error",
        message: "Messages array is required",
      });
    }

    const systemPrompt = `You are an expert AI tutor helping a student understand quiz topics better. 

Context:
${context?.question ? `Question: ${context.question}` : ""}
${context?.topic ? `Topic: ${context.topic}` : ""}

Your role is to:
- Answer follow-up questions clearly and concisely
- Provide examples when helpful
- Encourage curiosity and learning
- Break down complex concepts into simpler parts
- Suggest related topics they might want to explore

Keep responses brief (2-3 paragraphs max) unless the student asks for more detail.`;

    // Build conversation for Gemini
    const conversationText = messages
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n\n");

    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationText}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    res.json({
      status: "success",
      response: aiResponse,
    });
  } catch (error) {
    console.error("AI Tutor chat error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get response from AI tutor",
    });
  }
});

// Get concept explanation for a specific topic
app.post("/api/ai-tutor/concept", simpleAuth, async (req, res, next) => {
  try {
    const { concept, difficulty } = req.body;

    if (!concept) {
      return res.status(400).json({
        status: "error",
        message: "Concept is required",
      });
    }

    const prompt = `Explain the concept of "${concept}" in a way that's suitable for a ${
      difficulty || "intermediate"
    } level learner. 

Include:
1. A clear definition
2. Why it's important
3. A real-world example or analogy
4. Common misconceptions (if any)
5. Related concepts to explore

Format the response in a clear, structured way.`;

    // Use Gemini to explain concept
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    res.json({
      status: "success",
      explanation,
    });
  } catch (error) {
    console.error("AI Tutor concept error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to explain concept",
    });
  }
});

// === MULTIPLAYER API ENDPOINTS ===

// Get list of active multiplayer rooms
app.get("/api/multiplayer/rooms", (req, res) => {
  try {
    const rooms = getActiveRooms();
    res.json({
      status: "success",
      rooms,
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch rooms",
    });
  }
});

// Get specific room info
app.get("/api/multiplayer/rooms/:roomCode", (req, res) => {
  try {
    const room = getRoomInfo(req.params.roomCode);
    if (!room) {
      return res.status(404).json({
        status: "error",
        message: "Room not found",
      });
    }
    res.json({
      status: "success",
      room,
    });
  } catch (error) {
    console.error("Get room info error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch room info",
    });
  }
});

// === MULTI-MODAL QUIZ GENERATION API ENDPOINTS ===

// Generate quiz from uploaded file (PDF, Image, Audio)
app.post(
  "/api/generate-from-content",
  simpleAuth,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { contentType } = req.body;
      const file = req.file;

      if (!file && contentType !== "video") {
        return res.status(400).json({
          status: "error",
          message: "File is required",
        });
      }

      const options = {
        numQuestions: parseInt(req.body.numQuestions) || 5,
        difficulty: req.body.difficulty || "Medium",
        questionType: req.body.questionType || "MCQ",
        topic: req.body.topic || "General",
        language: req.body.language || "english",
      };

      console.log("Processing multi-modal content:", { contentType, options });

      const result = await processMultiModalContent(file, contentType, options);

      // Save quiz to database
      const quizTitle = `${contentType.toUpperCase()} Quiz - ${new Date().toLocaleDateString()}`;

      let quizId;
      if (getDbType() === "sqlite") {
        const insertQuery = `INSERT INTO quizzes (
            user_id, title, topic, num_questions, difficulty, 
            question_type, questions, language
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertResult = await pool.query(insertQuery, [
          req.user.userId,
          quizTitle,
          options.topic,
          result.questions.length,
          options.difficulty,
          options.questionType,
          JSON.stringify(result.questions),
          options.language,
        ]);
        // SQLite returns insertId from the query adapter
        quizId = insertResult.insertId;
        console.log("Quiz saved to SQLite, quizId:", quizId);
      } else {
        const dbResult = await pool.query(
          `INSERT INTO quizzes (
            user_id, title, topic, num_questions, difficulty, 
            question_type, questions, language
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
          [
            req.user.userId,
            quizTitle,
            options.topic,
            result.questions.length,
            options.difficulty,
            options.questionType,
            JSON.stringify(result.questions),
            options.language,
          ]
        );
        quizId = dbResult.rows[0].id;
      }

      res.json({
        status: "success",
        message: "Quiz generated successfully from content",
        quizId: quizId,
        questions: result.questions,
        extractedTextLength: result.extractedTextLength,
        contentType: result.contentType,
      });
    } catch (error) {
      console.error("Multi-modal generation error:", error);
      res.status(500).json({
        status: "error",
        message: error.message || "Failed to generate quiz from content",
      });
    }
  }
);

// Generate quiz from YouTube video
app.post("/api/generate-from-youtube", simpleAuth, async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        status: "error",
        message: "YouTube URL is required",
      });
    }

    const options = {
      url,
      numQuestions: parseInt(req.body.numQuestions) || 5,
      difficulty: req.body.difficulty || "Medium",
      questionType: req.body.questionType || "MCQ",
      topic: req.body.topic || "Video Content",
      language: req.body.language || "english",
    };

    console.log("Processing YouTube video:", { url, options });

    const result = await processMultiModalContent(null, "video", options);

    // Save quiz to database
    const quizTitle = `YouTube Quiz - ${new Date().toLocaleDateString()}`;

    let quizId;
    if (getDbType() === "sqlite") {
      const insertQuery = `INSERT INTO quizzes (
          user_id, title, topic, num_questions, difficulty, 
          question_type, questions, language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      const insertResult = await pool.query(insertQuery, [
        req.user.userId,
        quizTitle,
        options.topic,
        result.questions.length,
        options.difficulty,
        options.questionType,
        JSON.stringify(result.questions),
        options.language,
      ]);
      // SQLite returns insertId from the query adapter
      quizId = insertResult.insertId;
      console.log("YouTube Quiz saved to SQLite, quizId:", quizId);
    } else {
      const dbResult = await pool.query(
        `INSERT INTO quizzes (
          user_id, title, topic, num_questions, difficulty, 
          question_type, questions, language
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          req.user.userId,
          quizTitle,
          options.topic,
          result.questions.length,
          options.difficulty,
          options.questionType,
          JSON.stringify(result.questions),
          options.language,
        ]
      );
      quizId = dbResult.rows[0].id;
    }

    res.json({
      status: "success",
      message: "Quiz generated successfully from video",
      quizId: quizId,
      questions: result.questions,
      extractedTextLength: result.extractedTextLength,
    });
  } catch (error) {
    console.error("YouTube quiz generation error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to generate quiz from video",
    });
  }
});

// Helper function to check and award badges
async function checkAndAwardBadges(client, userId) {
  const newBadges = [];

  // Get current user stats
  const userStats = await client.query(
    "SELECT * FROM user_gamification WHERE user_id = $1",
    [userId]
  );

  if (userStats.rows.length === 0) return newBadges;

  const stats = userStats.rows[0];

  // Get available badges that user doesn't have
  const availableBadges = await client.query(
    `SELECT b.* FROM badges b
     WHERE b.id NOT IN (
       SELECT badge_id FROM user_badges WHERE user_id = $1
     )`,
    [userId]
  );

  for (const badge of availableBadges.rows) {
    let shouldAward = false;

    switch (badge.requirement_type) {
      case "quizzes_completed":
        shouldAward = stats.total_quizzes_completed >= badge.requirement_value;
        break;
      case "perfect_scores":
        shouldAward = stats.total_perfect_scores >= badge.requirement_value;
        break;
      case "daily_streak":
        shouldAward = stats.current_streak >= badge.requirement_value;
        break;
      case "current_level":
        shouldAward = stats.current_level >= badge.requirement_value;
        break;
    }

    if (shouldAward) {
      await client.query(
        "INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)",
        [userId, badge.id]
      );
      newBadges.push(badge);
    }
  }

  return newBadges;
}

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// --- Server Startup ---
const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const tester = require("net")
      .createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`Port ${port} is busy. Please try another port.`);
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once("listening", () => {
        tester.close();
        resolve(true);
      })
      .listen(port);
  });
};

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;

    // Check if port is available
    const portAvailable = await checkPort(PORT);
    if (!portAvailable) {
      throw new Error(`Port ${PORT} is in use. Please use a different port.`);
    }

    console.log("Attempting to connect to database...");
    // Test database connection using adapter
    await dbAdapter.query("SELECT 1");
    console.log("Database connection successful.");

    console.log("Initializing database tables...");
    await initializeTables();
    console.log("Database initialization complete.");

    // Initialize multiplayer WebSocket server
    console.log("Initializing multiplayer WebSocket server...");
    initializeMultiplayer(server);
    console.log("Multiplayer WebSocket server initialized.");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CORS enabled for: ${corsOptions.origin.join(", ")}`);
      console.log(`WebSocket server ready for multiplayer connections`);
    });
  } catch (error) {
    console.error("----------------------------------------");
    console.error(">>> FATAL: Failed to start server <<<");
    console.error(
      error instanceof DatabaseError ? error : new DatabaseError(error.message)
    );
    console.error("----------------------------------------");
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, pool, server, startServer };
