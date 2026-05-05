// sos-notify Edge Function
// Sends email alert to partner when SOS is triggered
// Called directly from the frontend (not via database webhook)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmailWithRetry(
  resendApiKey: string,
  to: string,
  senderName: string,
  timestamp: string,
  mapLink: string,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DuoCheck SOS <noreply@duocheck.app>',
          to,
          subject: `⚠️ SOS Emergency Alert from ${senderName}`,
          html: `
            <h2>Emergency Alert</h2>
            <p><strong>${senderName}</strong> has sent an emergency alert.</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><a href="${mapLink}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Location on Map</a></p>
            <p>Please check on them immediately.</p>
            <hr />
            <p style="color: #6B7280; font-size: 12px;">This alert was sent by DuoCheck.</p>
          `,
        }),
      })

      if (response.ok) {
        return true
      }

      console.error(`Email attempt ${attempt} failed:`, await response.text())
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
      }
    } catch (error) {
      console.error(`Email attempt ${attempt} error:`, error)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
      }
    }
  }
  return false
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sosEventId } = await req.json()

    if (!sosEventId) {
      return new Response(
        JSON.stringify({ error: 'missing_sos_event_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch SOS event
    const { data: sosEvent, error: sosError } = await supabase
      .from('sos_events')
      .select('*')
      .eq('id', sosEventId)
      .single()

    if (sosError || !sosEvent) {
      return new Response(
        JSON.stringify({ error: 'sos_event_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find partner's email from same couple group (exclude sender)
    const { data: partnerMemberships } = await supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', sosEvent.couple_id)
      .neq('user_id', sosEvent.user_id)

    if (!partnerMemberships || partnerMemberships.length === 0) {
      return new Response(
        JSON.stringify({ error: 'no_partner_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const partnerId = partnerMemberships[0].user_id

    // Get partner's email from auth.users (using admin API)
    const { data: { user: partnerUser } } = await supabase.auth.admin.getUserById(partnerId)

    if (!partnerUser?.email) {
      return new Response(
        JSON.stringify({ error: 'partner_email_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get sender's display name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', sosEvent.user_id)
      .single()

    const senderName = senderProfile?.display_name || 'Your partner'
    const timestamp = new Date(sosEvent.created_at).toLocaleString()
    const mapLink = sosEvent.latitude && sosEvent.longitude
      ? `https://www.openstreetmap.org/?mlat=${sosEvent.latitude}&mlon=${sosEvent.longitude}#map=15/${sosEvent.latitude}/${sosEvent.longitude}`
      : 'Location not available'

    // Send email with retry logic
    const emailSent = await sendEmailWithRetry(
      resendApiKey,
      partnerUser.email,
      senderName,
      timestamp,
      mapLink
    )

    if (!emailSent) {
      return new Response(
        JSON.stringify({ success: false, error: 'email_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
