/**
 * Main App component for DuoCare.
 * Sets up react-router-dom routing with auth, couple, and pregnancy guards.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import CheckInPage from '@/pages/CheckInPage'
import AppointmentsPage from '@/pages/AppointmentsPage'
import TasksPage from '@/pages/TasksPage'
import HospitalBagPage from '@/pages/HospitalBagPage'
import SafetyPage from '@/pages/SafetyPage'
import SettingsPage from '@/pages/SettingsPage'
import PregnancySetupPage from '@/pages/PregnancySetupPage'
import PairingScreen from '@/components/PairingScreen'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading…</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function CoupleGuard({ children, allowWithoutCouple = false }: { children: React.ReactNode; allowWithoutCouple?: boolean }) {
  const { isInCouple, loading } = useCouple()
  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading…</div>
      </div>
    )
  }
  if (!isInCouple && !allowWithoutCouple) return <PairingScreen />
  return <>{children}</>
}

function PregnancyGuard({ children }: { children: React.ReactNode }) {
  const { hasPregnancyProfile, loading, isInCouple, partner } = useCouple()
  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading…</div>
      </div>
    )
  }
  // Only redirect to pregnancy setup if paired (has partner) but no pregnancy profile
  if (isInCouple && partner && !hasPregnancyProfile) {
    return <Navigate to="/pregnancy-setup" replace />
  }
  return <>{children}</>
}

function PublicGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading…</div>
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicGuard><LoginPage /></PublicGuard>} />
        <Route path="/register" element={<PublicGuard><RegisterPage /></PublicGuard>} />

        {/* Pregnancy setup — auth + couple required */}
        <Route path="/pregnancy-setup" element={
          <AuthGuard><CoupleGuard><PregnancySetupPage /></CoupleGuard></AuthGuard>
        } />

        {/* Protected routes — auth + couple + pregnancy profile */}
        <Route path="/dashboard" element={
          <AuthGuard><CoupleGuard><PregnancyGuard><DashboardPage /></PregnancyGuard></CoupleGuard></AuthGuard>
        } />
        <Route path="/check-in" element={
          <AuthGuard><CoupleGuard><PregnancyGuard><CheckInPage /></PregnancyGuard></CoupleGuard></AuthGuard>
        } />
        <Route path="/appointments" element={
          <AuthGuard><CoupleGuard><PregnancyGuard><AppointmentsPage /></PregnancyGuard></CoupleGuard></AuthGuard>
        } />
        <Route path="/tasks" element={
          <AuthGuard><CoupleGuard><PregnancyGuard><TasksPage /></PregnancyGuard></CoupleGuard></AuthGuard>
        } />
        <Route path="/hospital-bag" element={
          <AuthGuard><CoupleGuard><PregnancyGuard><HospitalBagPage /></PregnancyGuard></CoupleGuard></AuthGuard>
        } />
        <Route path="/safety" element={
          <AuthGuard><CoupleGuard><PregnancyGuard><SafetyPage /></PregnancyGuard></CoupleGuard></AuthGuard>
        } />

        {/* Settings — auth required, couple optional */}
        <Route path="/settings" element={
          <AuthGuard><CoupleGuard allowWithoutCouple><SettingsPage /></CoupleGuard></AuthGuard>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
