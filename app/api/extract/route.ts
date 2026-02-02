import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { text, image } = body;

        console.log("Extraction Request Received", { hasText: !!text, hasImage: !!image, imageStart: image?.substring(0, 30) });

        let extractedText = text;

        if (image && image.startsWith("data:application/pdf")) {
            console.log("Processing PDF...");
            try {
                // Dynamically import pdf-parse to avoid top-level issues
                const pdf = require("pdf-parse");
                const base64Data = image.split(",")[1];
                const buffer = Buffer.from(base64Data, "base64");
                const pdfData = await pdf(buffer);
                extractedText = pdfData.text;
                console.log("PDF Text extracted length:", extractedText.length);
            } catch (pdfError: any) {
                console.error("PDF Parsing Error:", pdfError);
                return NextResponse.json({ error: "Error al leer el PDF. Asegúrate de que no esté corrupto." }, { status: 400 });
            }
        }

        // Prepare System Prompt
        const systemPrompt = `Eres un experto en extracción de datos estructurados de productos para ecommerce. 
        Analiza el input (texto o imagen) y determina si contiene información sobre un producto real (etiqueta, ficha técnica, descripción comercial).
        
        Si el input NO es sobre un producto (ej: paisajes, personas, fotos aleatorias, texto sin sentido sobre productos), responde:
        {
            "isValidProduct": false,
            "rejectionReason": "El archivo o texto no parece contener información técnica o comercial de un producto. Por favor sube una imagen de la etiqueta, ficha técnica o descripción del producto."
        }
        
        Si el input SI es sobre un producto, extrae los datos en este formato JSON:
        {
            "isValidProduct": true,
            "brand": "string",
            "model": "string",
            "presentation": "string (ej: 500ml, Pack de 2)",
            "material": "string",
            "mainUse": "string",
            "benefits": ["string"],
            "certification": "string"
        }
        Si no encuentras un dato específico del producto, pon null en ese campo.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: "application/json" }
        });

        let result;

        if (extractedText) {
            result = await model.generateContent(`Extrae datos de este texto: ${extractedText}`);
        } else if (image) {
            // For images (non-PDF)
            // image format: "data:image/jpeg;base64,..."
            // Gemini needs just the base64 part and the mimeType
            const [meta, base64Data] = image.split(",");
            const mimeType = meta.split(":")[1].split(";")[0];

            result = await model.generateContent([
                { text: "Extrae datos de esta imagen de producto." },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                }
            ]);
        } else {
            return NextResponse.json({ error: "No input provided" }, { status: 400 });
        }

        const response = await result.response;
        let content = response.text();
        console.log("Gemini Response:", content?.substring(0, 100) + "...");

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

