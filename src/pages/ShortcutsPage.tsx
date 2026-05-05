/**
 * iPhone Shortcut Setup page for DuoCheck.
 * Guides users through creating iOS Shortcuts for quick check-ins.
 * Includes preset shortcuts, token management, and step-by-step instructions.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import ShortcutSetupCard from '@/components/ShortcutSetupCard'
import { Smartphone, Copy, Check, ChevronDown, ChevronUp, MapPin, Home, Briefcase, AlertTriangle } from 'lucide-react'

interface PresetShortcut {
  label: string
  icon: React.ReactNode
  status: string
  color: string
}

const PRESET_SHORTCUTS: PresetShortcut[] = [
  {
    label: 'Share Location Now',
    icon: <MapPin className="w-5 h-5" />,
    status: 'Check-in',
    color: '#D97756',
  },
  {
    label: 'I Arrived Home',
    icon: <Home className="w-5 h-5" />,
    status: 'Home',
    color: '#22C55E',
  },
  {
    label: 'Leaving Work',
    icon: <Briefcase className="w-5 h-5" />,
    status: 'Leaving Work',
    color: '#6B7280',
  },
  {
    label: 'Emergency',
    icon: <AlertTriangle className="w-5 h-5" />,
    status: 'SOS',
    color: '#EF4444',
  },
]

const SETUP_STEPS = [
  {
    title: 'Open the Shortcuts App',
    content: `Open the Shortcuts app on your iPhone (pre-installed on iOS 13+). Tap the "+" button in the top right to create a new shortcut.`,
  },
  {
    title: 'Add a "Get Contents of URL" Action',
    content: `Search for and add the "Get Contents of URL" action. Set the URL to the shortcut URL shown below (or use one of the preset shortcuts). Set the method to GET.`,
  },
  {
    title: 'Add a "Show Notification" Action (Optional)',
    content: `Add a "Show Notification" action so you get confirmation after each check-in. Set the notification body to something like: "Check-in sent!"`,
  },
  {
    title: 'Name & Add to Home Screen',
    content: `Name your shortcut something memorable like "DuoCheck" or "Check In". Long-press the shortcut and tap "Add to Home Screen" for quick access. You can also ask Siri: "Hey Siri, check in".`,
  },
]

export default function ShortcutsPage() {
  const { user } = useAuth()
  const [shortcutToken, setShortcutToken] = useState<string | null>(null)
  const [sharingEnabled, setSharingEnabled] = useState(true)
  const [supabaseUrl] = useState(() => import.meta.env.VITE_SUPABASE_URL || '')
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<number>(0)

  useEffect(() => {
    async function fetchSettings() {
      if (!user) return

      const { data } = await supabase
        .from('sharing_settings')
        .select('shortcut_token, sharing_enabled')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setShortcutToken(data.shortcut_token)
        setSharingEnabled(data.sharing_enabled)
      }
    }

    fetchSettings()
  }, [user])

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const getShortcutUrl = (status: string) => {
    if (!shortcutToken) return ''
    return `${supabaseUrl}/functions/v1/shortcut-checkin?token=${shortcutToken}&status=${encodeURIComponent(status)}&source=shortcut`
  }

  const handleRegenerateToken = async () => {
    if (!user) return
    const newToken = crypto.randomUUID().replace(/-/g, '')

    const { error } = await supabase
      .from('sharing_settings')
      .update({ shortcut_token: newToken, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (!error) {
      setShortcutToken(newToken)
    }
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader sharingEnabled={sharingEnabled} />

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Intro */}
        <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-dark">Quick Check-In from iPhone</h2>
              <p className="text-sm text-text-muted mt-1">
                Set up iOS Shortcuts to check in with a single tap or a Siri voice command.
                Location is only shared when you trigger the shortcut — no background tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Shortcuts */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-dark mb-3">Preset Shortcuts</h3>
          <div className="space-y-2">
            {PRESET_SHORTCUTS.map((preset) => {
              const url = getShortcutUrl(preset.status)
              return (
                <div
                  key={preset.label}
                  className="bg-card rounded-xl border border-border-light p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: preset.color }}
                    >
                      <span className="text-white">{preset.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-dark">{preset.label}</p>
                      <p className="text-xs text-text-muted">Status: {preset.status}</p>
                    </div>
                  </div>
                  {url ? (
                    <div className="flex items-center gap-2 bg-cream rounded-lg p-2">
                      <code className="flex-1 text-[10px] text-text-dark font-mono break-all leading-relaxed">
                        {url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(url, preset.label)}
                        className="p-2 rounded-lg hover:bg-primary-light transition shrink-0"
                        aria-label={`Copy URL for ${preset.label}`}
                      >
                        {copied === preset.label ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4 text-text-muted" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">Loading URL…</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Shortcut Token Management */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-dark mb-3">Your Shortcut Token</h3>
          <ShortcutSetupCard
            token={shortcutToken}
            onRegenerate={handleRegenerateToken}
          />
        </div>

        {/* Step-by-step Instructions */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-dark mb-3">Setup Instructions</h3>
          <div className="space-y-2">
            {SETUP_STEPS.map((step, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border-light shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === index ? -1 : index)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-primary-light/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium text-text-dark text-sm">{step.title}</span>
                  </div>
                  {expandedStep === index ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </button>
                {expandedStep === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-text-muted leading-relaxed">
                      {step.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-primary-light/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-text-muted leading-relaxed">
            <strong>Note:</strong> Shortcuts only work with an internet connection.
            Location permission must be granted to Safari/Shortcuts for your position to be included.
            If denied, check Settings → Privacy & Security → Location Services on your iPhone.
          </p>
        </div>
      </main>

      <BottomNav activeRoute="/settings" />
    </div>
  )
}
