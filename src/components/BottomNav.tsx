/**
 * BottomNav component for DuoCare.
 * Fixed bottom navigation bar with 5 tabs:
 * Home, Check-In, Appointments, Tasks, Safety.
 * iPhone safe area support with bottom padding.
 */

import { useNavigate } from 'react-router-dom'
import { Home, ClipboardPlus, Calendar, ListChecks, ShieldAlert } from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  route: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: <Home className="w-5 h-5" />, route: '/dashboard' },
  { label: 'Check-In', icon: <ClipboardPlus className="w-5 h-5" />, route: '/check-in' },
  { label: 'Appointments', icon: <Calendar className="w-5 h-5" />, route: '/appointments' },
  { label: 'Tasks', icon: <ListChecks className="w-5 h-5" />, route: '/tasks' },
  { label: 'Safety', icon: <ShieldAlert className="w-5 h-5" />, route: '/safety' },
]

interface BottomNavProps {
  activeRoute: string
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-light"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.route
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-2 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted active:text-primary-dark'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
      {/* iPhone safe area bottom padding */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
