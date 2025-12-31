# Quiz AI Application - Ready to Use! 🎉

## Quick Start

### Option 1: Double-click (Recommended)

- **Windows**: Double-click `START.bat` or `START.ps1`

### Option 2: Command Line

```powershell
# PowerShell
.\START.ps1

# Command Prompt
START.bat
```

## What the Startup Script Does

1. ✅ Verifies Node.js is installed
2. ✅ Checks that Backend AI and Quiz AI folders exist
3. ✅ Starts Backend Server on port 5000
4. ✅ Starts Frontend Server on port 5173
5. ✅ Opens your browser to http://localhost:5173

## Application URLs

| Service      | URL                                   | Description     |
| ------------ | ------------------------------------- | --------------- |
| Frontend     | http://ai-quizlab.netlify.app/        | Main Quiz App   |
| Backend API  | https://quiz-ai-app-pqyh.onrender.com | REST API Server |
| Health Check | http://localhost:5000/health          | Server Status   |

## Features Working

- ✅ User Authentication (Clerk)
- ✅ AI Quiz Generation (Gemini API)
- ✅ Multiple Quiz Types (MCQ, True/False)
- ✅ Quiz History & Statistics
- ✅ Score Display & Leaderboard
- ✅ Gamification (XP System)
- ✅ Advanced Analytics
- ✅ Multi-language Support
- ✅ Quiz Details & Review

## Troubleshooting

### Server Won't Start

1. Make sure Node.js is installed: `node --version`
2. Install dependencies if needed:
   ```bash
   cd "Backend AI" && npm install
   cd "../Quiz AI" && npm install
   ```

### API Errors (500)

- Check that the backend server is running
- Verify your Gemini API key in `Backend AI/server.js`

### Score Shows 0

- Make sure you submit the quiz before navigating away
- The score is saved in both localStorage and navigation state

## Files Changed

- `START.ps1` - PowerShell startup script
- `START.bat` - Batch file startup script
- `Backend AI/server.js` - SQLite compatibility fixes
- `Backend AI/database.js` - Database adapter fixes
- `Quiz AI/src/components/QuizCompleted.jsx` - Score display fix
- `Quiz AI/src/components/QuizGenerator.jsx` - Score passing fix
- `Quiz AI/src/components/MultiModalQuizGenerator.jsx` - Route fix

## Stop the Application

Simply close the two server terminal windows that opened when you started the app.
