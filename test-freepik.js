const FREEPIK_API_KEY = "FPSX6252bb30a30a099c5ef10e4a6f0fd7de";
const FREEPIK_API_URL = "https://api.freepik.com/v1";

async function testFreepik() {
    console.log("Testing Freepik Mystic API and logging response (FIXED)...");

    try {
        const response = await fetch(`${FREEPIK_API_URL}/ai/mystic`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-freepik-api-key": FREEPIK_API_KEY,
            },
            body: JSON.stringify({
                prompt: "A professional product photograph of a luxury perfume bottle on a marble table with soft morning lighting, 8k resolution.",
                image_format: "jpeg",
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("Initiation Failed:", err);
            return;
        }

        const initData = await response.json();
        const taskId = initData.data.task_id;
        console.log(`Task created: ${taskId}. Polling...`);

        // Poll for 60 seconds
        for (let i = 0; i < 15; i++) {
            const pollRes = await fetch(`${FREEPIK_API_URL}/ai/mystic/${taskId}`, {
                headers: { "x-freepik-api-key": FREEPIK_API_KEY }
            });
            const pollData = await pollRes.json();
            
            if (pollData.data && pollData.data.status) {
                const status = pollData.data.status;
                console.log(`Attempt ${i+1}: Status = ${status}`);
                
                if (status === "completed") {
                    console.log("SUCCESS! Image URL:", pollData.data.generated[0].url);
                    return;
                }
                if (status === "failed") {
                    console.error("Task failed:", pollData);
                    return;
                }
            } else {
                console.log("Unexpected response format:", pollData);
            }

            await new Promise(r => setTimeout(r, 4000));
        }

        console.log("Polling timed out.");

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testFreepik();
