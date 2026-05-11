import { useMemo, useState } from 'react'
import { format, startOfDay, startOfHour, subDays, subHours } from 'date-fns'
import { Footprints, Info, ShieldCheck } from 'lucide-react'
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

  const { buckets, total, average, maxValue, unitLabel, subtitle } = useMemo(() => {
    const nextBuckets = buildBuckets(range, kicks)
    const nextTotal = nextBuckets.reduce((sum, bucket) => sum + bucket.count, 0)
    const nextAverage = nextTotal / nextBuckets.length
    const nextMax = Math.max(...nextBuckets.map(bucket => bucket.count), nextAverage, 1)

    return {
      buckets: nextBuckets,
      total: nextTotal,
      average: nextAverage,
      maxValue: nextMax,
      unitLabel: range === 'D' ? 'per hour' : 'per day',
      subtitle: range === 'D' ? 'Last 12 hours' : range === 'W' ? 'Last 7 days' : 'Last 30 days'
    }
  }, [range, kicks])

  const averagePosition = `${Math.min(100, (average / maxValue) * 100)}%`
  const midValue = Math.ceil(maxValue / 2)

  return (
    <section className="app-card p-6 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
            <Footprints className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-black tracking-tight text-text-dark">Kick Count</p>
            <p className="text-xs font-bold text-text-muted">{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border-light bg-white shrink-0">
          {rangeOptions.map(option => (
            <button
              key={option.key}
              type="button"
              aria-label={option.label}
              aria-pressed={range === option.key}
              onClick={() => setRange(option.key)}
              className={`min-h-0 h-11 w-12 text-sm font-black ${
                range === option.key
                  ? 'bg-primary text-white'
                  : 'text-text-muted border-l border-border-light first:border-l-0'
              }`}
            >
              {option.key}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-6xl font-black tracking-tight text-primary">{total}</span>
        <div className="pb-2">
          <p className="text-sm font-black text-text-muted">kicks</p>
          <p className="text-xs font-bold text-text-muted">Avg {average.toFixed(1)} {unitLabel}</p>
        </div>
        <Info className="mb-3 h-4 w-4 text-text-muted" />
      </div>

      <div className="mt-2 grid grid-cols-[34px_1fr] gap-3">
        <div className={`flex ${compact ? 'h-36' : 'h-44'} flex-col justify-between pt-1 text-[11px] font-bold text-text-muted`}>
          <span>{Math.ceil(maxValue)}</span>
          <span>{midValue}</span>
          <span>0</span>
        </div>

        <div className={`relative ${compact ? 'h-36' : 'h-44'} border-l border-b border-border-light pl-2`}>
          <div
            className="absolute left-2 right-0 z-20 border-t border-dashed border-primary/70"
            style={{ bottom: averagePosition }}
          >
            <span className="absolute right-0 -top-3 bg-white px-1 text-sm font-black text-primary">
              {average.toFixed(1)}
            </span>
          </div>

          <div className="relative z-10 flex h-full items-end gap-1">
            {buckets.map((bucket, index) => {
              const height = bucket.count > 0 ? `${Math.max((bucket.count / maxValue) * 100, 8)}%` : '4px'
              const isLatest = index === buckets.length - 1
              const shouldShowLabel =
                range === 'W' || buckets.length <= 12 || index === 0 || index === buckets.length - 1 || index % 7 === 0
              const showValue = bucket.count > 0 && (range !== 'M' || index % 5 === 0 || isLatest)

              return (
                <div key={bucket.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span
                    className={`h-4 text-center text-[11px] font-black leading-none ${
                      showValue ? (isLatest ? 'text-text-dark' : 'text-text-muted') : 'text-transparent'
                    }`}
                  >
                    {showValue ? bucket.count : '.'}
                  </span>
                  <div className="flex h-full w-full items-end">
                    <div
                      title={`${bucket.label}: ${bucket.count} kick${bucket.count === 1 ? '' : 's'}`}
                      className={`w-full rounded-t-md transition-all ${
                        bucket.count > 0
                          ? isLatest
                            ? 'bg-primary shadow-[0_8px_16px_-10px_rgba(240,95,69,0.75)]'
                            : 'bg-primary/35'
                          : 'bg-slate-200'
                      }`}
                      style={{ height }}
                    />
                  </div>
                  <span
                    className={`h-4 text-center text-[10px] font-bold leading-none ${
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
      </div>

      <div className="mt-5 flex w-full items-center justify-between border-t border-border-light pt-4 text-left">
        <span className="flex items-center gap-3 text-sm font-semibold text-text-muted">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Babies are often active after meals and in the evening.
        </span>
      </div>
    </section>
  )
}
