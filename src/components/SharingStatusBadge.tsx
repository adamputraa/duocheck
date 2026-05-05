/**
 * SharingStatusBadge component for DuoCheck.
 * Small badge showing sharing ON/OFF status.
 */

interface SharingStatusBadgeProps {
  enabled: boolean
}

export default function SharingStatusBadge({ enabled }: SharingStatusBadgeProps) {
  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Sharing ON
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/80">
      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
      Sharing OFF
    </span>
  )
}
