/**
 * LoadingCard component for DuoCheck.
 * Animated pulse/skeleton loading state display.
 */

interface LoadingCardProps {
  message?: string
}

export default function LoadingCard({ message = 'Loading\u2026' }: LoadingCardProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-border-light p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 rounded-full border-2 border-border-light" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-text-muted">{message}</span>
      </div>
      {/* Skeleton lines */}
      <div className="w-full mt-4 space-y-2">
        <div className="h-3 bg-border-light/50 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-border-light/50 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}
