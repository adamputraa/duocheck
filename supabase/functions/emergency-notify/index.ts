// emergency-notify Edge Function
// Sends email alert to partner when Emergency is triggered
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
  mapLink: string | null,
  message: string | null,
  pregnancyInfoStr: string | null,
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
          from: 'DuoCare Emergency <noreply@duocheck.app>',
          to,
          subject: `🚨 Emergency Alert from ${senderName}`,
          html: `
            <h2>Emergency Alert</h2>
            <p><strong>${senderName}</strong> has sent an emergency alert.</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            ${pregnancyInfoStr ? `<p><strong>Pregnancy Info:</strong> ${pregnancyInfoStr}</p>` : ''}
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            ${mapLink ? `<p><a href="${mapLink}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Location on Map</a></p>` : ''}
            <p>Please check on them immediately or call your emergency contacts.</p>
            <hr />
            <p style="color: #6B7280; font-size: 12px;">This alert was sent by DuoCare Pregnancy Companion.</p>
          `,
        }),
      })

      if (response.ok) {
        return true
      }

      console.error(`Email attempt ${attempt} failed:`, await response.text())
      
      if (attempt < maxRetries) {
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
    const { emergency_event_id } = await req.json()

    if (!emergency_event_id) {
      return new Response(
        JSON.stringify({ error: 'missing_emergency_event_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch Emergency event
    const { data: event, error: eventError } = await supabase
      .from('emergency_events')
      .select('*')
      .eq('id', emergency_event_id)
      .single()

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'event_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find partner's email
    const { data: partnerMemberships } = await supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', event.couple_id)
      .neq('user_id', event.triggered_by)

    if (!partnerMemberships || partnerMemberships.length === 0) {
      return new Response(
        JSON.stringify({ error: 'no_partner_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const partnerId = partnerMemberships[0].user_id

    // Check if partner has email alerts enabled
    const { data: privacySettings } = await supabase
      .from('privacy_settings')
      .select('email_alerts_enabled')
      .eq('user_id', partnerId)
      .single()

    if (privacySettings && !privacySettings.email_alerts_enabled) {
        return new Response(
            JSON.stringify({ success: true, message: 'email_alerts_disabled_by_partner' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Get partner's email
    const { data: { user: partnerUser } } = await supabase.auth.admin.getUserById(partnerId)

    if (!partnerUser?.email) {
      return new Response(
        JSON.stringify({ error: 'partner_email_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', event.triggered_by)
      .single()

    // Get pregnancy profile for context
    const { data: pregProfile } = await supabase
      .from('pregnancy_profiles')
      .select('due_date, hospital_name, doctor_name')
      .eq('couple_id', event.couple_id)
      .maybeSingle()

    const senderName = senderProfile?.display_name || 'Your partner'
    const timestamp = new Date(event.created_at).toLocaleString()
    
    const mapLink = (event.include_location && event.latitude && event.longitude)
      ? `https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=15/${event.latitude}/${event.longitude}`
      : null

    let pregnancyInfoStr = null
    if (pregProfile) {
        pregnancyInfoStr = `Due ${pregProfile.due_date}`
        if (pregProfile.hospital_name) pregnancyInfoStr += `, Hospital: ${pregProfile.hospital_name}`
        if (pregProfile.doctor_name) pregnancyInfoStr += `, Dr: ${pregProfile.doctor_name}`
    }

    // Send email
    const emailSent = await sendEmailWithRetry(
      resendApiKey,
      partnerUser.email,
      senderName,
      timestamp,
      mapLink,
      event.message || null,
      pregnancyInfoStr
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
