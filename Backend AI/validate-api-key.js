require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;

async function validateAPIKey() {
  console.log("🔑 API Key Validation Check\n");
  console.log(
    `API Key: ${API_KEY ? API_KEY.substring(0, 20) + "..." : "NOT FOUND"}`
  );
  console.log(`Length: ${API_KEY ? API_KEY.length : 0} characters`);
  console.log(
    `Format: ${
      API_KEY && API_KEY.startsWith("AIza")
        ? "✅ Correct format"
        : "❌ Invalid format"
    }\n`
  );

  if (!API_KEY || !API_KEY.startsWith("AIza")) {
    console.log("❌ INVALID API KEY FORMAT!");
    console.log("\nPlease check:");
    console.log("1. Your .env file has GEMINI_API_KEY=your_actual_key");
    console.log('2. The API key starts with "AIza"');
    console.log("3. There are no spaces or quotes around the key");
    return;
  }

  console.log("🧪 Testing API key with simple request...\n");

  // Try to get models list using REST API
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.models) {
      console.log("✅ API KEY IS VALID!\n");
      console.log(`Found ${data.models.length} available models:\n`);

      data.models.forEach((model) => {
        const name = model.name.replace("models/", "");
        const methods = model.supportedGenerationMethods || [];
        if (methods.includes("generateContent")) {
          console.log(`  ✅ ${name} (supports generateContent)`);
        }
      });

      // Find a working model
      const workingModel = data.models.find((m) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );

      if (workingModel) {
        console.log(
          `\n✅ RECOMMENDED MODEL: ${workingModel.name.replace("models/", "")}`
        );
      }
    } else {
      console.log("❌ API KEY IS INVALID OR EXPIRED!\n");
      console.log(`Status: ${response.status}`);
      if (data.error) {
        console.log(`Error: ${data.error.message}`);
        console.log(`\nPossible reasons:`);
        console.log("1. The API key has expired");
        console.log("2. The API key has been revoked");
        console.log("3. The API key has billing issues");
        console.log("4. The API key has no permissions");
        console.log(
          "\n📝 To fix: Generate a new API key at https://makersuite.google.com/app/apikey"
        );
      }
    }
  } catch (error) {
    console.log("❌ Error validating API key:", error.message);
  }
}

validateAPIKey();
