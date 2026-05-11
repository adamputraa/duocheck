import { useNavigate } from 'react-router-dom'
import { Home, Footprints, BookOpen, Users, Baby } from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  route: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: <Home className="w-6 h-6" />, route: '/dashboard' },
  { label: 'Journey', icon: <Baby className="w-6 h-6" />, route: '/journey' },
  { label: 'Record', icon: <Footprints className="w-8 h-8" />, route: '/check-in' },
  { label: 'Learn', icon: <BookOpen className="w-6 h-6" />, route: '/learn' },
  { label: 'Profile', icon: <Users className="w-6 h-6" />, route: '/settings' },
]

interface BottomNavProps {
  activeRoute: string
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F1F5F9] px-2 pb-6 pt-2 shadow-[0_-4px_24px_-12px_rgba(17,24,39,0.1)]">
      <div className="mx-auto max-w-[560px] flex items-end justify-between relative">
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeRoute === item.route
          const isRecord = item.label === 'Record'

          if (isRecord) {
            return (
              <div key={item.route} className="relative flex flex-col items-center -top-6">
                <button
                  onClick={() => navigate(item.route)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_24px_-8px_rgba(255,94,58,0.6)] ring-4 ring-white"
                  aria-label={item.label}
                >
                  {item.icon}
                </button>
                <span className="mt-2 text-[11px] font-bold text-[#687281]">
                  {item.label}
                </span>
              </div>
            )
          }

          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] transition-all ${
                isActive ? 'text-primary' : 'text-[#A0AEC0]'
              }`}
              aria-label={item.label}
            >
              {item.icon}
              <span className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-[#687281]'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
