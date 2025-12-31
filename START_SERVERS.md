# 🚀 How to Start Your Quiz Application

## ❌ The Problem You Just Had

**Error:** `ERR_CONNECTION_REFUSED` on `http://localhost:5000`

**Cause:** The backend server wasn't running!

## ✅ Solution: Start Both Servers

You need **TWO** terminals running simultaneously:

### Terminal 1: Backend Server (Port 5000)

```powershell
cd "Backend AI"
node server.js
```

**You should see:**

```
✅ SQLite tables created successfully
Database connection successful.
Server running on port 5000
WebSocket server ready for multiplayer connections
```

### Terminal 2: Frontend Dev Server (Port 5173)

```powershell
cd "Quiz AI"
npm run dev
```

**You should see:**

```
VITE v5.4.19  ready in 264 ms
➜  Local:   http://localhost:5173/
```

## 🎯 Quick Start Commands (PowerShell)

### Option 1: Two Separate Terminals

**Terminal 1:**

```powershell
cd "d:\drive e\All Projects\Quiz project in react\Backend AI"
node server.js
```

**Terminal 2:**

```powershell
cd "d:\drive e\All Projects\Quiz project in react\Quiz AI"
npm run dev
```

### Option 2: Single Command (Background Processes)

```powershell
# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Backend AI'; node server.js"

# Start frontend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Quiz AI'; npm run dev"
```

## 🔍 How to Know Both Are Running

### Check Backend (Port 5000):

Open browser and visit: http://localhost:5000/health

**Should return:**

```json
{
  "status": "ok",
  "timestamp": "...",
  "database": {
    "status": "connected"
  }
}
```

### Check Frontend (Port 5173):

Open browser and visit: http://localhost:5173

**Should show:** Your Quiz AI application homepage

## ⚠️ Common Issues

### Issue 1: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:** Kill the existing process

```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue 2: Frontend Can't Connect

**Error:** `ERR_CONNECTION_REFUSED`

**Solution:** Make sure backend is running first!

1. Check Terminal 1 shows "Server running on port 5000"
2. Visit http://localhost:5000/health to verify
3. Then restart frontend if needed

### Issue 3: Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:** Install dependencies

```powershell
# Backend dependencies
cd "Backend AI"
npm install

# Frontend dependencies
cd ../Quiz AI
npm install
```

## 📝 Startup Checklist

Before using the app, verify:

- [ ] Backend terminal shows "Server running on port 5000"
- [ ] Frontend terminal shows "Local: http://localhost:5173/"
- [ ] http://localhost:5000/health returns success
- [ ] http://localhost:5173 loads the app
- [ ] No console errors in browser DevTools

## 🎉 You're Ready!

Once both servers are running:

1. Open http://localhost:5173 in your browser
2. Generate quizzes without any connection errors!
3. All features should work: quiz generation, saving, submission, XP, badges, etc.

## 💡 Pro Tips

1. **Keep both terminal windows visible** so you can see any errors
2. **Don't close the terminals** while using the app
3. **Restart both servers** if you make changes to backend code
4. **Only frontend auto-reloads** when you change React components
5. **Check backend logs** if quiz generation fails

---

**Remember:** Backend MUST be running before you use the frontend! 🚀
