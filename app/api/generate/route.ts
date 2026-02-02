import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { constructUserPrompt, GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

// Initialize Gemini
// Ensure you have GEMINI_API_KEY in your env variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
            productName, features, category, channel, tone,
            type, brand, model: productModel, presentation, material, mainUse, benefits, certification
        } = body;

        if (!productName || !features) {
            return NextResponse.json(
                { error: "Missing required fields" },
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
            model: "gemini-2.0-flash",
            systemInstruction: GENERATION_SYSTEM_PROMPT,
            generationConfig: { responseMimeType: "application/json" }
        });

        const userPrompt = constructUserPrompt({
            name: productName,
            features,
            category,
            channel,
            tone,
            type,
            brand,
            model: productModel,
            presentation,
            material,
            mainUse,
            benefits,
            certification
        });

        const result = await model.generateContent(userPrompt);
        const response = await result.response;
        const content = response.text();

        if (!content) {
            throw new Error("No content generated");
        }

        const parsedContent = JSON.parse(content);

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

    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            { error: "Failed to generate content" },
            { status: 500 }
        );
    }
}

