import { useNavigate } from 'react-router-dom'
import { Activity, CalendarDays, HeartPulse, Home, ShieldAlert, BriefcaseMedical } from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  route: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: <Home className="w-5 h-5" />, route: '/dashboard' },
  { label: 'Kicks', icon: <Activity className="w-5 h-5" />, route: '/check-in' },
  { label: 'Calendar', icon: <CalendarDays className="w-5 h-5" />, route: '/appointments' },
  { label: 'Bag', icon: <BriefcaseMedical className="w-5 h-5" />, route: '/hospital-bag' },
  { label: 'Safety', icon: <ShieldAlert className="w-5 h-5" />, route: '/safety' },
]

interface BottomNavProps {
  activeRoute: string
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pointer-events-none">
      <div className="mx-auto max-w-[560px] h-[72px] rounded-[24px] bg-white border border-border-light shadow-[0_14px_34px_-22px_rgba(17,24,39,0.55)] flex items-center justify-around pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.route
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] rounded-2xl transition-all ${
                isActive ? 'text-primary' : 'text-text-muted active:text-text-dark'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`w-9 h-8 rounded-2xl flex items-center justify-center ${isActive ? 'bg-primary-light' : ''}`}>
                {isActive && item.route === '/dashboard' ? <HeartPulse className="w-5 h-5" /> : item.icon}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
