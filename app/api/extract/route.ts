import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        const messages: any[] = [
            {
                role: "system",
                content: systemPrompt
            }
        ];

        if (extractedText) {
            messages.push({ role: "user", content: `Extrae datos de este texto: ${extractedText}` });
        } else if (image) {
            // For images (not PDF)
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: "Extrae datos de esta imagen de producto." },
                    { type: "image_url", image_url: { url: image } }
                ]
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        console.log("OpenAI Response:", content?.substring(0, 100) + "...");

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

