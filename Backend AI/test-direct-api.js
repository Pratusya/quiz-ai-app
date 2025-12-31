require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testDirectAPI() {
  console.log("🔍 Testing Gemini API directly...\n");
  console.log(
    "API Key:",
    API_KEY ? `${API_KEY.substring(0, 20)}...` : "NOT FOUND"
  );

  const models = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];

  for (const model of models) {
    try {
      console.log(`\n🧪 Testing ${model}...`);

      // Try v1 API
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Say hello",
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${model} WORKS on v1 API!`);
        console.log(
          "Response:",
          data.candidates[0].content.parts[0].text.substring(0, 50)
        );
        break; // Found a working model!
      } else {
        console.log(
          `❌ ${model} - ${response.status}: ${
            data.error?.message || response.statusText
          }`
        );
      }
    } catch (error) {
      console.log(`❌ ${model} - ${error.message}`);
    }
  }
}

testDirectAPI();
