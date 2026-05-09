/**
 * BottomNav component for DuoCare.
 * Modern floating glass pill navigation.
 */

import { useNavigate } from 'react-router-dom'
import { Home, Activity, Calendar, ListChecks, ShieldAlert } from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  route: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: <Home className="w-5 h-5" />, route: '/dashboard' },
  { label: 'Kicks', icon: <Activity className="w-5 h-5" />, route: '/check-in' },
  { label: 'Calendar', icon: <Calendar className="w-5 h-5" />, route: '/appointments' },
  { label: 'Tasks', icon: <ListChecks className="w-5 h-5" />, route: '/tasks' },
  { label: 'Safety', icon: <ShieldAlert className="w-5 h-5" />, route: '/safety' },
]

interface BottomNavProps {
  activeRoute: string
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="glass mx-auto max-w-lg rounded-[32px] p-2 flex items-center justify-around shadow-2xl shadow-primary/10 pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.route
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[50px] min-w-[50px] px-2 rounded-2xl transition-all tap-effect ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                  : 'text-text-muted active:text-primary'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={isActive ? 'scale-110' : ''}>{item.icon}</div>
              <span className={`text-[9px] font-bold uppercase tracking-tighter ${isActive ? 'block' : 'hidden'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

