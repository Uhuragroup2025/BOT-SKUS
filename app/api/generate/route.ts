import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { constructUserPrompt, GENERATION_SYSTEM_PROMPT, constructImageAnalysisPrompt, constructImageMomentPrompt, IMAGE_GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
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
        let visualAssets: any[] = [];
        let packaging_analysis: any = null;

        const extractJSON = (text: string) => {
            let clean = text.trim();
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) clean = match[0];
            else if (clean.startsWith("```json")) clean = clean.replace(/^```json\n?/, "").replace(/\n?```$/, "");
            else if (clean.startsWith("```")) clean = clean.replace(/^```\n?/, "").replace(/\n?```$/, "");
            try { return JSON.parse(clean); } catch(e) { console.error("ExtractJSON failed on:", clean); return null; }
        };

        const callVisionModel = async (systemPrompt: string, userPrompt: string, imagesPayload: any, modelOverride?: string) => {
            if (openai) {
                const userContent: any[] = [{ type: "text", text: userPrompt }];
                if (imagesPayload && Array.isArray(imagesPayload)) {
                    for (const imgBase64 of imagesPayload) {
                        if (imgBase64 && imgBase64.startsWith("data:image/")) {
                            userContent.push({ type: "image_url", image_url: { url: imgBase64 } });
                        }
                    }
                }
                const res = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContent }
                    ],
                    response_format: { type: "json_object" }
                });
                return res.choices[0].message.content || "{}";
            } else {
                const imgModel = genAI.getGenerativeModel({
                    model: modelOverride || "gemini-1.5-pro",
                    systemInstruction: systemPrompt,
                    generationConfig: { responseMimeType: "application/json" }
                });
                const promptParts: any[] = [{ text: userPrompt }];
                if (imagesPayload && Array.isArray(imagesPayload)) {
                    for (const imgBase64 of imagesPayload) {
                        if (imgBase64 && imgBase64.startsWith("data:image/")) {
                            const [meta, base64Data] = imgBase64.split(",");
                            const mimeType = meta.split(":")[1].split(";")[0];
                            promptParts.push({ inlineData: { mimeType, data: base64Data } });
                        }
                    }
                }
                const res = await imgModel.generateContent(promptParts);
                return (await res.response).text();
            }
        };

        // 3.1 Start SEO generation
        let pSEO: Promise<string>;
        if (openai) {
            const userContent: any[] = [{ type: "text", text: userPrompt }];
            if (images && Array.isArray(images)) {
                for (const imgBase64 of images) {
                    if (imgBase64 && imgBase64.startsWith("data:image/")) {
                        userContent.push({ type: "image_url", image_url: { url: imgBase64 } });
                    }
                }
            }
            pSEO = openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: GENERATION_SYSTEM_PROMPT }, { role: "user", content: userContent }],
                response_format: { type: "json_object" }
            }).then(r => r.choices[0].message.content || "");
        } else {
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-pro",
                systemInstruction: GENERATION_SYSTEM_PROMPT,
                generationConfig: { responseMimeType: "application/json" }
            });
            const promptParts: any[] = [{ text: userPrompt }];
            if (images && Array.isArray(images)) {
                for (const imgBase64 of images) {
                    if (imgBase64 && imgBase64.startsWith("data:image/")) {
                        const [meta, base64Data] = imgBase64.split(",");
                        const mimeType = meta.split(":")[1].split(";")[0];
                        promptParts.push({ inlineData: { mimeType, data: base64Data } });
                    }
                }
            }
            pSEO = model.generateContent(promptParts).then(r => r.response.text());
        }

        // 3.2 Sequential Image Pipeline
        try {
            console.log("Image Pipeline Step 1: Packaging Analysis");
            const analysisPrompt = constructImageAnalysisPrompt();
            const analysisRaw = await callVisionModel(IMAGE_GENERATION_SYSTEM_PROMPT, analysisPrompt, images);
            const analysisJson = extractJSON(analysisRaw) || {};
            packaging_analysis = analysisJson.packaging_analysis || analysisJson;

            if (packaging_analysis) {
                console.log("Image Pipeline Step 2: Parallel Moments Generation with Staggering");
                const moments = ["HERO", "BENEFITS", "LIFESTYLE", "TEXTURE", "PACK"];
                const momentPromises = moments.map(async (moment_id, idx) => {
                    // Stagger each request by 1.5 seconds to avoid Gemini 2 RPS rate limit
                    await new Promise(resolve => setTimeout(resolve, idx * 1500));
                    try {
                        const momentPrompt = constructImageMomentPrompt({
                            skuMaster,
                            features,
                            packaging_analysis,
                            moment_id
                        });
                        // Use gemini-1.5-flash for moments for 4x speed as Vercel has 60s timeout
                        const momentRaw = await callVisionModel(IMAGE_GENERATION_SYSTEM_PROMPT, momentPrompt, images, "gemini-1.5-flash");
                        let json = extractJSON(momentRaw);
                        if (json && json.visualAssets && Array.isArray(json.visualAssets)) {
                            return json.visualAssets[0];
                        }
                        if (json && Array.isArray(json) && json.length > 0) {
                            return json[0];
                        }
                        return json;
                    } catch (err) {
                        console.error(`Error generating moment ${moment_id}:`, err);
                        return null;
                    }
                });
                
                const momentResults = await Promise.all(momentPromises);
                visualAssets = momentResults.filter(Boolean);
            } else {
                console.error("No packaging analysis returned.", analysisRaw);
            }
        } catch (imgError) {
            console.error("Error in sequential image prompts", imgError);
        }

        content = await pSEO;
        if (!content) throw new Error("No content generated");

        let parsedContent = extractJSON(content);
        if (!parsedContent) throw new Error("AI returned invalid JSON format.");

        parsedContent.visualAssets = visualAssets;
        parsedContent.packaging_analysis = packaging_analysis;

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

