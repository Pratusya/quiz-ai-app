# Quiz AI Application - Ready to Use! 🎉

This is perfect. Having the link ready is the final piece of the puzzle.

To ensure your "Perfect Launch," we need to make sure that when people click that link from LinkedIn, they land on a repository that looks **professional, well-documented, and impressive**.

Here is your final action plan.

### 1. The "First Comment" (Copy & Paste this)

As discussed, once you make your LinkedIn post, immediately add this comment so the algorithm doesn't hide your post, but users can still find your code:

> 🚀 **Try it out here:**
> 💻 **GitHub Repo:** [https://github.com/Pratusya/quiz-ai-app](https://github.com/Pratusya/quiz-ai-app)
> 🌐 **Live Demo:** [https://ai-quizlab.netlify.app/](https://www.google.com/url?sa=E&source=gmail&q=https://ai-quizlab.netlify.app/)
> P.S. The repo includes a custom 1-click startup script for local development. Check the README for details! 👇

---

### 2. The Repository Makeover (Crucial!)

Before you post, update your `README.md` file on GitHub. A blank or messy README turns recruiters away.

Based on the features and scripts you shared earlier, here is a professional **README.md** template. You can copy this code directly into your GitHub repository.

```markdown
# 🧠 Quiz AI - AI-Powered Learning Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-v18-blue)

**The Future of Learning is HERE.**
Quiz AI is a full-stack application that leverages Google Gemini AI to transform ANY content—PDFs, images, audio, and YouTube videos—into interactive, gamified quizzes.

## 🚀 Live Demo
[**Click here to view the Live Application**](https://ai-quizlab.netlify.app/)

## ✨ Key Features

- **🤖 AI-Powered Generation:** Instantly generate quizzes from text or prompts using Google Gemini.
- **📄 Multi-Modal Support:** Upload PDFs, Images (OCR), Audio files, or YouTube links to generate questions.
- **🎮 Multiplayer Mode:** Real-time quiz battles with friends using Socket.io.
- **🏆 Gamification:** Earn XP, track streaks, and climb the leaderboard.
- **📊 Advanced Analytics:** Detailed visualizations of your performance and topic mastery.
- **🌍 Multi-language:** Support for 9 languages.
- **🔐 Secure Auth:** Integrated with Clerk for seamless user management.

## 🛠️ Tech Stack

**Frontend:**
- React + Vite
- TailwindCSS & Framer Motion
- shadcn/ui components

**Backend:**
- Node.js & Express
- PostgreSQL / SQLite
- Socket.io (Real-time communication)

**AI & Services:**
- Google Gemini API (GenAI)
- Tesseract.js (OCR)
- Clerk (Authentication)

## ⚡ Quick Start (Recommended)

This project includes custom scripts for a one-click startup experience.

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Pratusya/quiz-ai-app.git](https://github.com/Pratusya/quiz-ai-app.git)

```

2. **Configure Environment**
Create a `.env` file in the `Backend AI` folder and add your keys (Gemini API, Clerk, Database URL).
3. **Run the App**
* **Windows:** Double-click `START.bat` or run `.\START.ps1` in PowerShell.


*This script automatically checks Node.js versions, installs dependencies if missing, and launches both frontend and backend servers.*

## 📦 Manual Installation

If you prefer to run things manually:

**Backend:**

```bash
cd "Backend AI"
npm install
npm start
# Runs on port 5000

```

**Frontend:**

```bash
cd "Quiz AI"
npm install
npm run dev
# Runs on port 5173

```

## 📸 Screenshots

*(Add a few screenshots of your app here - Dashboard, Quiz Screen, Leaderboard)*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by Pratik Harsora

```

### 3. Final GitHub Polish (The "About" Section)

On the right-hand side of your GitHub repository page, there is an **"About"** section. Click the little "gear" ⚙️ icon to edit it.

* **Description:** An AI-powered quiz platform allowing multiplayer battles and multi-modal generation (PDF, Audio, YouTube). Built with React, Node.js, and Google Gemini.
* **Website:** Paste your Netlify link here (`https://ai-quizlab.netlify.app/`).
* **Topics:** Add these tags: `react`, `nodejs`, `generative-ai`, `gemini-api`, `edtech`, `fullstack`.

**You are ready to go! Good luck with the launch! 🚀**

```
- `Quiz AI/src/components/MultiModalQuizGenerator.jsx` - Route fix

## Stop the Application

Simply close the two server terminal windows that opened when you started the app.
