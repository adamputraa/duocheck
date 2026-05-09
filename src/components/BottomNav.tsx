/**
 * BottomNav component for DuoCare.
 * Modern solid bottom navigation.
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-2 pb-safe-bottom">
      <div className="mx-auto max-w-lg h-16 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.route
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-h-[50px] transition-all tap-effect ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted active:text-text-dark'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}


