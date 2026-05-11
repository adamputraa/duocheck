import { useMemo, useState } from 'react'
import { format, startOfDay, startOfHour, subDays, subHours } from 'date-fns'
import { Footprints, Info } from 'lucide-react'
import type { BabyKick } from '@/hooks/useKicks'

type RangeKey = 'D' | 'W' | 'M'

interface Bucket {
  key: string
  label: string
  count: number
}

const rangeOptions: Array<{ key: RangeKey; label: string }> = [
  { key: 'D', label: 'D' },
  { key: 'W', label: 'W' },
  { key: 'M', label: 'M' }
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
          return { key: hourKey(hour), label: format(hour, 'HH:mm'), count: 0 }
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

  const { buckets, average, maxValue } = useMemo(() => {
    const nextBuckets = buildBuckets(range, kicks)
    const nextTotal = nextBuckets.reduce((sum, bucket) => sum + bucket.count, 0)
    const nextAverage = nextTotal / nextBuckets.length
    const nextMax = Math.max(...nextBuckets.map(bucket => bucket.count), 30)

    return {
      buckets: nextBuckets,
      average: nextAverage,
      maxValue: nextMax
    }
  }, [range, kicks])

  const averagePosition = `${Math.min(100, (average / maxValue) * 100)}%`
  const chartHeight = compact ? 'h-32' : 'h-44'

  return (
    <section className="rounded-[28px] border border-white bg-white p-5 shadow-[0_8px_24px_-12px_rgba(17,24,39,0.1)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-[#171b23]">Kick Count</h2>
          <Info className="h-5 w-5 text-[#A0AEC0]" />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#F8FAFC] p-1">
          {rangeOptions.map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRange(option.key)}
              className={`h-8 w-12 rounded-lg text-sm font-bold transition-all ${
                range === option.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-[#A0AEC0] hover:text-[#687281]'
              }`}
            >
              {option.key}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[30px_1fr] gap-4">
        <div className={`flex ${chartHeight} flex-col justify-between text-[11px] font-bold text-[#A0AEC0]`}>
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.66)}</span>
          <span>{Math.round(maxValue * 0.33)}</span>
          <span>0</span>
        </div>

        <div className={`relative ${chartHeight} border-b border-[#F1F5F9]`}>
          {/* Grid lines */}
          <div className="absolute inset-x-0 top-0 border-t border-[#F1F5F9]" />
          <div className="absolute inset-x-0 top-1/3 border-t border-[#F1F5F9]" />
          <div className="absolute inset-x-0 top-2/3 border-t border-[#F1F5F9]" />

          {/* Average Line */}
          <div
            className="absolute inset-x-0 z-20 border-t-2 border-dashed border-mint"
            style={{ bottom: averagePosition }}
          >
            <span className="absolute -right-2 -top-5 bg-white px-1 text-[11px] font-bold text-mint">
              Avg {average.toFixed(0)}
            </span>
          </div>

          <div className="relative z-10 flex h-full items-end justify-between gap-1.5 px-1">
            {buckets.map((bucket, index) => {
              const height = `${Math.max((bucket.count / maxValue) * 100, 2)}%`
              const isEven = index % 2 === 0
              
              return (
                <div key={bucket.key} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-sm bg-primary transition-all group-hover:bg-primary-dark"
                    style={{ height }}
                  />
                  {isEven && (
                    <span className="absolute -bottom-6 text-[10px] font-bold text-[#A0AEC0]">
                      {bucket.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <button
          type="button"
          onClick={onRecord}
          disabled={recording}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-[0_12px_24px_-8px_rgba(255,94,58,0.5)] transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          <Footprints className="h-6 w-6" />
          {recording ? 'Recording...' : 'Record Kick'}
        </button>
      </div>
    </section>
  )
}
