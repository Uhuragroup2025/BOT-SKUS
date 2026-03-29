import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Restricted to Uhura Group team emails for safety
    if (!user || !user.email?.endsWith("@uhuragroup.com")) {
        console.error("Unauthorized attempt to add credits by", user?.email);
        return NextResponse.json(
            { error: "No autorizado. Solo personal de Uhura Group puede usar esta herramienta." }, 
            { status: 401 }
        );
    }

    console.log(`>>> EJECTUTANDO ASIGNACION DE CREDITOS PARA: ${user.email} <<<`);

    const { data, error } = await supabase
        .from('profiles')
        .update({ credits: 5000 })
        .eq('id', user.id)
        .select();

    if (error) {
        console.error("Error updating credits:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
        message: "¡Perfecto! Se han asignado 5000 créditos a tu cuenta de Uhura.", 
        user: user.email,
        new_credits: 5000,
        tutorial: "Ahora simplemente vuelve al Dashboard y refresca la página para ver el cambio."
    });
}
