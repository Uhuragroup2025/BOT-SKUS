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
        const { text, image } = await req.json();

        const messages: any[] = [
            {
                role: "system",
                content: `Eres un experto en extracción de datos estructurados de productos. 
                Analiza el input (texto o imagen) y extrae la siguiente información en formato JSON:
                {
                    "brand": "string",
                    "model": "string",
                    "presentation": "string (ej: 500ml, Pack de 2)",
                    "material": "string",
                    "mainUse": "string",
                    "benefits": ["string"],
                    "certification": "string"
                }
                Si no encuentras un dato, pon null.`
            }
        ];

        if (text) {
            messages.push({ role: "user", content: `Extrae datos de este texto: ${text}` });
        } else if (image) {
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
        return NextResponse.json(JSON.parse(content || "{}"));

    } catch (error) {
        console.error("Extraction error:", error);
        return NextResponse.json({ error: "Failed to extract data" }, { status: 500 });
    }
}
