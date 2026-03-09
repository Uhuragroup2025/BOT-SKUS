import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SKU_MASTER_PROMPT } from "@/lib/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { text, images } = body;

        const payloadSize = JSON.stringify(body).length;
        console.log("Extraction Request Received", {
            hasText: !!text,
            imagesCount: images?.length || 0,
            payloadSizeBytes: payloadSize,
            payloadSizeMB: (payloadSize / 1024 / 1024).toFixed(2) + "MB"
        });

        let extractedText = text;
        const firstImage = images && images.length > 0 ? images[0] : null;

        if (firstImage && firstImage.startsWith("data:application/pdf")) {
            console.log("Processing PDF...");
            try {
                // Dynamically import pdf-parse to avoid top-level issues
                // @ts-ignore - pdf-parse is a CommonJS module
                const pdf = (await import("pdf-parse")).default;
                const base64Data = firstImage.split(",")[1];
                const buffer = Buffer.from(base64Data, "base64");
                const pdfData = await pdf(buffer);
                extractedText = pdfData.text;
                console.log("PDF Text extracted length:", extractedText?.length);
            } catch (pdfError: any) {
                console.error("PDF Parsing Error:", pdfError);
                return NextResponse.json({ error: "Error al leer el PDF. Asegúrate de que no esté corrupto." }, { status: 400 });
            }
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: SKU_MASTER_PROMPT,
            generationConfig: { responseMimeType: "application/json" }
        });

        let result;

        if (extractedText && (!images || images.length === 0)) {
            result = await model.generateContent(`Extrae datos de este texto: ${extractedText}`);
        } else if (images && images.length > 0) {
            const promptParts: any[] = [{ text: "Extrae datos detallados de esta(s) imagen(es) de producto. Si hay varias, intégralas para entender bien el producto frontal y sus posibles detalles/texturas internas." }];

            if (extractedText) {
                promptParts.push({ text: `Texto extra de referencia: ${extractedText}` });
            }

            for (const imgBase64 of images) {
                if (imgBase64 && imgBase64.startsWith("data:image/")) {
                    const [meta, base64Data] = imgBase64.split(",");
                    const mimeType = meta.split(":")[1].split(";")[0];
                    promptParts.push({
                        inlineData: { mimeType, data: base64Data }
                    });
                }
            }

            result = await model.generateContent(promptParts);
        } else {
            return NextResponse.json({ error: "No input provided" }, { status: 400 });
        }

        const response = await result.response;
        let content = response.text();
        console.log("Gemini Response received. Size:", content.length, "chars");
        console.log("Gemini Response (first 100):", content?.substring(0, 100) + "...");

        // Clean potentially markdown wrapped JSON from Gemini (redundant if using responseMimeType: "application/json" but safe)
        if (content.startsWith("```json")) {
            content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
        }

        const parsedContent = JSON.parse(content || "{}");

        if (parsedContent.isValidProduct === false) {
            return NextResponse.json({
                error: parsedContent.rejectionReason || "El archivo no parece ser un producto válido."
            }, { status: 400 });
        }

        return NextResponse.json(parsedContent);

    } catch (error: any) {
        console.error("Extraction error:", error);
        return NextResponse.json({ error: error.message || "Error interno al procesar la solicitud." }, { status: 500 });
    }
}

