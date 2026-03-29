const fs = require('fs');

let content = fs.readFileSync('app/api/generate/route.ts', 'utf8');

content = content.replace(
    'import { constructUserPrompt, GENERATION_SYSTEM_PROMPT, constructImagePrompt, IMAGE_GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";',
    'import { constructUserPrompt, GENERATION_SYSTEM_PROMPT, constructImageAnalysisPrompt, constructImageMomentPrompt, IMAGE_GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";'
);

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('let content = "";'));
const endIdx = lines.findIndex(l => l.includes('parsedContent.packaging_analysis = parsedImageContent.packaging_analysis || null;'));

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `        let content = "";
        let visualAssets: any[] = [];
        let packaging_analysis: any = null;

        const extractJSON = (text: string) => {
            let clean = text.trim();
            const match = clean.match(/\\{[\\s\\S]*\\}/);
            if (match) clean = match[0];
            else if (clean.startsWith("\`\`\`json")) clean = clean.replace(/^\`\`\`json\\n?/, "").replace(/\\n?\`\`\`$/, "");
            else if (clean.startsWith("\`\`\`")) clean = clean.replace(/^\`\`\`\\n?/, "").replace(/\\n?\`\`\`$/, "");
            try { return JSON.parse(clean); } catch(e) { console.error("ExtractJSON failed on:", clean); return null; }
        };

        const callVisionModel = async (systemPrompt: string, userPrompt: string, imagesPayload: any) => {
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
                    model: "gemini-1.5-pro",
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
                console.log("Image Pipeline Step 2: Parallel Moments Generation");
                const moments = ["HERO", "BENEFITS", "LIFESTYLE", "TEXTURE", "PACK"];
                const momentPromises = moments.map(async (moment_id) => {
                    const momentPrompt = constructImageMomentPrompt({
                        skuMaster,
                        features,
                        packaging_analysis,
                        moment_id
                    });
                    const momentRaw = await callVisionModel(IMAGE_GENERATION_SYSTEM_PROMPT, momentPrompt, images);
                    return extractJSON(momentRaw);
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
        parsedContent.packaging_analysis = packaging_analysis;`;

    lines.splice(startIdx, endIdx - startIdx + 1, replacement);
    fs.writeFileSync('app/api/generate/route.ts', lines.join('\n'));
    console.log("Replacement successful.");
} else {
    console.error("Could not find boundaries.");
}
