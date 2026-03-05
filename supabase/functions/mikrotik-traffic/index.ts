import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate with a shared secret (the agent sends this)
    const authHeader = req.headers.get("x-agent-key");
    const agentKey = Deno.env.get("MIKROTIK_AGENT_KEY");

    if (!agentKey) {
      return new Response(JSON.stringify({ error: "MIKROTIK_AGENT_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (authHeader !== agentKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, data } = await req.json();

    if (action === "push_realtime") {
      // Receive array of { ip_address, download_mbps, upload_mbps, is_online }
      const records = data.records as Array<{
        ip_address: string;
        download_mbps: number;
        upload_mbps: number;
        is_online: boolean;
      }>;

      if (!records || records.length === 0) {
        return new Response(JSON.stringify({ error: "No records provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();
      const trafficRows = records.map(r => ({
        ip_address: r.ip_address,
        download_mbps: r.download_mbps,
        upload_mbps: r.upload_mbps,
        is_online: r.is_online,
        recorded_at: now,
      }));

      const { error: insertError } = await supabase
        .from("client_traffic")
        .insert(trafficRows);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clean old real-time data (keep only last 5 minutes)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from("client_traffic")
        .delete()
        .lt("recorded_at", fiveMinAgo);

      return new Response(JSON.stringify({ success: true, inserted: records.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "push_daily") {
      // Receive array of { ip_address, download_gb, upload_gb, peak_download_mbps, peak_upload_mbps }
      const records = data.records as Array<{
        ip_address: string;
        download_gb: number;
        upload_gb: number;
        peak_download_mbps: number;
        peak_upload_mbps: number;
      }>;

      if (!records || records.length === 0) {
        return new Response(JSON.stringify({ error: "No records provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const today = new Date().toISOString().split("T")[0];

      for (const r of records) {
        const { data: existing } = await supabase
          .from("client_traffic_daily")
          .select("id, download_gb, upload_gb, peak_download_mbps, peak_upload_mbps")
          .eq("ip_address", r.ip_address)
          .eq("date", today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("client_traffic_daily")
            .update({
              download_gb: r.download_gb,
              upload_gb: r.upload_gb,
              peak_download_mbps: Math.max(existing.peak_download_mbps, r.peak_download_mbps),
              peak_upload_mbps: Math.max(existing.peak_upload_mbps, r.peak_upload_mbps),
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("client_traffic_daily")
            .insert({
              ip_address: r.ip_address,
              date: today,
              download_gb: r.download_gb,
              upload_gb: r.upload_gb,
              peak_download_mbps: r.peak_download_mbps,
              peak_upload_mbps: r.peak_upload_mbps,
            });
        }
      }

      return new Response(JSON.stringify({ success: true, processed: records.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_status") {
      // Return latest traffic for all IPs (for admin dashboard)
      const { data: latest, error } = await supabase
        .from("client_traffic")
        .select("*")
        .gte("recorded_at", new Date(Date.now() - 30 * 1000).toISOString())
        .order("recorded_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deduplicate: keep only latest per IP
      const byIp = new Map<string, typeof latest[0]>();
      for (const row of latest || []) {
        if (!byIp.has(row.ip_address)) {
          byIp.set(row.ip_address, row);
        }
      }

      return new Response(JSON.stringify({ success: true, data: Array.from(byIp.values()) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
