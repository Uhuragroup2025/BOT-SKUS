import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const FREEPIK_API_URL = "https://api.freepik.com/v1";

/**
 * Polls the Freepik task status until it's completed or fails.
 */
async function pollFreepikTask(taskId: string, apiKey: string) {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 120 seconds
    const interval = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
        const res = await fetch(`${FREEPIK_API_URL}/ai/mystic/${taskId}`, {
            headers: {
                "x-freepik-api-key": apiKey,
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to poll task status: ${res.statusText}`);
        }

        const data = await res.json();
        const status = data.data.status?.toLowerCase();

        if (status === "completed") {
            return data.data.generated[0]?.url;
        }

        if (status === "failed") {
            throw new Error("Freepik task failed.");
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error("Freepik task timed out.");
}

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
        const { prompt, referenceImage, aspect_ratio = "16:9" } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.FREEPIK_API_KEY;
        if (!apiKey) {
            console.error("FREEPIK_API_KEY is missing from environment variables");
            throw new Error("FREEPIK_API_KEY is not configured.");
        }

        // Prepare Mystic request
        const mysticPayload: any = {
            prompt: prompt,
            image_format: "jpeg",
        };

        // Handle structural reference if an image is provided
        if (referenceImage) {
            console.log("Using product image as structure reference...");
            // Extract pure base64 if it has the data URI prefix
            const base64Data = referenceImage.includes(",") 
                ? referenceImage.split(",")[1] 
                : referenceImage;
            
            mysticPayload.structure_reference = {
                image: base64Data,
                strength: 0.8 // High strength to preserve product shape
            };
        }

        // 2. Initiate Image Generation
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
            console.error("Freepik API Error:", errorData);
            throw new Error(errorData.message || `Freepik API returned ${response.status}`);
        }

        const initData = await response.json();
        const taskId = initData.data.task_id;

        if (!taskId) {
            throw new Error("No task_id returned from Freepik API.");
        }

        console.log(`Task initiated: ${taskId}. Polling for result...`);

        // 3. Poll for result
        const imageUrl = await pollFreepikTask(taskId, apiKey);

        if (!imageUrl) {
            throw new Error("Freepik did not return an image URL.");
        }

        console.log("Image generated successfully:", imageUrl);

        // 4. Fetch the image and convert to base64 for frontend compatibility
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) {
            throw new Error(`Failed to fetch the resulting image from ${imageUrl}`);
        }

        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Str = `data:${imageRes.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;

        return NextResponse.json({
            image: base64Str
        });

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
