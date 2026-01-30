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

      case "list_databases": {
        // Listar bases de datos disponibles en la instancia
        try {
          const databases = await callOdooRpc(ODOO_URL, "db", "list", []);
          result = { databases };
        } catch (error) {
          // Algunas instancias deshabilitan el listado de DBs por seguridad
          console.log("Database listing disabled or error:", error);
          result = { databases: [], error: "El listado de bases de datos está deshabilitado en esta instancia" };
        }
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

      // ==================== CLIENTES (SOLO LECTURA) ====================
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

      // ==================== PRODUCTOS/PLANES (SOLO LECTURA) ====================
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

      // ==================== IMPORTAR A SILVERDATA ====================
      case "import_customer_to_silverdata": {
        // Importar cliente de Odoo hacia Silverdata (crear usuario + perfil)
        const { customer } = data;
        
        if (!customer) throw new Error("Se requiere información del cliente");
        
        // Verificar si ya existe un perfil con esa cédula
        const cedula = customer.ref || null;
        
        if (cedula) {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("cedula", cedula)
            .maybeSingle();

          if (existingProfile) {
            result = { skipped: true, reason: "Cliente ya existe en Silverdata" };
            break;
          }
        }

        // Generar un email temporal si no tiene
        const email = customer.email || `cliente_${customer.id}@silverdata.local`;
        
        // Crear usuario en auth (usando la edge function existente o directamente)
        // Por ahora solo creamos el perfil con datos de Odoo
        // El usuario se creará cuando intente acceder
        
        // Crear perfil directamente
        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: crypto.randomUUID(), // Temporal - se actualizará cuando se cree el usuario real
            full_name: customer.name || "Sin nombre",
            cedula: cedula,
            cedula_type: "V",
            phone: customer.phone || null,
            address: customer.street || null,
            municipio: customer.city || null,
            pending_balance: customer.credit || 0,
            account_status: "active",
          })
          .select()
          .single();

        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw new Error(`Error al crear perfil: ${profileError.message}`);
        }

        console.log(`Customer imported: ${customer.name} -> Profile ID: ${newProfile.id}`);
        result = { imported: true, profile_id: newProfile.id };
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
