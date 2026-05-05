/**
 * Dashboard page for DuoCheck.
 * Main hub showing partner's last shared location, quick actions,
 * SOS alerts, map preview, and recent activity feed.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { useLocation } from '@/hooks/useLocation'
import { useRealtimeLocation } from '@/hooks/useRealtimeLocation'
import { supabase } from '@/lib/supabase'
import { getCurrentPosition } from '@/lib/location'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import QuickActionGrid from '@/components/QuickActionGrid'
import PartnerStatusCard from '@/components/PartnerStatusCard'
import LocationMapPreview from '@/components/LocationMapPreview'
import ActivityFeed from '@/components/ActivityFeed'
import SOSBanner from '@/components/SOSBanner'
import LoadingCard from '@/components/LoadingCard'

interface SharingSettings {
  sharing_enabled: boolean
  stale_threshold_hours: number
  shortcut_token: string | null
}

interface ActivityItem {
  user_id: string
  status: string
  source: string
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { couple, partner, partnerSettings, loading: coupleLoading } = useCouple()
  const { shareLocation, loading: sharingLocation } = useLocation()
  const { partnerLocation, ownLocation, sosEvents, refresh } = useRealtimeLocation()
  const navigate = useNavigate()

  const [ownSettings, setOwnSettings] = useState<SharingSettings | null>(null)
  const [sosLoading, setSosLoading] = useState(false)
  const [sosError, setSosError] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Fetch own sharing settings
  useEffect(() => {
    if (!user) return

    async function fetchSettings() {
      const { data } = await supabase
        .from('sharing_settings')
        .select('sharing_enabled, stale_threshold_hours, shortcut_token')
        .eq('user_id', user!.id)
        .single()

      if (data) {
        setOwnSettings(data as SharingSettings)
      }
    }

    fetchSettings()
  }, [user])

  // Fetch recent activities (last 5 from couple)
  useEffect(() => {
    if (!user || !couple) return

    async function fetchActivities() {
      const { data } = await supabase
        .from('location_updates')
        .select('user_id, status, source, created_at')
        .eq('couple_id', couple!.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) {
        setActivities(data as ActivityItem[])
      }
    }

    fetchActivities()
  }, [user, couple, sosEvents, partnerLocation, ownLocation])

  const sharingEnabled = ownSettings?.sharing_enabled ?? true
  const staleThresholdHours = ownSettings?.stale_threshold_hours ?? 3

  // Handle check-in from QuickActionGrid
  const handleCheckIn = async (status: string) => {
    await shareLocation(status, 'web')
    await refresh()
    // Re-fetch activities after check-in
    if (couple) {
      const { data } = await supabase
        .from('location_updates')
        .select('user_id, status, source, created_at')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) {
        setActivities(data as ActivityItem[])
      }
    }
  }

  // Handle SOS from QuickActionGrid
  const handleSOS = async () => {
    if (!user || !couple) return
    setSosLoading(true)
    setSosError(null)

    try {
      const position = await getCurrentPosition()
      const { latitude, longitude, accuracy } = position.coords

      // Insert SOS event with resolved_at = null (active)
      const { error: insertError } = await supabase.from('sos_events').insert({
        user_id: user.id,
        couple_id: couple.id,
        latitude,
        longitude,
        accuracy,
        resolved_at: null,
      })

      if (insertError) {
        setSosError('Failed to send SOS. Please try again.')
      }

      // Try to invoke SOS notify edge function
      try {
        await supabase.functions.invoke('sos-notify', {
          body: {
            user_id: user.id,
            couple_id: couple.id,
            latitude,
            longitude,
          },
        })
      } catch {
        // Show warning about email failure but don't block
        setSosError('SOS sent but email notification may have failed. Your partner will see it in the app.')
      }

      await refresh()
    } catch (err) {
      setSosError(
        err instanceof Error ? err.message : 'Failed to send SOS. Please try again.'
      )
    } finally {
      setSosLoading(false)
    }
  }

  // Handle "I'm Safe" resolve for SOS events
  const handleResolveSOS = async (sosEventId: string) => {
    const { error } = await supabase
      .from('sos_events')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', sosEventId)

    if (!error) {
      await refresh()
    }
  }

  // Handle navigate from QuickActionGrid
  const handleNavigate = (route: string) => {
    navigate(route)
  }

  if (coupleLoading) {
    return (
      <div className="min-h-dvh bg-cream pb-24">
        <AppHeader sharingEnabled={true} />
        <main className="max-w-lg mx-auto px-4 py-6">
          <LoadingCard message="Loading dashboard…" />
        </main>
        <BottomNav activeRoute="/dashboard" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      {/* Orange gradient header with sharing status */}
      <AppHeader
        sharingEnabled={sharingEnabled}
        onSettingsClick={() => navigate('/settings')}
      />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* SOS Alert Banners — show for each active SOS event */}
        {sosEvents.map((event) => (
          <SOSBanner
            key={event.id}
            senderName={
              event.user_id === user?.id
                ? 'You'
                : partner?.display_name || 'Your partner'
            }
            isSender={event.user_id === user?.id}
            onResolve={() => handleResolveSOS(event.id)}
          />
        ))}

        {/* SOS error feedback */}
        {sosError && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
            <p className="text-sm text-amber-800">{sosError}</p>
          </div>
        )}

        {/* Partner Status Card */}
        {partner && (
          <PartnerStatusCard
            partner={partner}
            partnerLocation={partnerLocation}
            partnerSettings={partnerSettings}
            staleThresholdHours={staleThresholdHours}
            onViewMap={() => navigate('/map')}
          />
        )}

        {/* Location Map Preview */}
        <LocationMapPreview
          ownLocation={ownLocation}
          partnerLocation={partnerLocation}
          ownName="You"
          partnerName={partner?.display_name || 'Partner'}
          onViewFullMap={() => navigate('/map')}
        />

        {/* Quick Action Grid (2x3) */}
        <QuickActionGrid
          onCheckIn={handleCheckIn}
          onSOS={handleSOS}
          onNavigate={handleNavigate}
          loading={sharingLocation || sosLoading}
        />

        {/* Recent Activity Feed (last 5 check-ins) */}
        <ActivityFeed
          activities={activities}
          currentUserId={user?.id || ''}
          partnerName={partner?.display_name || 'Partner'}
          onViewAll={() => navigate('/history')}
        />
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeRoute="/dashboard" />
    </div>
  )
}
