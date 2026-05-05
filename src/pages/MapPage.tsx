/**
 * Full Map page for DuoCheck.
 * Displays own and partner's last shared location on a full-screen Leaflet map
 * using the FullMapView component. Shows SOS events and sharing status.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { useRealtimeLocation } from '@/hooks/useRealtimeLocation'
import { supabase } from '@/lib/supabase'
import FullMapView from '@/components/FullMapView'
import { ArrowLeft } from 'lucide-react'

export default function MapPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { partner, partnerSettings } = useCouple()
  const { partnerLocation, ownLocation, sosEvents } = useRealtimeLocation()
  const [sharingEnabled, setSharingEnabled] = useState(true)
  const [staleThresholdHours, setStaleThresholdHours] = useState(3)

  // Fetch own sharing settings for stale threshold
  useEffect(() => {
    if (!user) return

    async function fetchSettings() {
      const { data } = await supabase
        .from('sharing_settings')
        .select('sharing_enabled, stale_threshold_hours')
        .eq('user_id', user!.id)
        .single()

      if (data) {
        setSharingEnabled(data.sharing_enabled)
        setStaleThresholdHours(data.stale_threshold_hours ?? 3)
      }
    }

    fetchSettings()
  }, [user])

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      {/* Header with back button and sharing status */}
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, #D97756 0%, #B85C38 100%)',
        }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-11 h-11 rounded-full active:bg-white/20 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-white">Map</h1>
          {partnerSettings && (
            <p className={`text-xs ${partnerSettings.sharing_enabled ? 'text-green-200' : 'text-white/60'}`}>
              {partnerSettings.sharing_enabled ? 'Partner sharing ON' : 'Partner sharing OFF'}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            sharingEnabled
              ? 'bg-success/20 text-green-100'
              : 'bg-white/20 text-white/60'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${sharingEnabled ? 'bg-success' : 'bg-white/60'}`}
          />
          {sharingEnabled ? 'Sharing ON' : 'Sharing OFF'}
        </span>
      </header>

      {/* Full-screen map */}
      <FullMapView
        ownLocation={ownLocation}
        partnerLocation={partnerLocation}
        sosEvents={sosEvents.map((e) => ({
          latitude: e.latitude,
          longitude: e.longitude,
          user_id: e.user_id,
          created_at: e.created_at,
        }))}
        ownName="You"
        partnerName={partner?.display_name || 'Partner'}
        staleThresholdHours={staleThresholdHours}
      />
    </div>
  )
}
