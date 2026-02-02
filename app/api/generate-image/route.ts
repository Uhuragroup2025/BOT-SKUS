import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Use a model capable of image generation. 
        // Note: For now we try 'gemini-2.0-flash-exp' or 'gemini-2.0-flash' which might support image generation 
        // OR we use the specific imagen model via REST if SDK doesn't fully support it nicely yet for all accounts.
        // However, user has access to gemini-2.0-flash which is multimodal.
        // Let's try to use 'gemini-2.0-flash-exp' for image generation if available, or 'imagen-3.0-generate-001' via vertex.
        // But since we are using Google AI Studio API key, we should rely on the models available there.
        // The listModels output showed: 'models/gemini-2.0-flash-exp-image-generation' (WAIT, I need to check the list again if I missed it, 
        // actually the user list had 'gemini-2.0-flash' and 'gemini-2.0-flash-001' etc.
        // Let's assume standard image generation via 'gemini-2.0-flash' isn't direct "text-to-image" returning a byte stream in the simplified SDK call usually.
        // BUT, Google AI Studio recently added Imagen 3 support.
        // NOTE: The user's model list included 'models/imagen-4.0-generate-preview-06-06' (Vertex?) No, that was in the big list valid for Vertex probably.
        // Let's look at the 'models.json' file content again to be sure what is available for this API Key.

        // Actually, looking at the previous models.json provided by the tool:
        // It listed 'models/imagen-3.0-generate-001' ? No wait, let me re-check the file if needed.
        // It listed 'models/gemini-2.0-flash-exp-image-generation' in the `models.json` content I saw?
        // Let's check the file content 'models.json' from step 121.
        // Line 78: "name": "models/gemini-2.0-flash-exp-image-generation",
        // This seems to be the one!

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash", // gemini-2.0-flash supports image generation output? 
            // Actually the specific model valid for image generation often is 'gemini-2.0-flash' with specific config or 'imagen-3.0'.
            // Let's try 'gemini-2.0-flash' first as it is the most stable one available to user.
            // If that fails we can try 'gemini-2.0-flash-exp-image-generation'.
        });

        // For Image Generation in Gemini 2.0 (Google AI Studio):
        // It's usually a tool or a specific output modality.
        // However, currently the SDK method for image generation might be `model.generateImages` if updated, 
        // OR simply `generateContent` asking for an image?
        // As of early 2025, Imagen 3 is available via `imagen-3.0-generate-001` model ID usually for separate calls.

        // Let's try to use the specific model found in the list: 'gemini-2.0-flash-exp-image-generation' 
        // OR we assume 'gemini-2.0-flash' can do it.
        // Let's use the standard way if possible: standard generateContent but asking for image? 
        // No, usually it's a separate model for pure image gen if not multimodal-output.

        // Let's try the specific model that explicitly mentions image generation if it exists.
        // Re-reading models.json... 
        // "name": "models/gemini-2.0-flash-exp-image-generation" (Line 78 in prev step)

        // So we use that model.

        const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Fallback to main
        // Wait, 'gemini-2.0-flash' description says "multimodal model".

        // There is a potential ambiguity on how to call image gen via this SDK version. 
        // Use a fallback to 'gemini-2.0-flash' asking for an image. 
        // Use standard prompt.

        // If the user wants 5 images, we generate one by one.

        const result = await imageModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            // tools: [], // If needed
        });

        // Wait, generateContent returns text/multimodal parts. Does it return inline images?
        // Gemini 2.0 Flash is capable of native image generation.
        // The response should contain the image data if requested? 
        // Actually, you usually need to ASK for it or use a specific tool config?
        // Let's try simply sending the prompt. If it returns text describing an image, that's wrong.
        // We should explicitly instruct it to generate an image? 
        // Or maybe we need to use the REST API manually if the SDK doesn't wrap it conveniently yet.

        // BETTER APPROACH:
        // Use the 'imagen-3.0-generate-001' style endpoint if available, but since we saw 'gemini-2.0-flash-exp-image-generation'
        // let's try to target that model specifically.

        // In the interest of time and robustness:
        // I will try to use the 'gemini-2.0-flash' model but I will append "Generate an image of: " to the prompt just in case,
        // although the user prompt is already quite descriptive.
        // But wait, if I use `generateContent`, it returns text by default unless I configure it otherwise?
        // Actually, for Gemini 2.0, Image Generation is often a separate API call or requires specific handling.

        // Let's look at a simpler path.
        // I will implement the route. If it fails, I will debug.
        // I'll try to extract the image from `response` if it exists.

        const response = await result.response;
        // console.log("Gemini Image Response:", JSON.stringify(response, null, 2));

        // Note: The SDK might not return the image bytes directly in `text()`. 
        // It might be in `candidates[0].content.parts[0].inline_data`?

        // Let's assume standard Gemini output for now, but handle potential failure.
        // If it returns text, we might need to adjust.

        // Ref: https://ai.google.dev/gemini-api/docs/image-generation
        // "To generate images, use the `imagen-3.0-generate-001` model..."

        // But the user DOES NOT have `imagen-3.0` in the list (explicitly).
        // They have `gemini-2.0-flash`... 
        // AND `models/gemini-2.0-flash-exp-image-generation`

        // I will use `gemini-2.0-flash` which is the one we verified working for text.
        // But for image?
        // Let's try the `gemini-2.0-flash-exp-image-generation` model ID specifically for this route.

        const outputModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });

        const imageResult = await outputModel.generateContent(prompt);
        const imageResponse = await imageResult.response;

        // If successful, we need to extract the image.
        // Usually: candidates -> content -> parts -> inlineData (mimeType, data)

        // Let's start with a safe implementation that tries to just return the response structure 
        // so the frontend can parse it, OR we parse it here.

        // We will try to parse the base64 here.

        const candidates = imageResponse.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned");
        }

        const parts = candidates[0].content.parts;
        const imagePart = parts.find(p => p.inlineData);

        if (!imagePart || !imagePart.inlineData) {
            // Check if it returned text saying it can't do it
            const textPart = parts.find(p => p.text);
            if (textPart) {
                console.warn("Gemini returned text instead of image:", textPart.text);
                throw new Error("Gemini returned text instead of image: " + textPart.text);
            }
            throw new Error("No image data found in response");
        }

        const base64Image = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;

        return NextResponse.json({
            image: `data:${mimeType};base64,${base64Image}`
        });

    } catch (error: any) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
