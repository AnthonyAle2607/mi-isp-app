import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cedula } = await req.json();

    if (!cedula || typeof cedula !== "string" || cedula.length < 6) {
      return new Response(
        JSON.stringify({ error: "Cédula inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up profile by cedula
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, contract_number")
      .eq("cedula", cedula)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "No se encontró un contrato con esa cédula" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);

    if (authError || !authUser?.user?.email) {
      return new Response(
        JSON.stringify({ error: "No se encontró el email del usuario" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = authUser.user.email;

    // Send password recovery email via Supabase Auth
    const recoveryResponse = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({ email }),
    });

    if (!recoveryResponse.ok) {
      const errText = await recoveryResponse.text();
      console.error("Recovery email error:", errText);
      return new Response(
        JSON.stringify({ error: "Error al enviar el correo de recuperación" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await recoveryResponse.text();

    // Mask email for display
    const [localPart, domain] = email.split("@");
    const maskedEmail = localPart.substring(0, 2) + "***@" + domain;

    return new Response(
      JSON.stringify({
        success: true,
        full_name: profile.full_name,
        contract_number: profile.contract_number,
        masked_email: maskedEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
