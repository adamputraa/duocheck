/**
 * LoadingCard component for DuoCare.
 * Animated placeholder card for loading states.
 */

interface LoadingCardProps {
  message?: string
}

export default function LoadingCard({ message = 'Loading…' }: LoadingCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border-light p-6 shadow-sm text-center">
      <div className="animate-pulse text-text-muted">{message}</div>
    </div>
  )
}
