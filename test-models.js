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

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        "gemini-flash-latest",
        "gemini-2.0-flash-001",
        "gemini-1.5-flash-latest"
    ];

    console.log("Testing model availability...");

    for (const modelName of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            const response = await result.response;
            console.log(`✅ Model '${modelName}' is AVAILABLE.`);
        } catch (error) {
            const msg = error.message || error.toString();
            if (msg.includes("404")) {
                console.log(`❌ Model '${modelName}' NOT FOUND (404).`);
            } else {
                console.log(`⚠️ Model '${modelName}' error: ${msg.substring(0, 200)}...`);
            }
        }
    }
}

listModels();
