import { useMemo, useState } from 'react'
import { format, startOfDay, startOfHour, subDays, subHours } from 'date-fns'
import type { BabyKick } from '@/hooks/useKicks'

type RangeKey = 'D' | 'W' | 'M'

interface Bucket {
  key: string
  label: string
  count: number
}

const rangeOptions: Array<{ key: RangeKey; label: string }> = [
  { key: 'D', label: 'Day' },
  { key: 'W', label: 'Week' },
  { key: 'M', label: 'Month' }
]

const dayKey = (date: Date) => format(startOfDay(date), 'yyyy-MM-dd')
const hourKey = (date: Date) => format(startOfHour(date), 'yyyy-MM-dd-HH')

function buildBuckets(range: RangeKey, kicks: BabyKick[]) {
  const now = new Date()
  const currentHour = startOfHour(now)
  const today = startOfDay(now)

  const buckets: Bucket[] =
    range === 'D'
      ? Array.from({ length: 12 }, (_, index) => {
          const hour = subHours(currentHour, 11 - index)
          return { key: hourKey(hour), label: format(hour, 'ha'), count: 0 }
        })
      : Array.from({ length: range === 'W' ? 7 : 30 }, (_, index) => {
          const day = subDays(today, (range === 'W' ? 6 : 29) - index)
          return { key: dayKey(day), label: range === 'W' ? format(day, 'EEE') : format(day, 'd'), count: 0 }
        })

  const bucketMap = new Map(buckets.map(bucket => [bucket.key, bucket]))
  kicks.forEach(kick => {
    const kickDate = new Date(kick.created_at)
    const key = range === 'D' ? hourKey(kickDate) : dayKey(kickDate)
    const bucket = bucketMap.get(key)
    if (bucket) bucket.count += 1
  })

  return buckets
}

export default function KickSummaryChart({ kicks, compact = false }: { kicks: BabyKick[]; compact?: boolean }) {
  const [range, setRange] = useState<RangeKey>('D')

  const { buckets, total, average, maxValue, unitLabel } = useMemo(() => {
    const nextBuckets = buildBuckets(range, kicks)
    const nextTotal = nextBuckets.reduce((sum, bucket) => sum + bucket.count, 0)
    const nextAverage = nextTotal / nextBuckets.length
    const nextMax = Math.max(...nextBuckets.map(bucket => bucket.count), nextAverage, 1)

    return {
      buckets: nextBuckets,
      total: nextTotal,
      average: nextAverage,
      maxValue: nextMax,
      unitLabel: range === 'D' ? 'per hour' : 'per day'
    }
  }, [range, kicks])

  const averagePosition = `${Math.min(100, (average / maxValue) * 100)}%`

  return (
    <section className="app-card p-5 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="app-section-title">Kick Count</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-text-dark">{total}</span>
            <span className="text-sm font-extrabold text-text-muted">kicks</span>
          </div>
          <p className="text-xs font-bold text-text-muted mt-1">
            Avg {average.toFixed(1)} {unitLabel}
          </p>
        </div>

        <div className="grid grid-cols-3 rounded-full bg-cream p-1 shrink-0">
          {rangeOptions.map(option => (
            <button
              key={option.key}
              type="button"
              aria-label={option.label}
              aria-pressed={range === option.key}
              onClick={() => setRange(option.key)}
              className={`min-h-0 h-9 w-10 rounded-full text-sm font-black ${
                range === option.key
                  ? 'bg-primary text-white shadow-[0_8px_18px_-12px_rgba(240,95,69,0.95)]'
                  : 'text-text-muted'
              }`}
            >
              {option.key}
            </button>
          ))}
        </div>
      </div>

      <div className={`relative ${compact ? 'h-36' : 'h-44'} mt-6`}>
        <div
          className="absolute left-0 right-0 z-20 border-t border-dashed border-primary/55"
          style={{ bottom: averagePosition }}
        >
          <span className="absolute right-0 -top-3 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-black text-primary">
            Avg {average.toFixed(1)}
          </span>
        </div>

        <div className="relative z-10 flex h-full items-end gap-1">
          {buckets.map((bucket, index) => {
            const height = bucket.count > 0 ? `${Math.max((bucket.count / maxValue) * 100, 7)}%` : '4px'
            const isLatest = index === buckets.length - 1
            const shouldShowLabel =
              range === 'W' || buckets.length <= 12 || index === 0 || index === buckets.length - 1 || index % 7 === 0

            return (
              <div key={bucket.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-full w-full items-end">
                  <div
                    title={`${bucket.label}: ${bucket.count} kick${bucket.count === 1 ? '' : 's'}`}
                    className={`w-full rounded-full transition-all ${
                      bucket.count > 0
                        ? isLatest
                          ? 'bg-primary'
                          : 'bg-primary/55'
                        : 'bg-slate-200'
                    }`}
                    style={{ height }}
                  />
                </div>
                <span
                  className={`h-4 text-center text-[10px] font-extrabold leading-none ${
                    isLatest ? 'text-primary' : shouldShowLabel ? 'text-text-muted' : 'text-transparent'
                  }`}
                >
                  {shouldShowLabel ? bucket.label : '.'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
