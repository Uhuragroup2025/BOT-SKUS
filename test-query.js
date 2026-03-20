const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywbjtrawbjgprnuqxzcl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Ymp0cmF3YmpncHJudXF4emNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjEwMDAsImV4cCI6MjA4NDA5NzAwMH0.cBTciEBfyCem9lnjsv4WS7A3w4XmJeUNuq-aUfLrQ8c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', 'design@uhuragroup.com');
    console.log("Data:", data);
    console.log("Error:", error);
}

check();
