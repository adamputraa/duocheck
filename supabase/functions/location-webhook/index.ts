// location-webhook Edge Function
// Accepts location updates from iPhone Shortcuts app

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, latitude, longitude, accuracy, status, source } = await req.json()

    // Validate token
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find user by shortcut token
    const { data: settings, error: settingsError } = await supabase
      .from('sharing_settings')
      .select('user_id, sharing_enabled')
      .eq('shortcut_token', token)
      .single()

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check sharing enabled
    if (!settings.sharing_enabled) {
      return new Response(
        JSON.stringify({ error: 'sharing_disabled' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: 'missing_coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find user's couple
    const { data: membership, error: membershipError } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', settings.user_id)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'not_in_couple' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert location update
    const { error: insertError } = await supabase
      .from('location_updates')
      .insert({
        couple_id: membership.couple_id,
        user_id: settings.user_id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        status: status || 'Manual Check-In',
        source: source || 'ios_shortcut',
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'insert_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Location updated' }),
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
