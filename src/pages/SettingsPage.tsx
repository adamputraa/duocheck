/**
 * Settings page for DuoCheck.
 * Profile, sharing settings, data management, shortcut setup,
 * privacy, partner info, and account actions.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import ShortcutSetupCard from '@/components/ShortcutSetupCard'
import PrivacySettingsCard from '@/components/PrivacySettingsCard'
import {
  User,
  MapPin,
  LogOut,
  Trash2,
  ChevronRight,
  Smartphone,
  Users,
  AlertTriangle,
} from 'lucide-react'

interface SharingSettings {
  id: string
  user_id: string
  sharing_enabled: boolean
  shortcut_token: string | null
  stale_threshold_hours: number
  history_retention_days: number
  updated_at: string
}

const STALE_THRESHOLD_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 3, label: '3 hours' },
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' },
]

const RETENTION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { couple, partner, isInCouple, refreshCouple } = useCouple()
  const [settings, setSettings] = useState<SharingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [confirmDeleteHistory, setConfirmDeleteHistory] = useState(false)
  const [deletingHistory, setDeletingHistory] = useState(false)
  const [updatingThreshold, setUpdatingThreshold] = useState(false)
  const [updatingRetention, setUpdatingRetention] = useState(false)

  // Fetch settings and profile
  useEffect(() => {
    async function fetchSettings() {
      if (!user) return

      const { data } = await supabase
        .from('sharing_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setSettings(data as SharingSettings)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || '')
      }

      setLoading(false)
    }

    fetchSettings()
  }, [user])

  const toggleSharing = async () => {
    if (!settings || !user) return
    setToggling(true)

    const newValue = !settings.sharing_enabled
    const { error } = await supabase
      .from('sharing_settings')
      .update({ sharing_enabled: newValue, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (!error) {
      setSettings({ ...settings, sharing_enabled: newValue })
    }
    setToggling(false)
  }

  const updateStaleThreshold = async (hours: number) => {
    if (!settings || !user) return
    setUpdatingThreshold(true)

    const { error } = await supabase
      .from('sharing_settings')
      .update({ stale_threshold_hours: hours, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (!error) {
      setSettings({ ...settings, stale_threshold_hours: hours })
    }
    setUpdatingThreshold(false)
  }

  const updateRetention = async (days: number) => {
    if (!settings || !user) return
    setUpdatingRetention(true)

    const { error } = await supabase
      .from('sharing_settings')
      .update({ history_retention_days: days, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (!error) {
      setSettings({ ...settings, history_retention_days: days })
    }
    setUpdatingRetention(false)
  }

  const saveDisplayName = async () => {
    if (!user || !displayName.trim()) return
    setSavingName(true)

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id)

    if (!error) {
      setNameSaved(true)
      await refreshCouple()
      setTimeout(() => setNameSaved(false), 2000)
    }
    setSavingName(false)
  }

  const handleRegenerateToken = async () => {
    if (!user) return
    const newToken = crypto.randomUUID().replace(/-/g, '')

    const { error } = await supabase
      .from('sharing_settings')
      .update({ shortcut_token: newToken, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (!error && settings) {
      setSettings({ ...settings, shortcut_token: newToken })
    }
  }

  const handleDeleteHistory = async () => {
    if (!user || !couple) return
    setDeletingHistory(true)

    const { error } = await supabase
      .from('location_updates')
      .delete()
      .eq('user_id', user.id)
      .eq('couple_id', couple.id)

    if (error) {
      console.error('Failed to delete history:', error)
    }
    setDeletingHistory(false)
    setConfirmDeleteHistory(false)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream pb-24">
        <AppHeader sharingEnabled={true} />
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="animate-pulse text-text-muted text-center py-12">Loading settings…</div>
        </main>
        <BottomNav activeRoute="/settings" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader sharingEnabled={settings?.sharing_enabled ?? true} />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* ── Profile Section ── */}
        <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-text-muted mb-1">Email</label>
              <p className="text-sm text-text-dark bg-cream rounded-lg px-3 py-2">
                {user?.email}
              </p>
            </div>
            <div>
              <label htmlFor="displayName" className="block text-sm text-text-muted mb-1">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                <button
                  onClick={saveDisplayName}
                  disabled={savingName}
                  className="h-12 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition disabled:opacity-50 text-sm min-w-[80px]"
                >
                  {savingName ? '…' : nameSaved ? '✓' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sharing Settings ── */}
        <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location Sharing
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-between py-2 mb-4">
            <div>
              <p className="font-medium text-text-dark">
                {settings?.sharing_enabled ? 'Sharing ON' : 'Sharing OFF'}
              </p>
              <p className="text-xs text-text-muted">
                {settings?.sharing_enabled
                  ? 'Your partner can see your check-ins'
                  : 'Your check-ins will not be shared'}
              </p>
            </div>
            <button
              onClick={toggleSharing}
              disabled={toggling}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors min-h-[44px] min-w-[52px] p-1 ${
                settings?.sharing_enabled ? 'bg-success' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={settings?.sharing_enabled}
              aria-label={settings?.sharing_enabled ? 'Disable sharing' : 'Enable sharing'}
            >
              <span
                className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  settings?.sharing_enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Stale Threshold */}
          <div className="mb-4">
            <label className="block text-sm text-text-muted mb-1.5">
              Stale threshold
            </label>
            <p className="text-xs text-text-muted mb-2">
              How old a check-in must be before it shows a warning
            </p>
            <select
              value={settings?.stale_threshold_hours ?? 3}
              onChange={(e) => updateStaleThreshold(Number(e.target.value))}
              disabled={updatingThreshold}
              className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition appearance-none"
            >
              {STALE_THRESHOLD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* History Retention */}
          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              History retention
            </label>
            <p className="text-xs text-text-muted mb-2">
              Check-in history older than this will be automatically deleted
            </p>
            <select
              value={settings?.history_retention_days ?? 30}
              onChange={(e) => updateRetention(Number(e.target.value))}
              disabled={updatingRetention}
              className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition appearance-none"
            >
              {RETENTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ── Data Management ── */}
        <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-primary" />
            Data Management
          </h2>

          {!confirmDeleteHistory ? (
            <button
              onClick={() => setConfirmDeleteHistory(true)}
              className="w-full h-12 border border-border-light text-text-muted font-medium rounded-xl hover:border-emergency/30 hover:text-emergency transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete My Location History
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50">
                <AlertTriangle className="w-4 h-4 text-emergency shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed">
                  This will permanently delete all of your check-in history. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteHistory(false)}
                  className="flex-1 h-12 border border-border-light text-text-muted font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteHistory}
                  disabled={deletingHistory}
                  className="flex-1 h-12 bg-emergency text-white font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {deletingHistory ? 'Deleting…' : 'Delete All'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── iPhone Shortcut Section ── */}
        <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            iPhone Shortcuts
          </h2>

          <ShortcutSetupCard
            token={settings?.shortcut_token ?? null}
            onRegenerate={handleRegenerateToken}
          />

          <button
            onClick={() => navigate('/shortcuts')}
            className="w-full mt-3 flex items-center justify-between px-4 py-3 rounded-xl hover:bg-primary-light/30 transition min-h-[44px]"
          >
            <span className="text-sm font-medium text-primary">View Setup Guide</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
        </section>

        {/* ── Privacy Explanation Card ── */}
        <PrivacySettingsCard />

        {/* ── Partner Access Section ── */}
        {isInCouple && (
          <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
            <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Partner Access
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-text-muted">Couple Name</p>
                <p className="text-sm text-text-dark font-medium">
                  {couple?.name || 'Unnamed couple'}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Partner</p>
                <p className="text-sm text-text-dark font-medium">
                  {partner?.display_name || 'Waiting for partner…'}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Joined</p>
                <p className="text-sm text-text-dark font-medium">
                  {couple?.created_at
                    ? new Date(couple.created_at).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Account Actions ── */}
        <section className="bg-card rounded-2xl border border-emergency/20 p-5 shadow-sm">
          <h2 className="font-semibold text-emergency mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Account
          </h2>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full h-12 border border-emergency/30 text-emergency font-semibold rounded-xl hover:bg-emergency/5 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </section>
      </main>

      <BottomNav activeRoute="/settings" />
    </div>
  )
}
