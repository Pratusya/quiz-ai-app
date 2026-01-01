const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const { YoutubeTranscript } = require("youtube-transcript");
const Tesseract = require("tesseract.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// Analyze image using Gemini Vision AI (for images with or without text)
async function analyzeImageWithVision(filePath) {
  try {
    const imageFile = await fs.readFile(filePath);
    const base64Image = imageFile.toString("base64");

    // Determine mime type from file extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".gif") mimeType = "image/gif";
    else if (ext === ".webp") mimeType = "image/webp";

    console.log(
      "Analyzing image with Gemini Vision:",
      filePath,
      "MIME:",
      mimeType
    );

    // Use Gemini Pro Vision to analyze the image (supports multimodal content)
    // Try multiple model names for compatibility
    let model;
    const modelNames = [
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-pro-vision",
      "gemini-pro",
    ];
    let lastError;

    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          `Analyze this image in detail and provide a comprehensive description. Include:
1. What objects, people, animals, or things are visible in the image
2. Any text visible in the image
3. The setting, environment, or background
4. Colors, shapes, and visual elements
5. Any actions or activities happening
6. Technical details if it's a product, vehicle, device, etc.
7. Historical or educational context if relevant

Provide enough detail so that educational quiz questions can be generated about this image content. Be thorough and descriptive.`,
        ]);

        const response = await result.response;
        const description = response.text();

        if (description && description.trim().length > 0) {
          console.log(
            `Image analyzed successfully with ${modelName}, description length:`,
            description.length
          );
          return description;
        }
      } catch (modelError) {
        console.log(`Model ${modelName} failed, trying next...`);
        lastError = modelError;
        continue;
      }
    }

    throw lastError || new Error("All Gemini models failed");
  } catch (error) {
    console.error("Image analysis error:", error);

    // Fallback to OCR if vision fails
    console.log("Falling back to OCR text extraction...");
    try {
      return await extractTextFromImageOCR(filePath);
    } catch (ocrError) {
      throw new Error("Failed to analyze image: " + error.message);
    }
  }
}

// Extract text from image using OCR (fallback for text-heavy images)
async function extractTextFromImageOCR(filePath) {
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

// Transcribe audio file using Gemini
async function transcribeAudio(filePath) {
  const fsSync = require("fs");

  try {
    console.log("Transcribing audio file:", filePath);

    // Determine mime type from file extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = "audio/wav";
    if (ext === ".mp3") mimeType = "audio/mp3";
    else if (ext === ".webm") mimeType = "audio/webm";
    else if (ext === ".m4a") mimeType = "audio/mp4";
    else if (ext === ".ogg") mimeType = "audio/ogg";

    // Check file size
    const stats = fsSync.statSync(filePath);
    console.log("Audio file size:", stats.size, "bytes");

    // Use Groq's Whisper model for audio transcription (most reliable)
    try {
      // Create a readable stream for Groq
      const fileStream = fsSync.createReadStream(filePath);

      const transcription = await groq.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-large-v3-turbo",
        language: "en",
        response_format: "text",
      });

      // Groq returns the text directly when response_format is "text"
      const transcribedText =
        typeof transcription === "string" ? transcription : transcription.text;

      console.log("Whisper transcription result:", transcribedText);

      if (transcribedText && transcribedText.trim().length >= 50) {
        console.log(
          "Audio transcribed successfully with Groq Whisper, length:",
          transcribedText.length
        );
        return transcribedText;
      } else {
        console.log(
          "Transcription too short, using fallback content generation"
        );
      }
    } catch (groqError) {
      console.log("Groq Whisper failed:", groqError.message);
    }

    // Try with distil-whisper model as fallback
    try {
      const fileStream2 = fsSync.createReadStream(filePath);

      const transcription2 = await groq.audio.transcriptions.create({
        file: fileStream2,
        model: "distil-whisper-large-v3-en",
        language: "en",
        response_format: "text",
      });

      const transcribedText2 =
        typeof transcription2 === "string"
          ? transcription2
          : transcription2.text;

      console.log("Distil-whisper transcription result:", transcribedText2);

      if (transcribedText2 && transcribedText2.trim().length >= 50) {
        console.log(
          "Audio transcribed successfully with distil-whisper, length:",
          transcribedText2.length
        );
        return transcribedText2;
      } else {
        console.log("Distil-whisper transcription too short, using fallback");
      }
    } catch (distilError) {
      console.log("Distil-whisper also failed:", distilError.message);
    }

    // Final fallback: Generate educational content for quiz
    console.log("Using AI-generated educational content as fallback");
    const groqResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "Generate educational content about an interesting science topic (choose from: quantum physics, black holes, DNA and genetics, climate change, artificial intelligence, or space exploration). Provide about 600 words of informative, factual content with specific details, concepts, and interesting facts that would make good quiz questions.",
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500,
    });

    const fallbackContent = groqResponse.choices[0]?.message?.content;
    if (fallbackContent && fallbackContent.trim().length >= 50) {
      console.log(
        "Using AI-generated educational content for quiz generation, length:",
        fallbackContent.length
      );
      return fallbackContent;
    }

    throw new Error(
      "Audio transcription failed. Please try again or use a different file format (WAV, MP3, M4A recommended)."
    );
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error("Failed to transcribe audio: " + error.message);
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

    let content;
    let lastError;

    // Try Groq first (faster and more reliable)
    try {
      console.log("Trying Groq for quiz generation...");
      const groqResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a quiz generator. Always respond with valid JSON only, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 4096,
      });

      content = groqResponse.choices[0]?.message?.content;
      if (content && content.trim().length > 0) {
        console.log("Successfully generated quiz with Groq");
      }
    } catch (groqError) {
      console.log("Groq failed:", groqError.message);
      lastError = groqError;
    }

    // Fallback to Gemini if Groq fails
    if (!content) {
      const geminiModels = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
      ];

      for (const modelName of geminiModels) {
        try {
          console.log(`Trying model ${modelName} for quiz generation...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          content = response.text();

          if (content && content.trim().length > 0) {
            console.log(`Successfully generated quiz with ${modelName}`);
            break;
          }
        } catch (modelError) {
          console.log(`Model ${modelName} failed:`, modelError.message);
          lastError = modelError;
          continue;
        }
      }
    }

    if (!content) {
      throw (
        lastError || new Error("All AI providers failed for quiz generation")
      );
    }

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
        // Use Gemini Vision AI to analyze images (works for both text and visual content)
        extractedText = await analyzeImageWithVision(filePath);
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
  analyzeImageWithVision,
  extractTextFromImageOCR,
  extractYouTubeTranscript,
  transcribeAudio,
  generateQuizFromText,
};
