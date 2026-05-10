import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { CoupleProvider, useCouple } from '@/hooks/useCouple'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const CheckInPage = lazy(() => import('@/pages/CheckInPage'))
const AppointmentsPage = lazy(() => import('@/pages/AppointmentsPage'))
const TasksPage = lazy(() => import('@/pages/TasksPage'))
const HospitalBagPage = lazy(() => import('@/pages/HospitalBagPage'))
const SafetyPage = lazy(() => import('@/pages/SafetyPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const PregnancySetupPage = lazy(() => import('@/pages/PregnancySetupPage'))
const PairingScreen = lazy(() => import('@/components/PairingScreen'))

function AppLoading() {
  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center">
      <div className="animate-pulse text-text-muted">Loading...</div>
    </div>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoading />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function CoupleGuard({ children, allowWithoutCouple = false }: { children: React.ReactNode; allowWithoutCouple?: boolean }) {
  const { isInCouple, loading } = useCouple()
  if (loading) return <AppLoading />
  if (!isInCouple && !allowWithoutCouple) return <PairingScreen />
  return <>{children}</>
}

function PregnancyGuard({ children }: { children: React.ReactNode }) {
  const { hasPregnancyProfile, loading, isInCouple, partner } = useCouple()
  if (loading) return <AppLoading />
  if (isInCouple && partner && !hasPregnancyProfile) {
    return <Navigate to="/pregnancy-setup" replace />
  }
  return <>{children}</>
}

function PublicGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoading />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <BrowserRouter>
          <Suspense fallback={<AppLoading />}>
            <Routes>
              <Route path="/login" element={<PublicGuard><LoginPage /></PublicGuard>} />
              <Route path="/register" element={<PublicGuard><RegisterPage /></PublicGuard>} />

              <Route path="/pregnancy-setup" element={
                <AuthGuard><CoupleGuard><PregnancySetupPage /></CoupleGuard></AuthGuard>
              } />

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

              <Route path="/settings" element={
                <AuthGuard><CoupleGuard allowWithoutCouple><SettingsPage /></CoupleGuard></AuthGuard>
              } />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CoupleProvider>
    </AuthProvider>
  )
}
