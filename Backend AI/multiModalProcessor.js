const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const { YoutubeTranscript } = require("youtube-transcript");
const Tesseract = require("tesseract.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|png|jpg|jpeg|wav|mp3|mp4|webm/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only PDF, images, and audio files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter,
});

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Extract text from image using OCR
async function extractTextFromImage(filePath) {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(filePath, "eng", {
      logger: (info) => console.log(info),
    });
    return text;
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to extract text from image");
  }
}

// Extract YouTube video transcript
async function extractYouTubeTranscript(url) {
  try {
    // Extract video ID from URL
    let videoId = "";

    if (url.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get("v");
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/shorts/")) {
      videoId = url.split("youtube.com/shorts/")[1].split("?")[0];
    }

    if (!videoId) {
      throw new Error(
        "Invalid YouTube URL. Please provide a valid YouTube video link."
      );
    }

    console.log("Extracting transcript for video ID:", videoId);

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcript || transcript.length === 0) {
        throw new Error("No transcript available");
      }

      // Combine all transcript segments
      const fullText = transcript.map((item) => item.text).join(" ");
      console.log("Transcript extracted, length:", fullText.length);
      return fullText;
    } catch (transcriptError) {
      console.error("Transcript fetch failed:", transcriptError.message);

      // If transcript fails, try to use Gemini to generate content about the video topic
      // by asking user to describe the video topic instead
      throw new Error(
        "Could not extract transcript from this video. The video may not have captions enabled, " +
          "or captions may be disabled by the creator. Please try a different video with captions, " +
          "or use the PDF/Image upload option with screenshots of the video content."
      );
    }
  } catch (error) {
    console.error("YouTube transcript error:", error);
    throw error;
  }
}

// Transcribe audio file (requires additional setup)
async function transcribeAudio(filePath) {
  try {
    const audioFile = await fs.readFile(filePath);

    // Audio transcription requires Whisper API or similar service
    // You can use OpenAI Whisper, Google Cloud Speech-to-Text, or AssemblyAI
    console.log("Audio transcription requested for:", filePath);

    // Placeholder implementation
    throw new Error(
      "Audio transcription requires Whisper API or speech-to-text service setup."
    );

    // Example implementation with a speech-to-text service:
    // const transcription = await speechToTextService.transcribe({
    //   file: audioFile,
    // });
    // return transcription.text;
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

// Generate quiz from extracted text using AI
async function generateQuizFromText(text, options = {}) {
  const {
    numQuestions = 5,
    difficulty = "Medium",
    questionType = "MCQ",
    topic = "General",
  } = options;

  try {
    let prompt;

    if (questionType === "True/False") {
      prompt = `Based on the following content, generate ${numQuestions} ${difficulty} difficulty True/False questions.

Content:
${text.substring(0, 4000)}

Requirements:
- Generate exactly ${numQuestions} True/False questions
- Difficulty level: ${difficulty}
- Each question should test understanding of the content
- Include brief explanations for correct answers
- Topic: ${topic}

Response format (JSON):
{
  "questions": [
    {
      "question": "question text that can be answered with True or False",
      "options": ["True", "False"],
      "correctAnswer": 0,
      "explanation": "brief explanation"
    }
  ]
}

IMPORTANT: correctAnswer must be a NUMBER - 0 for True, 1 for False.`;
    } else if (questionType === "Fill in the Blanks") {
      prompt = `Based on the following content, generate ${numQuestions} ${difficulty} difficulty Fill in the Blanks questions.

Content:
${text.substring(0, 4000)}

Requirements:
- Generate exactly ${numQuestions} fill in the blanks questions
- Difficulty level: ${difficulty}
- Each question should have a blank marked with _____
- Provide 4 possible options to fill the blank
- Include brief explanations for correct answers
- Topic: ${topic}

Response format (JSON):
{
  "questions": [
    {
      "question": "The _____ is the capital of France.",
      "options": ["Paris", "London", "Berlin", "Madrid"],
      "correctAnswer": 0,
      "explanation": "Paris is the capital city of France."
    }
  ]
}

IMPORTANT: correctAnswer must be a NUMBER (0, 1, 2, or 3) representing the INDEX of the correct option in the options array.`;
    } else {
      prompt = `Based on the following content, generate ${numQuestions} ${difficulty} difficulty MCQ questions.

Content:
${text.substring(0, 4000)}

Requirements:
- Generate exactly ${numQuestions} MCQ questions
- Difficulty level: ${difficulty}
- Each question should test understanding of the content
- Provide 4 options for each question
- Include brief explanations for correct answers
- Topic: ${topic}

Response format (JSON):
{
  "questions": [
    {
      "question": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": 0,
      "explanation": "brief explanation"
    }
  ]
}

IMPORTANT: correctAnswer must be a NUMBER (0, 1, 2, or 3) representing the INDEX of the correct option in the options array.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    // Parse JSON response
    let parsedContent;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[1]);
      } else {
        parsedContent = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Normalize the questions to ensure correctAnswer is always a numeric index
    const normalizedQuestions = normalizeQuestions(
      parsedContent.questions || [],
      questionType
    );

    return normalizedQuestions;
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw new Error("Failed to generate quiz from content");
  }
}

// Normalize questions to ensure correctAnswer is always a numeric index
function normalizeQuestions(questions, questionType) {
  if (!Array.isArray(questions)) return [];

  return questions.map((question, index) => {
    const normalized = { ...question };

    // Ensure options exist
    if (!Array.isArray(normalized.options) || normalized.options.length === 0) {
      if (questionType === "True/False") {
        normalized.options = ["True", "False"];
      } else {
        console.warn(`Question ${index + 1}: Missing options`);
        normalized.options = ["Option A", "Option B", "Option C", "Option D"];
      }
    }

    // Normalize correctAnswer to numeric index
    let correctIndex = normalized.correctAnswer;

    if (typeof correctIndex === "string") {
      // If it's a string, try to find it in options
      const foundIndex = normalized.options.findIndex(
        (opt) =>
          String(opt).toLowerCase().trim() ===
          String(correctIndex).toLowerCase().trim()
      );

      if (foundIndex !== -1) {
        correctIndex = foundIndex;
      } else {
        // Try parsing as number
        const parsed = parseInt(correctIndex, 10);
        if (
          !isNaN(parsed) &&
          parsed >= 0 &&
          parsed < normalized.options.length
        ) {
          correctIndex = parsed;
        } else {
          console.warn(
            `Question ${index + 1}: Could not normalize correctAnswer "${
              normalized.correctAnswer
            }", defaulting to 0`
          );
          correctIndex = 0;
        }
      }
    } else if (typeof correctIndex === "boolean") {
      // For True/False questions
      correctIndex = correctIndex ? 0 : 1;
    } else if (typeof correctIndex !== "number") {
      console.warn(
        `Question ${index + 1}: Invalid correctAnswer type, defaulting to 0`
      );
      correctIndex = 0;
    }

    // Validate range
    if (correctIndex < 0 || correctIndex >= normalized.options.length) {
      console.warn(
        `Question ${
          index + 1
        }: correctAnswer ${correctIndex} out of range, defaulting to 0`
      );
      correctIndex = 0;
    }

    normalized.correctAnswer = correctIndex;

    // Ensure explanation exists
    if (!normalized.explanation) {
      normalized.explanation = `The correct answer is: ${normalized.options[correctIndex]}`;
    }

    return normalized;
  });
}

// Clean up uploaded file
async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log("Cleaned up file:", filePath);
  } catch (error) {
    console.error("File cleanup error:", error);
  }
}

// Main processing function
async function processMultiModalContent(file, contentType, options) {
  let extractedText = "";
  let filePath = file ? file.path : null;

  try {
    switch (contentType) {
      case "pdf":
        if (!filePath) throw new Error("PDF file required");
        extractedText = await extractTextFromPDF(filePath);
        break;

      case "image":
        if (!filePath) throw new Error("Image file required");
        extractedText = await extractTextFromImage(filePath);
        break;

      case "audio":
        if (!filePath) throw new Error("Audio file required");
        extractedText = await transcribeAudio(filePath);
        break;

      case "video":
        // For YouTube videos, URL is passed in options
        if (!options.url) throw new Error("YouTube URL required");
        extractedText = await extractYouTubeTranscript(options.url);
        break;

      default:
        throw new Error("Invalid content type");
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        "Insufficient text extracted from content. Please provide content with more text."
      );
    }

    console.log("Extracted text length:", extractedText.length);
    console.log("First 200 chars:", extractedText.substring(0, 200));

    // Generate quiz from extracted text
    const questions = await generateQuizFromText(extractedText, options);

    // Clean up uploaded file
    if (filePath) {
      await cleanupFile(filePath);
    }

    return {
      success: true,
      questions,
      extractedTextLength: extractedText.length,
      contentType,
    };
  } catch (error) {
    // Clean up file on error
    if (filePath) {
      await cleanupFile(filePath);
    }
    throw error;
  }
}

module.exports = {
  upload,
  processMultiModalContent,
  extractTextFromPDF,
  extractTextFromImage,
  extractYouTubeTranscript,
  transcribeAudio,
  generateQuizFromText,
};
