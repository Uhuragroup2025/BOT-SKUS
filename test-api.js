// Node v22 has native fetch

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'test' })
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', data);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
