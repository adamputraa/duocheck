/**
 * EmptyStateCard component for DuoCheck.
 * Displays an icon, title, and description for empty states.
 */

interface EmptyStateCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export default function EmptyStateCard({ icon, title, description }: EmptyStateCardProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-border-light p-6 shadow-sm text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-light mb-3">
        <span className="text-primary">{icon}</span>
      </div>
      <h3 className="text-sm font-semibold text-text-dark mb-1">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed max-w-[240px]">
        {description}
      </p>
    </div>
  )
}
