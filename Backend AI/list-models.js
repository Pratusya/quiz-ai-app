const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("🔍 Fetching available models...\n");

    // Try to list models
    const models = await genAI.listModels();

    console.log("✅ Available Models:\n");
    for await (const model of models) {
      console.log(`📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(
        `   Supported Methods: ${model.supportedGenerationMethods?.join(", ")}`
      );
      console.log("");
    }
  } catch (error) {
    console.error("❌ Error listing models:", error.message);

    // Try common model names directly
    console.log("\n🧪 Testing common model names:\n");

    const testModels = [
      "gemini-pro",
      "gemini-1.0-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "models/gemini-pro",
      "models/gemini-1.5-flash",
    ];

    for (const modelName of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ ${modelName} - WORKS!`);
      } catch (err) {
        console.log(`❌ ${modelName} - ${err.message}`);
      }
    }
  }
}

listModels();
