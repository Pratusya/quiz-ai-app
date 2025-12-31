-- =====================================================
-- COMPLETE DATABASE SETUP QUERIES FOR QUIZ AI PROJECT
-- =====================================================
-- Run these queries in your PostgreSQL database to set up all tables

-- =====================================================
-- 1. CORE QUIZ TABLES
-- =====================================================

-- Create Quizzes Table
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

-- Create Quiz Results Table
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

-- Create Quiz History Table
CREATE TABLE IF NOT EXISTS quiz_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt_used TEXT NOT NULL,
  generation_parameters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. GAMIFICATION SYSTEM TABLES
-- =====================================================

-- Create User Gamification Table
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

-- Create Badges Table
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

-- Create User Badges Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

-- =====================================================
-- 3. ADAPTIVE LEARNING & ANALYTICS TABLES
-- =====================================================

-- Create User Learning Analytics Table
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

-- =====================================================
-- 4. MULTIPLAYER SYSTEM TABLES
-- =====================================================

-- Create Multiplayer Rooms Table
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL UNIQUE,
  room_name VARCHAR(255) NOT NULL,
  host_user_id TEXT NOT NULL,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  max_players INTEGER DEFAULT 10,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Create Multiplayer Sessions Table (Track individual player sessions)
CREATE TABLE IF NOT EXISTS multiplayer_sessions (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  average_time_per_question DECIMAL(8,2),
  final_rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE
);

-- Create Multiplayer Question Responses Table (Track individual answers)
CREATE TABLE IF NOT EXISTS multiplayer_responses (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES multiplayer_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_taken DECIMAL(8,2),
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Multi-Modal Content Uploads Table
CREATE TABLE IF NOT EXISTS content_uploads (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_type VARCHAR(20) CHECK (content_type IN ('pdf', 'image', 'audio', 'video')),
  original_filename VARCHAR(255),
  file_size INTEGER,
  extracted_text_length INTEGER,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. AI TUTOR INTERACTION LOGS (Optional - for analytics)
-- =====================================================

-- Create AI Tutor Interactions Table
CREATE TABLE IF NOT EXISTS ai_tutor_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT,
  user_answer TEXT,
  correct_answer TEXT,
  interaction_type VARCHAR(50) CHECK (interaction_type IN ('explanation', 'followup', 'concept')),
  user_query TEXT,
  ai_response TEXT,
  helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. INSERT DEFAULT BADGES DATA
-- =====================================================

-- Insert default badges (will not duplicate if already exists)
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

-- =====================================================
-- 7. CREATE PERFORMANCE INDEXES
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_quiz_id ON quiz_history(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_analytics_user_id ON user_learning_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_analytics_topic ON user_learning_analytics(user_id, topic);

-- Multiplayer indexes
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_host ON multiplayer_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_status ON multiplayer_rooms(status);
CREATE INDEX IF NOT EXISTS idx_multiplayer_sessions_room ON multiplayer_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_sessions_user ON multiplayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_responses_session ON multiplayer_responses(session_id);

-- Content uploads indexes
CREATE INDEX IF NOT EXISTS idx_content_uploads_user ON content_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_content_uploads_status ON content_uploads(processing_status);

-- AI Tutor indexes
CREATE INDEX IF NOT EXISTS idx_ai_tutor_user ON ai_tutor_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_quiz ON ai_tutor_interactions(quiz_id);

-- =====================================================
-- 8. VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Check if all tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'quizzes', 'quiz_results', 'quiz_history', 
  'user_gamification', 'badges', 'user_badges',
  'user_learning_analytics', 'multiplayer_rooms',
  'multiplayer_sessions', 'multiplayer_responses',
  'content_uploads', 'ai_tutor_interactions'
)
ORDER BY table_name;

-- Check if default badges were inserted
SELECT COUNT(*) as badge_count FROM badges;

-- Check if indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN (
  'quizzes', 'quiz_results', 'quiz_history', 
  'user_gamification', 'user_badges',
  'user_learning_analytics', 'multiplayer_rooms',
  'multiplayer_sessions', 'multiplayer_responses',
  'content_uploads', 'ai_tutor_interactions'
)
ORDER BY indexname;

-- =====================================================
-- SETUP COMPLETE! 🎉
-- =====================================================
-- 
-- Your database now includes:
-- ✅ 12 Tables for complete Quiz AI functionality
-- ✅ 10 Default achievement badges
-- ✅ 16 Performance indexes
-- ✅ Foreign key relationships
-- ✅ Data validation constraints
-- 
-- Tables Created:
-- 1. quizzes - Store quiz questions and metadata
-- 2. quiz_results - Store user quiz completion results
-- 3. quiz_history - Track quiz generation history
-- 4. user_gamification - User XP, levels, streaks
-- 5. badges - Achievement badge definitions
-- 6. user_badges - User earned badges
-- 7. user_learning_analytics - Adaptive learning data
-- 8. multiplayer_rooms - Multiplayer game rooms
-- 9. multiplayer_sessions - Player sessions in rooms
-- 10. multiplayer_responses - Individual question answers
-- 11. content_uploads - Multi-modal content tracking
-- 12. ai_tutor_interactions - AI tutor chat history
-- 
-- NEW FEATURES ENABLED:
-- 🎮 Gamification System (XP, Levels, Badges)
-- 🧠 Adaptive Learning Algorithm
-- 📊 Advanced Analytics Dashboard
-- 🏆 Achievement System
-- ⚡ Performance Optimization
-- 🎯 Real-Time Multiplayer Quiz Battles
-- 📄 Multi-Modal Quiz Generation (PDF, Image, Video, Audio)
-- 🤖 AI Tutor with Follow-up Q&A
-- 📈 Player Statistics & Leaderboards
-- 🔥 Streak Tracking
-- =====================================================