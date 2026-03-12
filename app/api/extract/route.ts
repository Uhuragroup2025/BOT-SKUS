import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
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

    const openAIKey = process.env.OPENAI_API_KEY;
    const openai = openAIKey ? new OpenAI({ apiKey: openAIKey }) : null;

    try {
        const body = await req.json();
        const { text, images } = body;

        const payloadSize = JSON.stringify(body).length;
        console.log("Extraction Request Received", {
            hasText: !!text,
            imagesCount: images?.length || 0,
            payloadSizeMB: (payloadSize / 1024 / 1024).toFixed(2) + "MB",
            openAIKeyFound: !!openAIKey,
            openAIKeyLength: openAIKey?.length || 0
        });

        let extractedText = text;
        const firstImage = images && images.length > 0 ? images[0] : null;

        if (firstImage && firstImage.startsWith("data:application/pdf")) {
            console.log("Processing PDF...");
            try {
                // @ts-ignore
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

        let content = "";

        if (openai) {
            console.log("Using OpenAI GPT-4o for extraction...");
            const messages: any[] = [
                { role: "system", content: SKU_MASTER_PROMPT },
            ];

            const userContent: any[] = [
                { type: "text", text: "Extrae datos detallados de esta(s) imagen(es) de producto e información técnica. Genera un JSON Maestro siguiendo estrictamente el esquema proporcionado." }
            ];

            if (extractedText) {
                userContent.push({ type: "text", text: `Texto extraído de referencia: ${extractedText}` });
            }

            if (images && images.length > 0) {
                for (const imgBase64 of images) {
                    if (imgBase64 && imgBase64.startsWith("data:image/")) {
                        userContent.push({
                            type: "image_url",
                            image_url: { url: imgBase64 }
                        });
                    }
                }
            }

            messages.push({ role: "user", content: userContent });

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages,
                response_format: { type: "json_object" }
            });

            content = response.choices[0].message.content || "";
        } else {
            console.log("Using Gemini 1.5 Flash for faster extraction...");
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: SKU_MASTER_PROMPT,
                generationConfig: { responseMimeType: "application/json" }
            });

            const promptParts: any[] = [
                { text: extractedText || "Analiza esta imagen de producto y extrae toda la información técnica siguiendo el esquema JSON." }
            ];

            if (images && Array.isArray(images)) {
                for (const imgBase64 of images) {
                    if (imgBase64 && imgBase64.startsWith("data:")) {
                        const [meta, base64Data] = imgBase64.split(",");
                        const mimeType = meta.split(":")[1].split(";")[0];
                        promptParts.push({
                            inlineData: { mimeType, data: base64Data }
                        });
                    }
                }
            }

            const result = await model.generateContent(promptParts);
            const response = await result.response;
            const jsonText = response.text();

            // Gemini 1.5 Flash might return markdown wrapped JSON
            if (jsonText.trim().startsWith("```json")) {
                content = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
            } else if (jsonText.trim().startsWith("```")) {
                content = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
            } else {
                content = jsonText;
            }
        }

        console.log("AI Response received. Size:", content.length, "chars");

        // Clean potentially markdown wrapped JSON
        if (content.trim().startsWith("```json")) {
            content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        } else if (content.trim().startsWith("```")) {
            content = content.replace(/^```\n?/, "").replace(/\n?```$/, "");
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

