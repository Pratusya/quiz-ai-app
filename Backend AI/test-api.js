const axios = require("axios");

async function testAPI() {
  try {
    console.log("Testing health endpoint...");
    const health = await axios.get("http://localhost:5000/health");
    console.log("✅ Health check passed:", health.data);

    console.log("\nTesting quiz generation...");
    const quiz = await axios.post(
      "http://localhost:5000/api/generate-quiz",
      {
        topic: "Mathematics",
        difficulty: "Easy",
        numQuestions: 3,
        questionType: "MCQ",
        language: "english",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "user-id": "test-user",
          username: "Test User",
        },
      }
    );

    console.log("✅ Quiz generation successful!");
    console.log("Generated questions:", quiz.data.quiz.questions.length);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testAPI();
