# Backend Dependencies Installation Guide

## Install all required packages for the enhanced features

```bash
npm install socket.io multer pdf-parse youtube-transcript tesseract.js openai dotenv
```

## Package Details:

1. **socket.io** (v4.x)

   - Real-time bidirectional communication for multiplayer
   - WebSocket support

2. **multer** (v1.x)

   - Middleware for handling multipart/form-data
   - File upload handling for PDFs, images, audio

3. **pdf-parse** (v1.x)

   - Extract text from PDF documents
   - No external dependencies

4. **youtube-transcript** (v1.x)

   - Fetch YouTube video transcripts
   - Required for video-to-quiz generation

5. **tesseract.js** (v4.x)

   - OCR (Optical Character Recognition)
   - Extract text from images
   - Supports 100+ languages

6. **openai** (v4.x)

   - Official OpenAI API client
   - Used for AI quiz generation and tutor

7. **dotenv** (already installed)
   - Environment variable management

## Optional but Recommended:

```bash
npm install --save-dev nodemon
```

## Environment Variables Required:

Add to your `.env` file in Backend AI directory:

```env
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Or use Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Model selection
OPENAI_MODEL=gpt-3.5-turbo

# Database (already configured)
DATABASE_URL=your_database_url

# Server Port
PORT=5000

# Client URL for CORS
CLIENT_URL=http://localhost:5173
```

## Installation Steps:

1. Navigate to Backend AI directory:

   ```bash
   cd "Backend AI"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install new packages:

   ```bash
   npm install socket.io multer pdf-parse youtube-transcript tesseract.js openai
   ```

4. Create uploads directory:

   ```bash
   mkdir uploads
   ```

5. Update your .env file with API keys

6. Start the server:
   ```bash
   npm start
   ```

## Frontend Dependencies:

Navigate to Quiz AI directory and install:

```bash
cd "../Quiz AI"
npm install socket.io-client
```

## Troubleshooting:

### If pdf-parse fails:

```bash
npm install --legacy-peer-deps pdf-parse
```

### If tesseract.js is slow:

- First run will download language data
- Subsequent runs will be faster
- Data is cached locally

### If youtube-transcript fails:

- Make sure the video has captions enabled
- Some videos may have restricted transcripts

### Socket.io connection issues:

- Check firewall settings
- Ensure port 5000 is available
- Try different transport methods (websocket/polling)

## Testing:

1. Test multi-modal generation:

   - Upload a PDF file
   - Should extract text and generate quiz

2. Test multiplayer:

   - Open two browser tabs
   - Create room in one, join from another
   - Start game and answer questions

3. Test AI Tutor:
   - Complete a quiz
   - Click "Get Detailed Explanation"
   - Ask follow-up questions

## Performance Notes:

- PDF parsing: ~1-5 seconds for typical PDFs
- OCR processing: ~3-10 seconds depending on image size
- YouTube transcripts: ~2-5 seconds
- AI responses: ~2-8 seconds depending on API

## API Rate Limits:

**OpenAI GPT-3.5-turbo:**

- Free tier: 3 requests/minute
- Paid tier: Higher limits

**YouTube Transcript:**

- No official limits
- Use reasonable request rates

**Tesseract.js:**

- Client-side processing
- No API limits
