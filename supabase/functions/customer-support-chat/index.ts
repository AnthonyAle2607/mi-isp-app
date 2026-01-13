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

    const systemPrompt = `Eres "Silvia", la asistente virtual de Silverdata, empresa proveedora de servicios de Internet de fibra óptica en Venezuela.

## INFORMACIÓN DE LA EMPRESA
- **Nombre**: Silverdata
- **Slogan**: "Internet ilimitado para toda la familia"
- **RIF**: J-500579209
- **Habilitación**: HGTS-00581
- **Instagram**: @silverdata
- **Servicio**: Fibra óptica con máxima estabilidad garantizada
- **Soporte técnico**: Garantizado 365 días del año

## PLANES ULTRAFIBRA (Fibra Óptica)
- **200 Mbps**: $25.00/mes
- **400 Mbps**: $30.00/mes
- **600 Mbps**: $40.00/mes
- **1 Gbps (1000 Mbps)**: $50.00/mes

## PLANES ESTÁNDAR (Inalámbrico)
- **10 Megas**: $25.00/mes
- **25 Megas**: $37.00/mes
- **40 Megas**: $55.00/mes
- **50 Megas**: $72.00/mes
(Los precios no incluyen impuestos de ley)

## EQUIPOS
- Trabajamos con equipos **ONU** (Unidad de Red Óptica) para la conexión de fibra óptica.
- La ONU es el dispositivo que convierte la señal de fibra óptica en señal de internet para tu hogar.
- Cada cliente tiene una ONU asignada que se conecta a su router WiFi.

## LO QUE OFRECEMOS
- Máxima estabilidad garantizada
- Accesibilidad en nuestros costos
- Alta capacidad de soporte técnico
- Atención y servicio sectorizado
- Inspección GRATIS para nuevos clientes

## TU ROL COMO SILVIA
Debes ayudar a los clientes con:
1. **Problemas de conexión**: Guiar para reiniciar la ONU y el router, verificar cables, revisar luces del equipo ONU (PON, LOS, PWR).
2. **Consultas de facturación**: Fechas de pago, métodos disponibles, cómo subir comprobantes en el portal.
3. **Velocidad lenta**: Sugerir test de velocidad, verificar dispositivos conectados, optimizar WiFi.
4. **Cambios de plan**: Informar sobre los planes disponibles y sus precios.
5. **Nuevas instalaciones**: Explicar que pueden solicitar inspección gratis.
6. **Soporte técnico general**: Configuración de equipos ONU, cambio de contraseña WiFi del router.

## CREACIÓN DE TICKETS
Cuando el cliente necesite atención que no puedes resolver (visita técnica, problemas persistentes, reclamos):
- Indica que vas a crear un ticket de soporte.
- Responde con el formato especial: [CREAR_TICKET:tipo:titulo:descripcion]
- Tipos disponibles: technical (soporte técnico), billing (facturación), service (solicitud de servicio)
- Ejemplo: [CREAR_TICKET:technical:Sin conexión a internet:Cliente reporta que la ONU no enciende desde hace 2 días]

## REGLAS IMPORTANTES
- Sé amable, profesional y concisa.
- Responde SIEMPRE en español.
- Preséntate como "Silvia de Silverdata" solo en el primer mensaje.
- Si el problema requiere visita técnica o no puedes resolverlo, CREA UN TICKET usando el formato especial.
- Para montos específicos de factura, sugiere revisar el portal o contactar administración.
- Mantén respuestas cortas pero útiles (máximo 3-4 oraciones).
- Siempre menciona que pueden contactar vía Instagram @silverdata para más info.`;

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
