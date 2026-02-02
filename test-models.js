const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const apiKey = envVars.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY found in .env.local");
    process.exit(1);
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Test specific model names.
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro-001",
        "gemini-1.5-pro-002",
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",
    ];

    console.log("Testing model availability for API Key starting with:", apiKey.substring(0, 5) + "...");

    for (const modelName of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ Model '${modelName}' is AVAILABLE.`);
        } catch (error) {
            // Safe access to error message
            const msg = error.message || error.toString();
            // Check for 404
            if (msg.includes("404")) {
                console.log(`❌ Model '${modelName}' NOT FOUND (404).`);
                if (modelName === 'gemini-1.5-flash') console.log("FULL ERROR:", msg);
            } else {
                console.log(`⚠️ Model '${modelName}' error: ${msg.substring(0, 100)}...`);
            }
        }
    }
}

listModels();
