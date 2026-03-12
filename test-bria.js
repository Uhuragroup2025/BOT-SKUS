
const { fal } = require('@fal-ai/client');

async function testFalBria() {
    process.env.FAL_KEY = process.env.FAL_KEY || "aef5d5d6-3ab5-4b0a-8d83-5f4d1b152f93:3661c454d86601074e3604d7ef7d0bce";
    console.log('Testing FAL API (Bria Product Shot) with Key starting with:', process.env.FAL_KEY?.substring(0, 5));

    try {
        const result = await fal.subscribe("fal-ai/bria/product-shot", {
            input: {
                image_url: "https://storage.googleapis.com/falserverless/model_tests/bria/product-shot/input.jpg",
                scene_description: "a minimalist wooden table",
            },
            logs: true,
        });
        console.log('FAL API Success:', result);
    } catch (e) {
        console.error('FAL API Error:', e.message);
        if (e.status) console.error('Status:', e.status);
    }
}

testFalBria();
