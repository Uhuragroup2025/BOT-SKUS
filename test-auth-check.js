const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywbjtrawbjgprnuqxzcl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Ymp0cmF3YmpncHJudXF4emNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjEwMDAsImV4cCI6MjA4NDA5NzAwMH0.cBTciEBfyCem9lnjsv4WS7A3w4XmJeUNuq-aUfLrQ8c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthCheck() {
    const { data, error } = await supabase.auth.signInWithOtp({
        email: 'testnonexistent@example.com',
        options: {
            shouldCreateUser: false
        }
    });
    console.log("Not existing:", { data, error });

    const { data: data2, error: error2 } = await supabase.auth.signInWithOtp({
        email: 'design@uhuragroup.com',
        options: {
            shouldCreateUser: false
        }
    });
    console.log("Existing:", { data2, error2 });
}

testAuthCheck();
