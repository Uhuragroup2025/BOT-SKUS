
const { fal } = require('@fal-ai/client');
// Node v22 --env-file handles this

async function testFal() {
    process.env.FAL_KEY = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY;
    console.log('Testing FAL API with Key starting with:', process.env.FAL_KEY?.substring(0, 5));

    try {
        // Just a simple status or cheap call
        const result = await fal.subscribe("fal-ai/flux/dev", {
            input: {
                prompt: "test",
                num_images: 1,
                sync_mode: true
            },
            logs: true,
        });
        console.log('FAL API Success:', result);
    } catch (e) {
        console.error('FAL API Error:', e.message);
        if (e.status) console.error('Status:', e.status);
    }
}

testFal();
