/**
 * Location History page for DuoCheck.
 * Shows own check-in history grouped by date using the HistoryTimeline component.
 * Only shows the current user's own history.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import HistoryTimeline from '@/components/HistoryTimeline'
import BottomNav from '@/components/BottomNav'
import LoadingCard from '@/components/LoadingCard'
import AppHeader from '@/components/AppHeader'

interface LocationRecord {
  id: string
  status: string
  source: string
  accuracy: number | null
  created_at: string
  latitude: number
  longitude: number
}

export default function HistoryPage() {
  const { user } = useAuth()
  const { couple } = useCouple()
  const [records, setRecords] = useState<LocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sharingEnabled, setSharingEnabled] = useState(true)

  // Fetch own sharing settings
  useEffect(() => {
    if (!user) return

    async function fetchSettings() {
      const { data } = await supabase
        .from('sharing_settings')
        .select('sharing_enabled')
        .eq('user_id', user!.id)
        .single()

      if (data) {
        setSharingEnabled(data.sharing_enabled)
      }
    }

    fetchSettings()
  }, [user])

  // Fetch own location history only
  useEffect(() => {
    async function fetchHistory() {
      if (!user || !couple) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('location_updates')
        .select('id, status, source, accuracy, created_at, latitude, longitude')
        .eq('user_id', user.id)
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching history:', error)
      } else if (data) {
        setRecords(data as LocationRecord[])
      }

      setLoading(false)
    }

    fetchHistory()
  }, [user, couple])

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader sharingEnabled={sharingEnabled} />

      <main className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-lg font-bold text-text-dark mb-4">My History</h2>

        {loading ? (
          <LoadingCard message="Loading history…" />
        ) : (
          <HistoryTimeline records={records} />
        )}
      </main>

      <BottomNav activeRoute="/history" />
    </div>
  )
}
