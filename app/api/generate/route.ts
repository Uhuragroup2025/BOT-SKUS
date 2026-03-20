import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { constructUserPrompt, GENERATION_SYSTEM_PROMPT, constructImagePrompt, IMAGE_GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

// Initialize AI Provider base
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

    const openAIKey = process.env.OPENAI_API_KEY;
    const openai = openAIKey ? new OpenAI({ apiKey: openAIKey }) : null;
    const isTeamUser = user.email?.endsWith("@uhuragroup.com");

    try {
        const body = await req.json();
        const { productName, features, images, skuMaster } = body;

        console.log("Generation Request Received", {
            productName,
            imagesCount: images?.length || 0,
            openAIKeyFound: !!openAIKey,
            openAIKeyLength: openAIKey?.length || 0
        });

        const category = skuMaster?.product_identity?.category || "General";
        const marketplace = skuMaster?.source?.marketplace || "mercado_libre";
        const tone = skuMaster?.brand_style?.tone || "comercial";

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
        const userPrompt = constructUserPrompt({
            skuMaster,
            features,
            name: productName
        });

        let content = "";
        let imageContent = "";

        const imagePromptRef = constructImagePrompt({
            skuMaster,
            features
        });

        if (openai) {
            console.log("Using OpenAI GPT-4o for generation...");
            const messages: any[] = [
                { role: "system", content: GENERATION_SYSTEM_PROMPT },
            ];

            const userContent: any[] = [
                { type: "text", text: userPrompt }
            ];

            if (images && Array.isArray(images) && images.length > 0) {
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

            const pSEO = openai.chat.completions.create({
                model: "gpt-4o",
                messages,
                response_format: { type: "json_object" }
            });

            const pImg = openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: IMAGE_GENERATION_SYSTEM_PROMPT },
                    { role: "user", content: imagePromptRef }
                ],
                response_format: { type: "json_object" }
            });

            const [response, imgResponse] = await Promise.all([pSEO, pImg]);

            content = response.choices[0].message.content || "";
            imageContent = imgResponse.choices[0].message.content || "";
        } else {
            console.log("Using Gemini 1.5 Pro for generation...");
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-pro",
                systemInstruction: GENERATION_SYSTEM_PROMPT,
                generationConfig: { responseMimeType: "application/json" }
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

            const imgModel = genAI.getGenerativeModel({
                model: "gemini-1.5-pro",
                systemInstruction: IMAGE_GENERATION_SYSTEM_PROMPT,
                generationConfig: { responseMimeType: "application/json" }
            });

            const pSEO = model.generateContent(promptParts);
            const pImg = imgModel.generateContent(imagePromptRef);

            const [resultSEO, resultImg] = await Promise.all([pSEO, pImg]);

            content = (await resultSEO.response).text();
            imageContent = (await resultImg.response).text();
        }

        if (!content) {
            throw new Error("No content generated");
        }

        let cleanContent = content.trim();

        // 4. Robust JSON Extraction
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
            console.error("----- RAW AI OUTPUT THAT FAILED TO PARSE -----");
            console.error(content);
            console.error("--------------------------------------------------");
            throw new Error("AI returned invalid JSON format.");
        }

        let parsedImageContent: any = {};
        if (imageContent) {
            let cleanImg = imageContent.trim();
            const imgJsonMatch = cleanImg.match(/\{[\s\S]*\}/);
            if (imgJsonMatch) cleanImg = imgJsonMatch[0];
            else if (cleanImg.startsWith("\`\`\`json")) cleanImg = cleanImg.replace(/^\`\`\`json\n?/, "").replace(/\n?\`\`\`$/, "");
            else if (cleanImg.startsWith("\`\`\`")) cleanImg = cleanImg.replace(/^\`\`\`\n?/, "").replace(/\n?\`\`\`$/, "");

            try {
                parsedImageContent = JSON.parse(cleanImg.trim());
            } catch (e) {
                console.error("Failed to parse image prompt JSON:", imageContent);
            }
        }

        parsedContent.visualAssets = parsedImageContent.images || [];

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
                settings: { category, marketplace, tone },
                score_ia: parsedContent.score || null
            });

        if (insertError) {
            console.error("Error logging generation:", insertError);
        }

        return NextResponse.json(parsedContent);

    } catch (error: any) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            { error: "Failed to generate content: " + (error.message || "Unknown error") },
            { status: 500 }
        );
    }
}

