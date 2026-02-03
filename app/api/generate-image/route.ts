import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, referenceImage } = body; // referenceImage is base64 string

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Use 'gemini-2.0-flash' as it supports multimodal generation (Text/Image -> Text/Image)
        // Note: If user has quota issues with 2.0, this might fail, but 1.5 Flash cannot generate images.
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const parts: any[] = [
            { text: "Generate a high-quality, realistic product image based on this description: " + prompt }
        ];

        // If a reference image is provided, add it to the prompt context
        if (referenceImage) {
            // Remove header data if present (e.g. "data:image/jpeg;base64,")
            const base64Data = referenceImage.split(',')[1] || referenceImage;

            parts.push({
                inlineData: {
                    mimeType: "image/jpeg", // Assuming converted to jpeg in frontend, or generic
                    data: base64Data
                }
            });
            parts.push({ text: "Use the attached image as a STRICT visual reference for the product's appearance (shape, exact logos, colors). Do not alter the product packaging." });
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: parts }],
        });

        const response = await result.response;

        // Extract image from response
        // Gemini 2.0 outputs images as inlineData in the parts
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) throw new Error("No response from model");

        const messageContent = candidates[0].content;
        const imagePart = messageContent.parts.find(p => p.inlineData);

        if (!imagePart || !imagePart.inlineData) {
            // Check if it's a text refusal
            const textPart = messageContent.parts.find(p => p.text);
            if (textPart) {
                console.warn("Model refused or returned text:", textPart.text);
                throw new Error("AI returned text instead of image: " + textPart.text);
            }
            throw new Error("No image generated.");
        }

        return NextResponse.json({
            image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
        });

    } catch (error: any) {
        console.error("------------------------------------------------");
        console.error("Generate Image Error Details:");
        console.error("Message:", error.message);
        console.error("GoogleGenerativeAIError:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error("------------------------------------------------");

        if (error.message?.includes("429") || error.message?.includes("quota")) {
            return NextResponse.json(
                { error: "⚠️ Ups… límite de imágenes alcanzado\n\nEstoy conectado a Gemini y puedo generar textos sin problema ✍️\nPero para crear imágenes uso potencia gráfica y eso funciona con créditos de Google Cloud por demanda 🎨💸\n\nRecargamos y sigo creando 🚀✨" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
