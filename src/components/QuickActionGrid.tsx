/**
 * QuickActionGrid component for DuoCheck.
 * 2×3 grid of action buttons on the dashboard.
 * Uses ActionIconButton for each action.
 */

import { MapPin, Home, Car, AlertTriangle, Clock, Briefcase } from 'lucide-react'
import ActionIconButton from '@/components/ActionIconButton'

interface QuickActionGridProps {
  onCheckIn: (status: string) => void
  onSOS: () => void
  onNavigate: (route: string) => void
  loading: boolean
}

const ACTIONS = [
  {
    label: 'Share Location',
    color: '#D97756',
    icon: <MapPin className="w-5 h-5" />,
    action: 'check_in' as const,
    status: 'Check-in',
  },
  {
    label: "I'm Home",
    color: '#22C55E',
    icon: <Home className="w-5 h-5" />,
    action: 'check_in' as const,
    status: 'Home',
  },
  {
    label: 'On The Way',
    color: '#F59E0B',
    icon: <Car className="w-5 h-5" />,
    action: 'check_in' as const,
    status: 'On The Way',
  },
  {
    label: 'SOS',
    color: '#EF4444',
    icon: <AlertTriangle className="w-5 h-5" />,
    action: 'sos' as const,
    status: '',
  },
  {
    label: 'History',
    color: 'rgba(107,114,128,0.2)',
    icon: <Clock className="w-5 h-5" />,
    action: 'navigate' as const,
    status: '',
  },
  {
    label: 'Leaving Work',
    color: 'rgba(107,114,128,0.2)',
    icon: <Briefcase className="w-5 h-5" />,
    action: 'check_in' as const,
    status: 'Leaving Work',
  },
] as const

export default function QuickActionGrid({
  onCheckIn,
  onSOS,
  onNavigate,
  loading,
}: QuickActionGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ACTIONS.map((action) => (
        <ActionIconButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          color={action.color}
          loading={loading && action.action !== 'navigate'}
          onClick={() => {
            switch (action.action) {
              case 'check_in':
                onCheckIn(action.status)
                break
              case 'sos':
                onSOS()
                break
              case 'navigate':
                onNavigate('/history')
                break
            }
          }}
        />
      ))}
    </div>
  )
}
