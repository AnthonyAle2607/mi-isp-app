import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OdooJsonRpcPayload {
  jsonrpc: string;
  method: string;
  params: Record<string, unknown>;
  id: number;
}

interface OdooResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: {
      name: string;
      debug: string;
      message: string;
    };
  };
}

// Llamada JSON-RPC estándar a Odoo
async function callOdooRpc(
  url: string,
  service: string,
  method: string,
  args: unknown[]
): Promise<unknown> {
  const endpoint = `${url}/jsonrpc`;
  
  const payload: OdooJsonRpcPayload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service,
      method,
      args,
    },
    id: Date.now(),
  };

  console.log(`Calling Odoo RPC: ${service}.${method}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Odoo HTTP error:", response.status, text);
    throw new Error(`Odoo HTTP error: ${response.status} ${response.statusText}`);
  }

  const data: OdooResponse = await response.json();

  if (data.error) {
    console.error("Odoo RPC error:", data.error);
    throw new Error(`Odoo error: ${data.error.data?.message || data.error.message}`);
  }

  return data.result;
}

// Llamada a execute_kw para operaciones en modelos
async function callOdooModel(
  url: string,
  db: string,
  uid: number,
  password: string,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<unknown> {
  return callOdooRpc(url, "object", "execute_kw", [
    db,
    uid,
    password,
    model,
    method,
    args,
    kwargs,
  ]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ODOO_URL = Deno.env.get("ODOO_URL");
    const ODOO_API_KEY = Deno.env.get("ODOO_API_KEY");

    if (!ODOO_URL) {
      throw new Error("ODOO_URL is not configured");
    }
    if (!ODOO_API_KEY) {
      throw new Error("ODOO_API_KEY is not configured");
    }

    // Extraer credenciales del URL si están incluidas o usar valores por defecto
    // Formato esperado de ODOO_URL: https://silver-data.ayniwork.com/odoo
    // El API key es la contraseña/token del usuario
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();
    console.log(`Odoo integration action: ${action}`, JSON.stringify(data || {}));

    let result: unknown;

    switch (action) {
      case "test_connection": {
        // Probar conexión obteniendo la versión
        const version = await callOdooRpc(ODOO_URL, "common", "version", []);
        result = { connected: true, version };
        break;
      }

      case "authenticate": {
        // Autenticar y obtener UID
        // data: { db: string, username: string, password?: string }
        const { db, username, password = ODOO_API_KEY } = data;
        const uid = await callOdooRpc(ODOO_URL, "common", "authenticate", [
          db,
          username,
          password,
          {},
        ]);
        result = { uid };
        break;
      }

      // ==================== CLIENTES ====================
      case "sync_customer": {
        // Sincronizar cliente de Silverdata a Odoo
        const { profile, db, uid, password = ODOO_API_KEY } = data;
        
        if (!uid) throw new Error("Se requiere UID de autenticación");
        
        // Buscar si el cliente ya existe en Odoo por cedula
        const existingIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "res.partner",
          "search",
          [[["ref", "=", profile.cedula]]],
          {}
        ) as number[];

        const partnerData = {
          name: profile.full_name,
          ref: profile.cedula,
          email: profile.email || "",
          phone: profile.phone || "",
          street: profile.address || `${profile.calle || ""} ${profile.casa || ""}`.trim(),
          city: profile.municipio || "",
          comment: `Contrato: ${profile.contract_number || "N/A"}\nPlan: ${profile.plan_type || "N/A"}\nNodo: ${profile.node || "N/A"}`,
        };

        if (existingIds.length > 0) {
          // Actualizar cliente existente
          await callOdooModel(
            ODOO_URL, db, uid, password,
            "res.partner",
            "write",
            [existingIds, partnerData],
            {}
          );
          result = { updated: true, partner_id: existingIds[0] };
        } else {
          // Crear nuevo cliente
          const partnerId = await callOdooModel(
            ODOO_URL, db, uid, password,
            "res.partner",
            "create",
            [partnerData],
            {}
          );
          result = { created: true, partner_id: partnerId };
        }
        break;
      }

      case "get_customer": {
        // Obtener cliente de Odoo por cedula
        const { cedula, db, uid, password = ODOO_API_KEY } = data;
        
        if (!uid) throw new Error("Se requiere UID de autenticación");
        
        const partnerIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "res.partner",
          "search",
          [[["ref", "=", cedula]]],
          {}
        ) as number[];

        if (partnerIds.length > 0) {
          const partners = await callOdooModel(
            ODOO_URL, db, uid, password,
            "res.partner",
            "read",
            [partnerIds, ["id", "name", "email", "phone", "street", "city", "credit", "debit"]],
            {}
          );
          result = partners;
        } else {
          result = [];
        }
        break;
      }

      case "list_customers": {
        // Listar todos los clientes
        const { db, uid, password = ODOO_API_KEY, limit = 100, offset = 0 } = data;
        
        if (!uid) throw new Error("Se requiere UID de autenticación");
        
        const partnerIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "res.partner",
          "search",
          [[["customer_rank", ">", 0]]],
          { limit, offset }
        ) as number[];

        if (partnerIds.length > 0) {
          const partners = await callOdooModel(
            ODOO_URL, db, uid, password,
            "res.partner",
            "read",
            [partnerIds, ["id", "name", "ref", "email", "phone", "credit", "debit"]],
            {}
          );
          result = partners;
        } else {
          result = [];
        }
        break;
      }

      // ==================== PRODUCTOS/PLANES ====================
      case "sync_plans": {
        // Sincronizar planes de Silverdata a productos en Odoo
        const { db, uid, password = ODOO_API_KEY } = data;
        
        if (!uid) throw new Error("Se requiere UID de autenticación");
        
        const { data: plans, error } = await supabase
          .from("service_plans")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;

        const syncResults = [];
        
        for (const plan of plans || []) {
          const productCode = `PLAN-${plan.connection_type.toUpperCase()}-${plan.speed_mbps}`;
          
          // Buscar producto existente
          const existingIds = await callOdooModel(
            ODOO_URL, db, uid, password,
            "product.product",
            "search",
            [[["default_code", "=", productCode]]],
            {}
          ) as number[];

          const productData = {
            name: plan.name,
            default_code: productCode,
            list_price: plan.monthly_price,
            type: "service",
            description: `Plan ${plan.connection_type} - ${plan.speed_mbps} Mbps`,
          };

          if (existingIds.length > 0) {
            await callOdooModel(
              ODOO_URL, db, uid, password,
              "product.product",
              "write",
              [existingIds, productData],
              {}
            );
            syncResults.push({ plan: plan.name, updated: true, product_id: existingIds[0] });
          } else {
            const productId = await callOdooModel(
              ODOO_URL, db, uid, password,
              "product.product",
              "create",
              [productData],
              {}
            );
            syncResults.push({ plan: plan.name, created: true, product_id: productId });
          }
        }
        
        result = syncResults;
        break;
      }

      case "get_products": {
        // Obtener productos/planes de Odoo
        const { db, uid, password = ODOO_API_KEY } = data;
        
        if (!uid) throw new Error("Se requiere UID de autenticación");
        
        const productIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "product.product",
          "search",
          [[["type", "=", "service"]]],
          {}
        ) as number[];

        if (productIds.length > 0) {
          const products = await callOdooModel(
            ODOO_URL, db, uid, password,
            "product.product",
            "read",
            [productIds, ["id", "name", "default_code", "list_price", "description"]],
            {}
          );
          result = products;
        } else {
          result = [];
        }
        break;
      }

      // ==================== FACTURAS ====================
      case "create_invoice": {
        // Crear factura en Odoo
        const { profile, amount, description, db, uid, password = ODOO_API_KEY } = data;

        if (!uid) throw new Error("Se requiere UID de autenticación");

        // Buscar cliente en Odoo
        const partnerIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "res.partner",
          "search",
          [[["ref", "=", profile.cedula]]],
          {}
        ) as number[];

        if (partnerIds.length === 0) {
          throw new Error("Cliente no encontrado en Odoo. Sincronícelo primero.");
        }

        const partnerId = partnerIds[0];

        const invoiceData = {
          partner_id: partnerId,
          move_type: "out_invoice",
          invoice_line_ids: [
            [0, 0, {
              name: description || "Servicio de Internet mensual",
              quantity: 1,
              price_unit: amount,
            }]
          ],
        };

        const invoiceId = await callOdooModel(
          ODOO_URL, db, uid, password,
          "account.move",
          "create",
          [invoiceData],
          {}
        );

        result = { invoice_id: invoiceId, partner_id: partnerId };
        break;
      }

      case "get_invoices": {
        // Obtener facturas de un cliente
        const { cedula, db, uid, password = ODOO_API_KEY, limit = 50 } = data;

        if (!uid) throw new Error("Se requiere UID de autenticación");

        // Buscar cliente
        const partnerIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "res.partner",
          "search",
          [[["ref", "=", cedula]]],
          {}
        ) as number[];

        if (partnerIds.length === 0) {
          result = [];
          break;
        }

        const invoiceIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "account.move",
          "search",
          [[["partner_id", "=", partnerIds[0]], ["move_type", "=", "out_invoice"]]],
          { limit }
        ) as number[];

        if (invoiceIds.length > 0) {
          const invoices = await callOdooModel(
            ODOO_URL, db, uid, password,
            "account.move",
            "read",
            [invoiceIds, ["id", "name", "invoice_date", "amount_total", "amount_residual", "state", "payment_state"]],
            {}
          );
          result = invoices;
        } else {
          result = [];
        }
        break;
      }

      // ==================== REPORTES/LECTURA ====================
      case "get_balance": {
        // Obtener balance de un cliente
        const { cedula, db, uid, password = ODOO_API_KEY } = data;
        
        if (!uid) throw new Error("Se requiere UID de autenticación");
        
        const partnerIds = await callOdooModel(
          ODOO_URL, db, uid, password,
          "res.partner",
          "search",
          [[["ref", "=", cedula]]],
          {}
        ) as number[];

        if (partnerIds.length > 0) {
          const partners = await callOdooModel(
            ODOO_URL, db, uid, password,
            "res.partner",
            "read",
            [partnerIds, ["id", "name", "credit", "debit", "credit_limit"]],
            {}
          );
          result = partners;
        } else {
          result = [];
        }
        break;
      }

      case "get_stats": {
        // Obtener estadísticas generales
        const { db, uid, password = ODOO_API_KEY } = data;
        
        if (!uid) throw new Error("Se requiere UID de autenticación");

        const totalCustomers = await callOdooModel(
          ODOO_URL, db, uid, password,
          "res.partner",
          "search_count",
          [[["customer_rank", ">", 0]]],
          {}
        );

        const pendingInvoices = await callOdooModel(
          ODOO_URL, db, uid, password,
          "account.move",
          "search_count",
          [[["move_type", "=", "out_invoice"], ["payment_state", "!=", "paid"]]],
          {}
        );

        const totalProducts = await callOdooModel(
          ODOO_URL, db, uid, password,
          "product.product",
          "search_count",
          [[["type", "=", "service"]]],
          {}
        );

        result = {
          total_customers: totalCustomers,
          pending_invoices: pendingInvoices,
          total_products: totalProducts,
        };
        break;
      }

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`Odoo action ${action} completed successfully`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Odoo integration error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Error desconocido" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
