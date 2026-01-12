import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente virtual de soporte técnico para una empresa proveedora de servicios de Internet (ISP).
Tu nombre es "ISP Assistant" y debes ayudar a los clientes con:

1. **Problemas de conexión**: Guiar al cliente para reiniciar el router, verificar cables, comprobar luces del equipo.
2. **Consultas de facturación**: Explicar fechas de pago, métodos de pago disponibles, cómo subir comprobantes.
3. **Velocidad lenta**: Sugerir pruebas de velocidad, verificar dispositivos conectados, optimización de WiFi.
4. **Cambios de plan**: Informar sobre planes disponibles y proceso de cambio.
5. **Soporte técnico general**: Ayudar con configuración de equipos, cambio de contraseña WiFi, etc.

Reglas importantes:
- Sé amable, profesional y conciso.
- Responde siempre en español.
- Si el problema requiere intervención técnica presencial, indica que crearán un ticket de soporte.
- Para temas de facturación específicos (montos, fechas exactas), sugiere revisar el panel de usuario o contactar a administración.
- Si no puedes resolver algo, ofrece crear un ticket de soporte para seguimiento humano.
- Mantén respuestas cortas pero útiles (máximo 3-4 oraciones por respuesta).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Servicio no disponible temporalmente." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
