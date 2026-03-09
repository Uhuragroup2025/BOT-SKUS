import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { constructUserPrompt, GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

// Initialize Gemini
// Ensure you have GEMINI_API_KEY in your env variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds

export async function POST(req: Request) {
    const supabase = await createClient();

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const isTeamUser = user.email?.endsWith("@uhuragroup.com");

    try {
        const body = await req.json();
        const {
            productName, features, images, skuMaster
        } = body;

        const category = skuMaster?.product_identity?.category || "General";
        const channel = skuMaster?.marketplace_metadata?.channel || "ecommerce";
        const tone = skuMaster?.targeting?.tone || "comercial";

        if (!productName) {
            return NextResponse.json(
                { error: "El nombre del producto es obligatorio." },
                { status: 400 }
            );
        }

        // 2. Check Credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits, plan')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        if (!isTeamUser && profile.credits <= 0) {
            return NextResponse.json(
                { error: "Insufficient credits. Please upgrade your plan." },
                { status: 403 }
            );
        }

        // 3. Generate Content
        // Note: Gemini doesn't always strictly adhere to system prompts in the same way as OpenAI in `chat` struct,
        // but `systemInstruction` is available in newer models or we can prepend it.
        // For 1.5 Pro, we can pass systemInstruction to getGenerativeModel.

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: GENERATION_SYSTEM_PROMPT,
            generationConfig: { responseMimeType: "application/json" }
        });

        const userPrompt = constructUserPrompt({
            skuMaster,
            features,
            name: productName
        });

        const promptParts: any[] = [{ text: userPrompt }];

        if (images && Array.isArray(images) && images.length > 0) {
            for (const imgBase64 of images) {
                if (imgBase64 && imgBase64.startsWith("data:image/")) {
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
        const content = response.text();

        if (!content) {
            throw new Error("No content generated");
        }

        let cleanContent = content.trim();

        // 4. Robust JSON Extraction
        // Sometimes Gemini wraps output in markdown blocks or adds text before/after
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanContent = jsonMatch[0];
        } else if (cleanContent.startsWith("```json")) {
            cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        } else if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }

        let parsedContent;
        try {
            parsedContent = JSON.parse(cleanContent.trim());
        } catch (parseError) {
            console.error("----- RAW GEMINI OUTPUT THAT FAILED TO PARSE -----");
            console.error(content);
            console.error("--------------------------------------------------");
            throw new Error("Gemini returned invalid JSON format.");
        }

        // 4. Deduct Credit (only for non-team users)
        if (!isTeamUser) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits - 1 })
                .eq('id', user.id);

            if (updateError) {
                console.error("Error updating credits:", updateError);
            }
        }

        // 5. Log Generation
        const { error: insertError } = await supabase
            .from('generations')
            .insert({
                user_id: user.id,
                product_name: productName,
                content: parsedContent,
                settings: { category, channel, tone },
                score_ia: parsedContent.score || null
            });

        if (insertError) {
            console.error("Error logging generation:", insertError);
        }

        return NextResponse.json(parsedContent);

    } catch (error: any) {
        console.error("Error generating content:", error);

        try {
            // Dynamically import 'fs' and 'path' to avoid bundling issues in edge environments
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'gemini_error.log');
            fs.writeFileSync(logPath, `${new Date().toISOString()}\nERROR:\n${error?.message || error}\nSTACK:\n${error?.stack}\n\n`, { flag: 'a' });
        } catch (e) {
            // If fs/path are not available (e.g., in Vercel Edge runtime), this catch block will handle it.
            console.error("Failed to write error to log file:", e);
        }
        console.error("Error generating content:", error);
        return NextResponse.json(
            { error: "Failed to generate content" },
            { status: 500 }
        );
    }
}

