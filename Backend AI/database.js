/**
 * Database Adapter - Works with both PostgreSQL and SQLite
 * Automatically detects which database to use based on configuration
 */

const Database = require("better-sqlite3");
const { Pool } = require("pg");
const path = require("path");

let db;
let dbType;

// Initialize database connection
function initDatabase() {
  const usePostgres =
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.startsWith("postgresql://");

  if (usePostgres) {
    console.log("📊 Using PostgreSQL database...");
    dbType = "postgres";
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
    });
  } else {
    console.log("📊 Using SQLite database...");
    dbType = "sqlite";
    const dbPath = path.join(__dirname, "quiz-ai.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    console.log(`📁 Database file: ${dbPath}`);

    // Create tables for SQLite
    createSQLiteTables();
  }

  return { db, dbType };
}

// Create SQLite tables
function createSQLiteTables() {
  const tables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clerk_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      total_points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      badges TEXT DEFAULT '[]',
      achievements TEXT DEFAULT '[]',
      streak_days INTEGER DEFAULT 0,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Quizzes table (compatible with server.js expectations)
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      num_questions INTEGER NOT NULL,
      question_type TEXT DEFAULT 'MCQ',
      language TEXT DEFAULT 'english',
      questions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Quiz results table (compatible with server.js expectations)
    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      quiz_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      user_answers TEXT,
      time_taken INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    -- Quiz history table
    CREATE TABLE IF NOT EXISTS quiz_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      quiz_id INTEGER,
      prompt_used TEXT NOT NULL,
      generation_parameters TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    -- Content uploads table
    CREATE TABLE IF NOT EXISTS content_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      file_path TEXT,
      content_url TEXT,
      extracted_text TEXT,
      quiz_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL
    );

    -- Multiplayer rooms table
    CREATE TABLE IF NOT EXISTS multiplayer_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT UNIQUE NOT NULL,
      host_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      num_questions INTEGER NOT NULL,
      max_players INTEGER DEFAULT 10,
      status TEXT DEFAULT 'waiting',
      questions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      ended_at DATETIME
    );

    -- Multiplayer participants table
    CREATE TABLE IF NOT EXISTS multiplayer_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      answers TEXT DEFAULT '[]',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES multiplayer_rooms(id) ON DELETE CASCADE
    );

    -- AI tutor interactions table
    CREATE TABLE IF NOT EXISTS ai_tutor_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      clerk_id TEXT NOT NULL,
      quiz_id INTEGER,
      question TEXT NOT NULL,
      user_answer TEXT,
      correct_answer TEXT,
      explanation TEXT,
      follow_up_questions TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL
    );

    -- Leaderboard table
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      clerk_id TEXT NOT NULL,
      username TEXT NOT NULL,
      total_points INTEGER DEFAULT 0,
      quizzes_completed INTEGER DEFAULT 0,
      average_score REAL DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User gamification table
    CREATE TABLE IF NOT EXISTS user_gamification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      total_xp INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      total_quizzes_completed INTEGER DEFAULT 0,
      total_perfect_scores INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Badges table
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL,
      xp_reward INTEGER DEFAULT 0,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User badges table
    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
      UNIQUE(user_id, badge_id)
    );

    -- User learning analytics table
    CREATE TABLE IF NOT EXISTS user_learning_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      total_attempts INTEGER DEFAULT 0,
      average_score REAL DEFAULT 0,
      mastery_level REAL DEFAULT 0,
      last_attempt_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic, difficulty)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
    CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_code ON multiplayer_rooms(room_code);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC);
    CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_learning_analytics_user_id ON user_learning_analytics(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_learning_analytics_topic ON user_learning_analytics(topic);
    CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON quiz_history(user_id);
  `;

  // Execute each statement separately
  const statements = tables.split(";").filter((s) => s.trim());
  statements.forEach((statement) => {
    if (statement.trim()) {
      try {
        db.exec(statement);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes("already exists")) {
          console.error("Error creating table:", err.message);
        }
      }
    }
  });

  console.log("✅ SQLite tables created successfully");

  // Seed initial badges if they don't exist
  seedBadges();
}

// Seed badges table with default badges
function seedBadges() {
  const badgesData = [
    {
      name: "First Steps",
      description: "Complete your first quiz",
      category: "milestone",
      requirement_type: "quizzes_completed",
      requirement_value: 1,
      xp_reward: 50,
    },
    {
      name: "Quiz Master",
      description: "Complete 10 quizzes",
      category: "milestone",
      requirement_type: "quizzes_completed",
      requirement_value: 10,
      xp_reward: 200,
    },
    {
      name: "Perfect Score",
      description: "Get 100% on any quiz",
      category: "achievement",
      requirement_type: "perfect_scores",
      requirement_value: 1,
      xp_reward: 100,
    },
    {
      name: "Perfectionist",
      description: "Get 100% on 5 quizzes",
      category: "achievement",
      requirement_type: "perfect_scores",
      requirement_value: 5,
      xp_reward: 300,
    },
    {
      name: "On Fire!",
      description: "Maintain a 3-day streak",
      category: "streak",
      requirement_type: "streak_days",
      requirement_value: 3,
      xp_reward: 150,
    },
    {
      name: "Unstoppable",
      description: "Maintain a 7-day streak",
      category: "streak",
      requirement_type: "streak_days",
      requirement_value: 7,
      xp_reward: 400,
    },
    {
      name: "Level Up!",
      description: "Reach level 5",
      category: "level",
      requirement_type: "level",
      requirement_value: 5,
      xp_reward: 250,
    },
    {
      name: "Expert",
      description: "Reach level 10",
      category: "level",
      requirement_type: "level",
      requirement_value: 10,
      xp_reward: 500,
    },
  ];

  try {
    // Check if badges already exist
    const checkStmt = db.prepare("SELECT COUNT(*) as count FROM badges");
    const result = checkStmt.get();

    if (result.count === 0) {
      // Insert default badges
      const insertStmt = db.prepare(`
        INSERT INTO badges (name, description, category, requirement_type, requirement_value, xp_reward)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      badgesData.forEach((badge) => {
        insertStmt.run(
          badge.name,
          badge.description,
          badge.category,
          badge.requirement_type,
          badge.requirement_value,
          badge.xp_reward
        );
      });

      console.log("✅ Default badges seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding badges:", err.message);
  }
}

// Query adapter - converts between PostgreSQL and SQLite syntax
async function query(text, params = []) {
  if (dbType === "postgres") {
    const result = await db.query(text, params);
    return result;
  } else {
    // SQLite
    // Convert PostgreSQL numbered parameters ($1, $2) to SQLite placeholders (?)
    // Handle cases where the same parameter is used multiple times (e.g., $1 appears twice)
    const paramMatches = text.match(/\$(\d+)/g) || [];
    const expandedParams = [];

    paramMatches.forEach((match) => {
      const paramIndex = parseInt(match.substring(1)) - 1; // $1 -> index 0
      if (paramIndex >= 0 && paramIndex < params.length) {
        expandedParams.push(params[paramIndex]);
      }
    });

    let sqliteText = text.replace(/\$\d+/g, "?");

    // Handle INSERT...RETURNING for SQLite (SQLite 3.35+ supports RETURNING but better-sqlite3 needs special handling)
    const hasReturning = /\bRETURNING\b/i.test(sqliteText);
    let returningColumns = [];
    let tableName = "";

    if (hasReturning && sqliteText.trim().toUpperCase().startsWith("INSERT")) {
      // Extract RETURNING columns and table name
      const returningMatch = sqliteText.match(/RETURNING\s+(.+)$/i);
      if (returningMatch) {
        returningColumns = returningMatch[1].split(",").map((c) => c.trim());
      }
      const tableMatch = sqliteText.match(/INSERT\s+INTO\s+(\w+)/i);
      if (tableMatch) {
        tableName = tableMatch[1];
      }
      // Remove RETURNING clause for the insert operation
      sqliteText = sqliteText.replace(/\s+RETURNING\s+.+$/i, "");
    }

    try {
      // Handle transaction commands for SQLite
      const upperText = sqliteText.trim().toUpperCase();
      if (upperText === "BEGIN" || upperText === "BEGIN TRANSACTION") {
        // SQLite doesn't need explicit BEGIN in better-sqlite3 for single statements
        return { rows: [], rowCount: 0 };
      }
      if (upperText === "COMMIT") {
        return { rows: [], rowCount: 0 };
      }
      if (upperText === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }

      if (upperText.startsWith("SELECT") || upperText.startsWith("WITH")) {
        const stmt = db.prepare(sqliteText);
        const rows = stmt.all(...expandedParams);
        return { rows, rowCount: rows.length };
      } else {
        const stmt = db.prepare(sqliteText);
        const info = stmt.run(...expandedParams);

        // If we had RETURNING clause, fetch the inserted row
        if (hasReturning && tableName && info.lastInsertRowid) {
          const selectColumns =
            returningColumns.length > 0 ? returningColumns.join(", ") : "*";
          const selectStmt = db.prepare(
            `SELECT ${selectColumns} FROM ${tableName} WHERE id = ?`
          );
          const insertedRow = selectStmt.get(info.lastInsertRowid);
          return {
            rows: insertedRow ? [insertedRow] : [],
            rowCount: info.changes,
            insertId: info.lastInsertRowid,
          };
        }

        return {
          rows: [],
          rowCount: info.changes,
          insertId: info.lastInsertRowid,
        };
      }
    } catch (err) {
      console.error("SQLite Query Error:", err.message);
      console.error("Query:", sqliteText);
      console.error("Params:", expandedParams);
      throw err;
    }
  }
}

// Get a client (for transaction support)
async function getClient() {
  if (dbType === "postgres") {
    return await db.connect();
  } else {
    // For SQLite, return a mock client with transaction support
    return {
      query: query,
      release: () => {},
      end: () => {},
    };
  }
}

// Close database connection
function close() {
  if (dbType === "postgres") {
    return db.end();
  } else {
    db.close();
  }
}

module.exports = {
  initDatabase,
  query,
  getClient,
  close,
  get db() {
    return db;
  },
  get dbType() {
    return dbType;
  },
};
