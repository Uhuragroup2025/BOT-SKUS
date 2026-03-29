import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const FREEPIK_API_URL = "https://api.freepik.com/v1";

// Polling moved to client-side to prevent Vercel Serverless Timeouts

export async function POST(req: Request) {
    console.log(">>> GENERATE IMAGE API HIT (FREEPIK MYSTIC) <<<");

    // 1. Authenticate User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Unauthorized access attempt to create-image API");
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { prompt, referenceImage, taskId } = body;

        const apiKey = process.env.FREEPIK_API_KEY;
        if (!apiKey) {
            console.error("FREEPIK_API_KEY is missing from environment variables");
            throw new Error("FREEPIK_API_KEY is not configured.");
        }

        // If taskId is provided, we are polling an existing task
        if (taskId) {
            const res = await fetch(`${FREEPIK_API_URL}/ai/mystic/${taskId}`, {
                headers: { "x-freepik-api-key": apiKey },
            });

            if (!res.ok) throw new Error(`Failed to poll task: ${res.statusText}`);

            const data = await res.json();
            const status = data.data.status?.toLowerCase();

            if (status === "completed") {
                const imageUrl = data.data.generated[0]?.url;
                if (!imageUrl) throw new Error("Completed but no URL returned.");
                
                // Fetch image and convert to base64
                const imageRes = await fetch(imageUrl);
                if (!imageRes.ok) throw new Error("Failed to fetch resulting image");
                const arrayBuffer = await imageRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64Str = `data:${imageRes.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;
                
                return NextResponse.json({ status: "completed", image: base64Str });
            } else if (status === "failed") {
                return NextResponse.json({ status: "failed", error: "Freepik task failed to generate." });
            } else {
                return NextResponse.json({ status: "processing" });
            }
        }

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // ... otherwise initiate new task
        const mysticPayload: any = {
            prompt: prompt,
            image_format: "jpeg",
        };

        if (referenceImage) {
            const base64Data = referenceImage.includes(",") 
                ? referenceImage.split(",")[1] 
                : referenceImage;
            mysticPayload.structure_reference = {
                image: base64Data,
                strength: 0.8
            };
        }

        console.log("Sending request to Freepik Mystic...");
        const response = await fetch(`${FREEPIK_API_URL}/ai/mystic`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-freepik-api-key": apiKey,
            },
            body: JSON.stringify(mysticPayload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Freepik API returned ${response.status}`);
        }

        const initData = await response.json();
        const newTaskId = initData.data.task_id;

        if (!newTaskId) throw new Error("No task_id returned from Freepik API.");

        return NextResponse.json({ status: "processing", taskId: newTaskId });

    } catch (error: any) {
        console.error("------------------------------------------------");
        console.error("Freepik Generate Image Error Details:");
        console.error("Message:", error.message);
        console.error("------------------------------------------------");

        return NextResponse.json(
            { error: error.message || "Failed to generate image with Freepik" },
            { status: 500 }
        );
    }
}
