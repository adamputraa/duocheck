/**
 * PairingScreen component for DuoCheck.
 * Couple pairing onboarding with two options:
 * "Create a Group" and "Join with a Code".
 * Uses the useCouple hook internally.
 */

import { useState } from 'react'
import { Heart, Users, Copy, Check, Loader2, ArrowLeft } from 'lucide-react'
import { useCouple } from '@/hooks/useCouple'

type PairingMode = 'choose' | 'create' | 'join'

export default function PairingScreen() {
  const { createGroup, joinWithCode, loading } = useCouple()
  const [mode, setMode] = useState<PairingMode>('choose')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleCreateGroup() {
    setInviteCode(null)
    const result = await createGroup()
    if (result) {
      setInviteCode(result.inviteCode)
    }
  }

  async function handleJoinWithCode() {
    setJoinError(null)
    const code = joinCode.trim().toUpperCase()

    if (code.length !== 6) {
      setJoinError('Invite code must be 6 characters.')
      return
    }

    const result = await joinWithCode(code)
    if (!result.success) {
      setJoinError(result.message)
    }
    // On success, the useCouple hook will update and the parent guard will redirect
  }

  async function handleCopyCode() {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-light mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-dark mb-1">DuoCheck</h1>
          <p className="text-sm text-text-muted text-center">
            Connect with your partner to start sharing check-ins
          </p>
        </div>

        {/* Choose mode */}
        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setMode('create')
                handleCreateGroup()
              }}
              className="flex items-center gap-3 w-full p-4 bg-white rounded-xl border border-border-light shadow-sm active:bg-primary-light/50 transition-colors min-h-[44px]"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-light shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-dark">
                  Create a Group
                </p>
                <p className="text-xs text-text-muted">
                  Start a new group and invite your partner
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="flex items-center gap-3 w-full p-4 bg-white rounded-xl border border-border-light shadow-sm active:bg-primary-light/50 transition-colors min-h-[44px]"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-light shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-dark">
                  Join with a Code
                </p>
                <p className="text-xs text-text-muted">
                  Enter an invite code from your partner
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Create group mode */}
        {mode === 'create' && (
          <div className="bg-white rounded-xl border border-border-light p-5 shadow-sm">
            <button
              onClick={() => {
                setMode('choose')
                setInviteCode(null)
              }}
              className="flex items-center gap-1 text-xs text-text-muted active:text-primary transition-colors mb-4 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-base font-semibold text-text-dark mb-2">
              Your Invite Code
            </h2>

            {loading && !inviteCode ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : inviteCode ? (
              <>
                <div className="bg-cream rounded-lg p-4 mb-3 text-center">
                  <code className="text-2xl font-bold tracking-[0.3em] text-primary-dark">
                    {inviteCode}
                  </code>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium active:bg-primary-dark transition-colors min-h-[44px] mb-4"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 justify-center">
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  <p className="text-xs text-text-muted">
                    Waiting for your partner to join…
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">
                Failed to create group. Please try again.
              </p>
            )}
          </div>
        )}

        {/* Join with code mode */}
        {mode === 'join' && (
          <div className="bg-white rounded-xl border border-border-light p-5 shadow-sm">
            <button
              onClick={() => {
                setMode('choose')
                setJoinError(null)
                setJoinCode('')
              }}
              className="flex items-center gap-1 text-xs text-text-muted active:text-primary transition-colors mb-4 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-base font-semibold text-text-dark mb-2">
              Enter Invite Code
            </h2>
            <p className="text-xs text-text-muted mb-4">
              Ask your partner for their 6-character invite code
            </p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
                setJoinCode(val)
                setJoinError(null)
              }}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg border border-border-light text-center text-xl font-bold tracking-[0.3em] text-primary-dark placeholder:text-border-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-2"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
            />

            {joinError && (
              <p className="text-xs text-emergency mb-3">{joinError}</p>
            )}

            <button
              onClick={handleJoinWithCode}
              disabled={joinCode.length !== 6 || loading}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-primary text-white text-sm font-medium active:bg-primary-dark transition-colors disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Join Group
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
