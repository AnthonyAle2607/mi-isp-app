import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      // Upload payment receipt
      const formData = await req.formData()
      const file = formData.get('file') as File
      const amount = formData.get('amount') as string
      const paymentDate = formData.get('payment_date') as string
      const userId = formData.get('user_id') as string

      if (!file || !amount || !paymentDate || !userId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and PDF are allowed.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Failed to upload file' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName)

      // Save receipt record to database
      const { data: receiptData, error: receiptError } = await supabase
        .from('payment_receipts')
        .insert({
          user_id: userId,
          receipt_url: urlData.publicUrl,
          amount: parseFloat(amount),
          payment_date: paymentDate,
          verification_status: 'pending'
        })
        .select()
        .single()

      if (receiptError) {
        console.error('Receipt save error:', receiptError)
        return new Response(
          JSON.stringify({ error: 'Failed to save receipt record' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          message: 'Receipt uploaded successfully',
          receipt: receiptData
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'GET') {
      // Get user's payment receipts
      const url = new URL(req.url)
      const userId = url.searchParams.get('user_id')

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: receipts, error: receiptsError } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (receiptsError) {
        console.error('Receipts fetch error:', receiptsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch receipts' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ receipts }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'PUT') {
      // Update receipt verification status (admin only)
      const { receipt_id, verification_status, admin_notes } = await req.json()

      if (!receipt_id || !verification_status) {
        return new Response(
          JSON.stringify({ error: 'Receipt ID and verification status are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: updatedReceipt, error: updateError } = await supabase
        .from('payment_receipts')
        .update({
          verification_status,
          admin_notes: admin_notes || null
        })
        .eq('id', receipt_id)
        .select()
        .single()

      if (updateError) {
        console.error('Receipt update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update receipt' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          message: 'Receipt updated successfully',
          receipt: updatedReceipt
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})