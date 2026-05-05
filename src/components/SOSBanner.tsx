/**
 * SOSBanner component for DuoCheck.
 * Red SOS banner for active emergencies with high visibility
 * and "I'm Safe" dismiss button for the sender.
 */

interface SOSBannerProps {
  senderName: string
  isSender: boolean
  onResolve: () => void
}

export default function SOSBanner({ senderName, isSender, onResolve }: SOSBannerProps) {
  return (
    <div className="bg-emergency/10 border-b-2 border-emergency px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg" role="img" aria-label="warning">
            ⚠️
          </span>
          <p className="text-sm font-semibold text-emergency truncate">
            SOS Active — {senderName} sent an emergency alert.
          </p>
        </div>

        {isSender && (
          <button
            onClick={onResolve}
            className="shrink-0 px-4 py-2 rounded-lg bg-emergency text-white text-xs font-bold active:bg-red-600 transition-colors min-h-[44px] flex items-center"
          >
            I&apos;m Safe
          </button>
        )}
      </div>
    </div>
  )
}
