/**
 * Main App component for DuoCheck.
 * Sets up react-router-dom routing with auth and couple guards.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import MapPage from '@/pages/MapPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'
import ShortcutsPage from '@/pages/ShortcutsPage'
import PairingScreen from '@/components/PairingScreen'

/**
 * Auth guard: redirects to /login if user is not authenticated.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/**
 * Couple guard: shows PairingScreen if user is authenticated but not in a couple.
 * Allows access to /settings and /shortcuts even without a couple.
 */
function CoupleGuard({ children, allowWithoutCouple = false }: { children: React.ReactNode; allowWithoutCouple?: boolean }) {
  const { isInCouple, loading } = useCouple()

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading…</div>
      </div>
    )
  }

  if (!isInCouple && !allowWithoutCouple) {
    return <PairingScreen />
  }

  return <>{children}</>
}

/**
 * Public route guard: redirects to /dashboard if user is already authenticated.
 */
function PublicGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading…</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicGuard>
              <LoginPage />
            </PublicGuard>
          }
        />
        <Route
          path="/register"
          element={
            <PublicGuard>
              <RegisterPage />
            </PublicGuard>
          }
        />

        {/* Protected routes — require auth + couple */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <CoupleGuard>
                <DashboardPage />
              </CoupleGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/map"
          element={
            <AuthGuard>
              <CoupleGuard>
                <MapPage />
              </CoupleGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/history"
          element={
            <AuthGuard>
              <CoupleGuard>
                <HistoryPage />
              </CoupleGuard>
            </AuthGuard>
          }
        />

        {/* Protected routes — require auth, couple optional */}
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <CoupleGuard allowWithoutCouple>
                <SettingsPage />
              </CoupleGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/shortcuts"
          element={
            <AuthGuard>
              <CoupleGuard allowWithoutCouple>
                <ShortcutsPage />
              </CoupleGuard>
            </AuthGuard>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
