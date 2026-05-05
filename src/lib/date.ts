/**
 * Date formatting utilities using date-fns for DuoCheck.
 * Provides human-readable relative and absolute time formatting,
 * staleness checks, and date grouping.
 */

import {
  formatDistanceToNowStrict,
  format,
  isToday,
  isYesterday,
  parseISO,
  isValid,
} from 'date-fns'

/**
 * Parses a date input (ISO string or Date object) into a valid Date.
 * Returns current date if input is invalid.
 */
function parseDate(date: string | Date): Date {
  if (date instanceof Date) {
    return isValid(date) ? date : new Date()
  }
  const parsed = parseISO(date)
  return isValid(parsed) ? parsed : new Date()
}

/**
 * Returns a human-readable relative time string.
 * Examples: "2 minutes ago", "1 hour ago", "3 days ago"
 */
export function formatRelativeTime(date: string | Date): string {
  const parsed = parseDate(date)
  return formatDistanceToNowStrict(parsed, { addSuffix: true })
}

/**
 * Returns an absolute formatted time string.
 * Example: "Jan 15, 2025, 3:30 PM"
 */
export function formatAbsoluteTime(date: string | Date): string {
  const parsed = parseDate(date)
  return format(parsed, 'MMM d, yyyy, h:mm a')
}

/**
 * Checks if a date is older than the given threshold in hours.
 * Useful for determining if a partner's last check-in is stale.
 * @param lastUpdated - The date to check
 * @param thresholdHours - Number of hours after which the data is considered stale
 * @returns true if the date is older than the threshold
 */
export function isStale(lastUpdated: string | Date, thresholdHours: number): boolean {
  const parsed = parseDate(lastUpdated)
  const thresholdMs = thresholdHours * 60 * 60 * 1000
  return Date.now() - parsed.getTime() > thresholdMs
}

/**
 * Groups a date into a human-readable category.
 * @returns 'Today', 'Yesterday', or 'Older'
 */
export function groupByDate(date: string | Date): 'Today' | 'Yesterday' | 'Older' {
  const parsed = parseDate(date)
  if (isToday(parsed)) return 'Today'
  if (isYesterday(parsed)) return 'Yesterday'
  return 'Older'
}
