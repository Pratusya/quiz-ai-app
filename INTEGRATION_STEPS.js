// ========================================
// INTEGRATION GUIDE - Add to Your Existing Files
// ========================================

// ========================================
// 1. UPDATE: Quiz AI/src/App.jsx
// ========================================
// Add these imports at the top:
import MultiModalQuizGenerator from './components/MultiModalQuizGenerator';
import MultiplayerQuiz from './components/MultiplayerQuiz';

// Add these routes inside your <Routes> component:
<Route path="/multi-modal" element={<MultiModalQuizGenerator />} />
<Route path="/multiplayer" element={<MultiplayerQuiz />} />

// ========================================
// 2. UPDATE: Quiz AI/src/components/Navbar.jsx
// ========================================
// Add these navigation links:
<Link to="/multi-modal" className="nav-link">
  <Button variant="ghost">
    📄 Multi-Modal
  </Button>
</Link>
<Link to="/multiplayer" className="nav-link">
  <Button variant="ghost">
    🎮 Multiplayer
  </Button>
</Link>

// ========================================
// 3. UPDATE: Quiz AI/src/components/QuizCompleted.jsx
// ========================================
// Add import at top:
import AITutor from './AITutor';

// Add AI Tutor component after displaying each question result:
// Example integration:
{questions.map((question, index) => {
  const userAnswer = userAnswers[index];
  const isCorrect = userAnswer === question.correctAnswer;
  
  return (
    <div key={index} className="question-result">
      <h3>Question {index + 1}</h3>
      <p>{question.question}</p>
      <p>Your answer: {userAnswer}</p>
      <p>Correct answer: {question.correctAnswer}</p>
      <p>{isCorrect ? '✅ Correct' : '❌ Incorrect'}</p>
      
      {/* Add AI Tutor here */}
      <AITutor
        question={question.question}
        userAnswer={userAnswer}
        correctAnswer={question.correctAnswer}
        topic={quizTopic}
        isCorrect={isCorrect}
      />
    </div>
  );
})}

// ========================================
// 4. UPDATE: Quiz AI/src/components/QuizResults.jsx
// ========================================
// Same as above - add AITutor component
// Import:
import AITutor from './AITutor';

// Add after each question display:
<AITutor
  question={question.question}
  userAnswer={selectedAnswer}
  correctAnswer={question.correctAnswer}
  topic={topic}
  isCorrect={isCorrect}
/>

// ========================================
// 5. UPDATE: Backend AI/.env
// ========================================
// Add these environment variables:
/*
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
DATABASE_URL=postgresql://username:password@host:5432/database
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
*/

// ========================================
// 6. UPDATE: Quiz AI/src/components/Home.jsx
// ========================================
// Add feature cards for new features:
const newFeatures = [
  {
    title: "Multi-Modal Generator",
    description: "Generate quizzes from PDFs, videos, images, and audio",
    icon: "📄",
    link: "/multi-modal"
  },
  {
    title: "Multiplayer Battles",
    description: "Compete with friends in real-time quiz battles",
    icon: "🎮",
    link: "/multiplayer"
  },
  {
    title: "AI Tutor",
    description: "Get detailed explanations and ask follow-up questions",
    icon: "🤖",
    link: "/quiz-generator"
  }
];

// Display these cards on your home page

// ========================================
// 7. OPTIONAL: Add to Layout.jsx
// ========================================
// If you have a Layout component, ensure it includes:
<nav>
  <Link to="/">Home</Link>
  <Link to="/quiz-generator">Generate Quiz</Link>
  <Link to="/multi-modal">Multi-Modal</Link>
  <Link to="/multiplayer">Multiplayer</Link>
  <Link to="/about">About</Link>
</nav>

// ========================================
// 8. Database Migration
// ========================================
// Run this in your PostgreSQL database:
// See DATABASE_SETUP_QUERIES.sql for complete schema

// Quick command to run SQL file:
// psql -U username -d database_name -f DATABASE_SETUP_QUERIES.sql

// Or manually run these key tables:

/*
-- Multiplayer Tables
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL UNIQUE,
  room_name VARCHAR(255) NOT NULL,
  host_user_id TEXT NOT NULL,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS multiplayer_sessions (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Uploads Table
CREATE TABLE IF NOT EXISTS content_uploads (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_type VARCHAR(20),
  original_filename VARCHAR(255),
  quiz_id INTEGER REFERENCES quizzes(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Tutor Interactions Table
CREATE TABLE IF NOT EXISTS ai_tutor_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id INTEGER REFERENCES quizzes(id),
  interaction_type VARCHAR(50),
  user_query TEXT,
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
*/

// ========================================
// 9. Testing Your Integration
// ========================================

// Test Multi-Modal:
// 1. Start backend: cd "Backend AI" && npm start
// 2. Start frontend: cd "Quiz AI" && npm run dev
// 3. Navigate to http://localhost:5173/multi-modal
// 4. Upload a test PDF or paste YouTube URL
// 5. Verify quiz generation works

// Test Multiplayer:
// 1. Open two browser windows/tabs
// 2. Navigate to http://localhost:5173/multiplayer in both
// 3. Create room in first window
// 4. Join with room code in second window
// 5. Start game and test

// Test AI Tutor:
// 1. Complete any quiz
// 2. Look for AI Tutor component on results page
// 3. Click "Get Detailed Explanation"
// 4. Ask follow-up questions
// 5. Verify responses are contextual

// ========================================
// 10. Common Integration Issues & Fixes
// ========================================

// Issue: "Module not found" errors
// Fix: npm install in both Backend AI and Quiz AI folders

// Issue: CORS errors
// Fix: Check CLIENT_URL in .env matches your frontend URL

// Issue: WebSocket connection failed
// Fix: Ensure backend is running on correct port (5000)

// Issue: API key errors
// Fix: Add valid OPENAI_API_KEY to .env file

// Issue: Database connection errors
// Fix: Check DATABASE_URL in .env

// Issue: Routes not working
// Fix: Ensure React Router is properly configured in App.jsx

// ========================================
// 11. Build for Production
// ========================================

// Frontend build:
// cd "Quiz AI"
// npm run build
// Output will be in dist/ folder

// Backend deployment:
// Set NODE_ENV=production in .env
// Use PM2 or similar process manager
// pm2 start server.js --name quiz-backend

// ========================================
// 12. Performance Optimization Tips
// ========================================

// Frontend:
// - Use React.lazy() for code splitting
// - Implement pagination for quiz lists
// - Add loading states for better UX
// - Cache API responses with React Query

// Backend:
// - Add Redis for session management
// - Implement rate limiting
// - Use database connection pooling
// - Add caching for frequent queries

// ========================================
// Quick Reference: File Locations
// ========================================

/*
Backend AI/
├── server.js (updated with new routes)
├── multiModalProcessor.js (NEW)
├── multiplayer.js (NEW)
├── uploads/ (NEW directory)
└── .env (needs OPENAI_API_KEY)

Quiz AI/src/components/
├── MultiModalQuizGenerator.jsx (NEW)
├── MultiplayerQuiz.jsx (NEW)
├── AITutor.jsx (NEW)
├── App.jsx (needs routes update)
├── Navbar.jsx (needs links update)
├── QuizCompleted.jsx (needs AITutor integration)
└── ui/scroll-area.jsx (NEW)
*/

// ========================================
// THAT'S IT! 🎉
// ========================================
// Your Quiz AI project now has:
// ✅ Multi-Modal Quiz Generation
// ✅ Real-Time Multiplayer
// ✅ AI Tutor Assistant
// 
// Follow the steps above to integrate everything!
// Good luck! 🚀
