import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-suspend check...');

    // Check if today is the 5th of the month
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    console.log(`Current date: ${today.toISOString()}, Day of month: ${dayOfMonth}`);

    if (dayOfMonth !== 5) {
      console.log('Not the 5th of the month, skipping suspension check');
      return new Response(
        JSON.stringify({ 
          message: 'Auto-suspend only runs on the 5th of each month',
          currentDate: today.toISOString(),
          dayOfMonth
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Get start of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    console.log(`Checking for accounts without payment since: ${startOfMonth.toISOString()}`);

    // Find active accounts that haven't paid this month
    const { data: unpaidProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, full_name, account_status, last_payment_date')
      .eq('account_status', 'active')
      .or(`last_payment_date.is.null,last_payment_date.lt.${startOfMonth.toISOString()}`);

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${unpaidProfiles?.length || 0} accounts to suspend`);

    if (!unpaidProfiles || unpaidProfiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No accounts to suspend',
          checkedDate: today.toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Suspend accounts
    const userIds = unpaidProfiles.map(p => p.user_id);
    
    const { data: updatedProfiles, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        account_status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .in('user_id', userIds)
      .select();

    if (updateError) {
      console.error('Error updating profiles:', updateError);
      throw updateError;
    }

    console.log(`Successfully suspended ${updatedProfiles?.length || 0} accounts`);

    return new Response(
      JSON.stringify({ 
        message: 'Auto-suspend completed successfully',
        suspendedCount: updatedProfiles?.length || 0,
        suspendedAccounts: unpaidProfiles.map(p => ({
          userId: p.user_id,
          name: p.full_name,
          lastPayment: p.last_payment_date
        })),
        executionDate: today.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in auto-suspend function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
