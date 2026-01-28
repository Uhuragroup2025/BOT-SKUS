import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { constructUserPrompt, GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
            type, brand, model, presentation, material, mainUse, benefits, certification
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
        const userPrompt = constructUserPrompt({
            name: productName,
            features,
            category,
            channel,
            tone,
            type,
            brand,
            model,
            presentation,
            material,
            mainUse,
            benefits,
            certification
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: GENERATION_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;

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

