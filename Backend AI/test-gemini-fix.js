require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testAPI() {
  console.log("🔍 Testing Gemini API with different configurations...\n");

  // Test direct REST API with v1
  const models = [
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
  ];

  for (const model of models) {
    try {
      console.log(`\n🧪 Testing ${model} with v1 API...`);

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
                  text: "Generate a simple math quiz question with 4 multiple choice options.",
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok && data.candidates) {
        console.log(`✅ ${model} WORKS!`);
        console.log(
          "Response preview:",
          data.candidates[0].content.parts[0].text.substring(0, 100)
        );
        return model; // Return the working model
      } else {
        console.log(`❌ ${model} - Status: ${response.status}`);
        if (data.error) {
          console.log(`   Error: ${data.error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${model} - ${error.message}`);
    }
  }

  console.log(
    "\n❌ No working models found. The API key may be invalid or expired."
  );
  return null;
}

testAPI().then((workingModel) => {
  if (workingModel) {
    console.log(`\n✅ SUCCESS! Use model: ${workingModel}`);
    console.log(
      `\nUpdate server.js line ~444 to use: genAI.getGenerativeModel({ model: "${workingModel}" })`
    );
  }
});
