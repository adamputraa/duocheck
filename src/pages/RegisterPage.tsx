/**
 * Register page for DuoCheck.
 * Sign-up form with display name, email, and password.
 * After sign-up, shows OTP verification step.
 */

import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, User, Heart, ShieldCheck, KeyRound } from 'lucide-react'

export default function RegisterPage() {
  const { signUp, verifyOtp, loading, error, clearError } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      const result = await signUp(email, password, displayName)
      if (result.otpSent) {
        setOtpSent(true)
      }
      // If otpSent is false, user is auto-confirmed and auth state will handle redirect
    } catch {
      // Error is set in the hook
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1)
    const newCode = [...otpCode]
    newCode[index] = digit
    setOtpCode(newCode)
    setVerifyError(null)

    // Auto-focus next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are filled
    if (digit && index === 5 && newCode.every((c) => c !== '')) {
      handleVerifyOtp(newCode.join(''))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      // Move focus to previous input on backspace
      otpRefs.current[index - 1]?.focus()
      const newCode = [...otpCode]
      newCode[index - 1] = ''
      setOtpCode(newCode)
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (pastedData.length > 0) {
      const newCode = [...otpCode]
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedData[i] || ''
      }
      setOtpCode(newCode)

      // Focus the next empty input or the last one
      const nextEmpty = newCode.findIndex((c) => c === '')
      if (nextEmpty !== -1) {
        otpRefs.current[nextEmpty]?.focus()
      } else {
        // All filled — auto-submit
        handleVerifyOtp(newCode.join(''))
      }
    }
  }

  const handleVerifyOtp = async (code?: string) => {
    const token = code || otpCode.join('')
    if (token.length !== 6) {
      setVerifyError('Please enter all 6 digits.')
      return
    }

    setVerifyError(null)
    try {
      await verifyOtp(email, token)
      // Auth state change listener will handle redirect
    } catch {
      setVerifyError('Invalid code. Please check and try again.')
    }
  }

  // OTP verification screen
  if (otpSent) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-2xl mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-dark">Check your email</h1>
            <p className="text-text-muted mt-1">
              We sent a 6-digit code to
            </p>
            <p className="text-text-dark font-medium text-sm mt-0.5">{email}</p>
          </div>

          {/* Error Message */}
          {(error || verifyError) && (
            <div className="bg-emergency/10 border border-emergency/20 text-emergency rounded-xl p-4 mb-4 text-sm">
              {verifyError || error}
            </div>
          )}

          {/* OTP Input */}
          <div className="mb-6">
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-card border border-border-light rounded-xl text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerifyOtp()}
            disabled={loading || otpCode.some((c) => c === '')}
            className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>

          {/* Resend info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              Didn't receive the code?
            </p>
            <button
              onClick={async () => {
                clearError()
                setVerifyError(null)
                setOtpCode(['', '', '', '', '', ''])
                try {
                  const result = await signUp(email, password, displayName)
                  if (result.otpSent) {
                    // Focus first OTP input
                    otpRefs.current[0]?.focus()
                  }
                } catch {
                  // Error handled in hook
                }
              }}
              disabled={loading}
              className="text-primary font-semibold text-sm hover:text-primary-dark transition disabled:opacity-50 mt-1"
            >
              Resend code
            </button>
          </div>

          {/* Back to register */}
          <p className="text-center text-sm text-text-muted mt-4">
            <button
              onClick={() => {
                setOtpSent(false)
                setOtpCode(['', '', '', '', '', ''])
                setVerifyError(null)
                clearError()
              }}
              className="text-primary font-semibold hover:text-primary-dark transition"
            >
              ← Use a different email
            </button>
          </p>
        </div>
      </div>
    )
  }

  // Registration form
  return (
    <div className="min-h-dvh bg-cream flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-2xl mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-dark">Create your account</h1>
          <p className="text-text-muted mt-1">Join DuoCheck for private check-ins</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-emergency/10 border border-emergency/20 text-emergency rounded-xl p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-text-dark mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full h-12 pl-11 pr-4 bg-card border border-border-light rounded-xl text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-12 pl-11 pr-4 bg-card border border-border-light rounded-xl text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full h-12 pl-11 pr-12 bg-card border border-border-light rounded-xl text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Info */}
        <div className="flex items-start gap-2 mt-4 p-3 bg-primary-light/30 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted">
            We'll send a 6-digit verification code to your email. No email links needed!
          </p>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-dark transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
