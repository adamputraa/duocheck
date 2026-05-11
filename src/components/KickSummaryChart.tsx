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

export default function KickSummaryChart({
  kicks,
  compact = false,
  showRecordAction = false,
  onRecord,
  recording = false
}: {
  kicks: BabyKick[]
  compact?: boolean
  showRecordAction?: boolean
  onRecord?: () => void
  recording?: boolean
}) {
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
  const showAverageMarker = Number(average.toFixed(1)) > 0
  const showMidValue = midValue > 0 && midValue < Math.ceil(maxValue)
  const chartHeight = compact ? 'h-20' : 'h-44'

  return (
    <section className={`overflow-hidden rounded-[28px] border border-white bg-white ${compact ? 'p-4' : 'p-5'} shadow-[0_18px_44px_-36px_rgba(17,24,39,0.58)]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`${compact ? 'h-11 w-11' : 'h-12 w-12'} flex items-center justify-center rounded-[18px] bg-primary-light text-primary`}>
            <Footprints className={`${compact ? 'h-6 w-6' : 'h-7 w-7'}`} />
          </span>
          <div>
            <p className={`${compact ? 'text-[26px]' : 'text-[28px]'} font-black leading-none tracking-tight text-[#171b23]`}>Kick Count</p>
            <p className="text-xs font-bold text-[#687281]">{subtitle}</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 overflow-hidden rounded-2xl border border-[#dfe5eb] bg-white">
          {rangeOptions.map(option => (
            <button
              key={option.key}
              type="button"
              aria-label={option.label}
              aria-pressed={range === option.key}
              onClick={() => setRange(option.key)}
              className={`${compact ? 'h-10 w-11' : 'h-11 w-12'} min-h-0 text-sm font-black ${
                range === option.key
                  ? 'bg-primary text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                  : 'border-l border-[#dfe5eb] text-[#687281] first:border-l-0'
              }`}
            >
              {option.key}
            </button>
          ))}
        </div>
      </div>

      <div className={`${compact ? 'mt-3 pb-2' : 'mt-5 pb-4'} flex items-end gap-2 border-b border-[#edf0f3]`}>
        <span className={`${compact ? 'text-[44px]' : 'text-[62px]'} font-black leading-none tracking-tight text-primary`}>{total}</span>
        <div className={compact ? 'pb-1' : 'pb-2'}>
          <p className="text-sm font-black text-[#687281]">kicks</p>
          <p className="text-xs font-bold text-[#687281]">Avg {average.toFixed(1)} {unitLabel}</p>
        </div>
        <Info className={`${compact ? 'mb-2' : 'mb-3'} h-4 w-4 text-[#687281]`} />
      </div>

      <div className={`${compact ? 'mt-2' : 'mt-4'} grid grid-cols-[34px_1fr] gap-3`}>
        <div className={`flex ${chartHeight} flex-col justify-between pt-1 text-[12px] font-semibold text-[#687281]`}>
          <span>{Math.ceil(maxValue)}</span>
          <span>{showMidValue ? midValue : ''}</span>
          <span>0</span>
        </div>

        <div className={`relative ${chartHeight} border-l border-b border-[#e3e8ef] pl-2`}>
          <div className="absolute inset-x-2 top-1/3 border-t border-[#eef2f6]" />
          <div className="absolute inset-x-2 top-2/3 border-t border-[#eef2f6]" />
          {showAverageMarker && (
            <div
              className="absolute left-2 right-0 z-20 border-t-2 border-dashed border-[#29b8ad]"
              style={{ bottom: averagePosition }}
            >
              <span className="absolute right-0 -top-3 bg-white px-1 text-sm font-black text-[#29a99f]">
                Avg {average.toFixed(1)}
              </span>
            </div>
          )}

          <div className="relative z-10 flex h-full items-end gap-1">
            {buckets.map((bucket, index) => {
              const height = bucket.count > 0 ? `${Math.max((bucket.count / maxValue) * 100, 8)}%` : '4px'
              const isLatest = index === buckets.length - 1
              const shouldShowLabel =
                range === 'W' || index === 0 || index === buckets.length - 1 || (range === 'D' ? index % (compact ? 5 : 3) === 0 : index % 7 === 0)
              const showValue = bucket.count > 0 && (range !== 'M' || index % 5 === 0 || isLatest)

              return (
                <div key={bucket.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span
                    className={`h-4 text-center text-[11px] font-black leading-none ${
                      showValue ? (isLatest ? 'text-[#171b23]' : 'text-[#687281]') : 'text-transparent'
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
                            : 'bg-primary/80'
                          : 'bg-[#e7edf3]'
                      }`}
                      style={{ height }}
                    />
                  </div>
                  <span
                    className={`h-4 text-center text-[10px] font-bold leading-none ${
                      isLatest ? 'text-primary' : shouldShowLabel ? 'text-[#687281]' : 'text-transparent'
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

      {showRecordAction && (
        <button
          type="button"
          onClick={onRecord}
          disabled={recording || !onRecord}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-[18px] bg-primary px-5 py-3.5 text-lg font-black text-white shadow-[0_18px_30px_-20px_rgba(240,95,69,0.9)] disabled:opacity-70"
        >
          <Footprints className="h-6 w-6" />
          {recording ? 'Recording...' : 'Record Kick'}
        </button>
      )}

      {!showRecordAction && (
        <div className="mt-5 flex w-full items-center justify-between border-t border-[#edf0f3] pt-4 text-left">
          <span className="flex items-center gap-3 text-sm font-semibold text-[#687281]">
            <ShieldCheck className="h-5 w-5 text-[#29a99f]" />
            Babies are often active after meals and in the evening.
          </span>
        </div>
      )}
    </section>
  )
}
