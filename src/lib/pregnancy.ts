/**
 * Pregnancy calculation utilities for DuoCare.
 * All calculations are approximate and should not be used for medical diagnosis.
 */

export interface PregnancyInfo {
  currentWeek: number
  trimester: string
  trimesterNumber: number
  daysUntilDue: number
  gestationalAgeDays: number
}

/**
 * Calculate pregnancy info from due date.
 * Estimated pregnancy duration is 40 weeks (280 days).
 * gestational_age_days = 280 - days_until_due_date
 * current_week = floor(gestational_age_days / 7)
 * Clamped between 1 and 42.
 */
export function calculatePregnancyInfo(dueDate: string | Date): PregnancyInfo {
  const due = new Date(dueDate)
  const now = new Date()
  
  // Reset time to midnight for accurate day calculation
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const msPerDay = 86400000
  const daysUntilDue = Math.ceil((dueDay.getTime() - today.getTime()) / msPerDay)
  const gestationalAgeDays = 280 - daysUntilDue
  
  // Clamp week between 1 and 42
  const rawWeek = Math.floor(gestationalAgeDays / 7)
  const currentWeek = Math.max(1, Math.min(42, rawWeek))
  
  const { trimester, trimesterNumber } = calculateTrimester(currentWeek)
  
  return {
    currentWeek,
    trimester,
    trimesterNumber,
    daysUntilDue: Math.max(0, daysUntilDue),
    gestationalAgeDays: Math.max(0, gestationalAgeDays),
  }
}

/**
 * Calculate trimester from week number.
 * Week 1-13: First trimester
 * Week 14-27: Second trimester
 * Week 28+: Third trimester
 */
export function calculateTrimester(week: number): { trimester: string; trimesterNumber: number } {
  if (week <= 13) return { trimester: 'First Trimester', trimesterNumber: 1 }
  if (week <= 27) return { trimester: 'Second Trimester', trimesterNumber: 2 }
  return { trimester: 'Third Trimester', trimesterNumber: 3 }
}

/**
 * Check-in type definition
 */
export interface PregnancyCheckin {
  id: string
  couple_id: string
  user_id: string
  overall_feeling: string
  mood: string
  energy_level: string
  nausea_level: string
  pain_type: string
  pain_note: string | null
  swelling: string
  baby_movement: string
  appetite: string
  sleep_quality: string
  needs_from_husband: string
  note: string | null
  is_urgent: boolean
  created_at: string
}

/**
 * Check if a check-in has urgent/warning conditions.
 * Shows warning message after submit if any of these are true.
 */
export function isUrgentCheckin(checkin: Partial<PregnancyCheckin>): boolean {
  if (checkin.is_urgent) return true
  if (checkin.swelling === 'face') return true
  if (checkin.baby_movement === 'less_than_usual') return true
  if (checkin.nausea_level === 'severe') return true
  if (checkin.overall_feeling === 'unwell' && checkin.needs_from_husband === 'hospital') return true
  return false
}

/**
 * Get the urgent warning message.
 * This message is shown when a check-in has warning conditions.
 */
export function getUrgentWarningMessage(): string {
  return 'DuoCare cannot diagnose symptoms. If this feels serious or unusual, please contact your doctor, maternity ward, hospital, or emergency services immediately.'
}

/**
 * Labels for check-in fields
 */
export const FEELING_OPTIONS = [
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'okay', label: 'Okay', emoji: '🙂' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'unwell', label: 'Unwell', emoji: '🤒' },
] as const

export const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😄' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'emotional', label: 'Emotional', emoji: '🥺' },
  { value: 'irritated', label: 'Irritated', emoji: '😤' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
] as const

export const ENERGY_OPTIONS = [
  { value: 'high', label: 'High', emoji: '⚡' },
  { value: 'medium', label: 'Medium', emoji: '🔋' },
  { value: 'low', label: 'Low', emoji: '🪫' },
] as const

export const NAUSEA_OPTIONS = [
  { value: 'none', label: 'None', emoji: '✅' },
  { value: 'mild', label: 'Mild', emoji: '😕' },
  { value: 'moderate', label: 'Moderate', emoji: '🤢' },
  { value: 'severe', label: 'Severe', emoji: '🤮' },
] as const

export const PAIN_OPTIONS = [
  { value: 'none', label: 'None', emoji: '✅' },
  { value: 'back_pain', label: 'Back Pain', emoji: '🔙' },
  { value: 'cramp', label: 'Cramp', emoji: '😣' },
  { value: 'pelvic_pain', label: 'Pelvic Pain', emoji: '😖' },
  { value: 'headache', label: 'Headache', emoji: '🤕' },
  { value: 'other', label: 'Other', emoji: '💊' },
] as const

export const SWELLING_OPTIONS = [
  { value: 'none', label: 'None', emoji: '✅' },
  { value: 'feet', label: 'Feet', emoji: '🦶' },
  { value: 'hands', label: 'Hands', emoji: '🤚' },
  { value: 'face', label: 'Face', emoji: '😶' },
] as const

export const BABY_MOVEMENT_OPTIONS = [
  { value: 'normal', label: 'Normal', emoji: '👶' },
  { value: 'less_than_usual', label: 'Less than usual', emoji: '⚠️' },
  { value: 'not_sure', label: 'Not sure', emoji: '🤔' },
  { value: 'not_applicable', label: 'Not applicable', emoji: '➖' },
] as const

export const APPETITE_OPTIONS = [
  { value: 'normal', label: 'Normal', emoji: '🍽️' },
  { value: 'low', label: 'Low', emoji: '😐' },
  { value: 'craving', label: 'Craving', emoji: '🤤' },
  { value: 'cannot_eat', label: 'Cannot eat', emoji: '🚫' },
] as const

export const SLEEP_OPTIONS = [
  { value: 'good', label: 'Good', emoji: '😴' },
  { value: 'okay', label: 'Okay', emoji: '😑' },
  { value: 'poor', label: 'Poor', emoji: '😵' },
] as const

export const NEEDS_OPTIONS = [
  { value: 'none', label: 'None', emoji: '✅' },
  { value: 'food', label: 'Food', emoji: '🍔' },
  { value: 'drink', label: 'Drink', emoji: '🥤' },
  { value: 'massage', label: 'Massage', emoji: '💆' },
  { value: 'pickup', label: 'Pickup', emoji: '🚗' },
  { value: 'rest_support', label: 'Rest Support', emoji: '🛋️' },
  { value: 'call_me', label: 'Call Me', emoji: '📞' },
  { value: 'hospital', label: 'Hospital', emoji: '🏥' },
  { value: 'other', label: 'Other', emoji: '📝' },
] as const

export const APPOINTMENT_TYPES = [
  { value: 'checkup', label: 'Checkup' },
  { value: 'scan', label: 'Scan' },
  { value: 'blood_test', label: 'Blood Test' },
  { value: 'mgtt', label: 'MGTT' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
] as const

export const TASK_CATEGORIES = [
  { value: 'food', label: 'Food', emoji: '🍔' },
  { value: 'medicine', label: 'Medicine', emoji: '💊' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'baby_prep', label: 'Baby Prep', emoji: '👶' },
  { value: 'appointment', label: 'Appointment', emoji: '📅' },
  { value: 'other', label: 'Other', emoji: '📝' },
] as const

export const HOSPITAL_BAG_CATEGORIES = [
  { value: 'wife', label: 'Wife' },
  { value: 'baby', label: 'Baby' },
  { value: 'husband', label: 'Husband' },
  { value: 'documents', label: 'Documents' },
  { value: 'other', label: 'Other' },
] as const

/**
 * Default hospital bag items to seed when pregnancy profile is created.
 */
export const DEFAULT_HOSPITAL_BAG_ITEMS: Array<{ item_name: string; category: string }> = [
  // Wife
  { item_name: 'Comfortable clothes', category: 'wife' },
  { item_name: 'Maternity pads', category: 'wife' },
  { item_name: 'Toiletries', category: 'wife' },
  { item_name: 'Nursing bra', category: 'wife' },
  { item_name: 'Towel', category: 'wife' },
  // Baby
  { item_name: 'Baby clothes', category: 'baby' },
  { item_name: 'Diapers', category: 'baby' },
  { item_name: 'Baby blanket', category: 'baby' },
  { item_name: 'Wet wipes', category: 'baby' },
  { item_name: 'Mittens and socks', category: 'baby' },
  // Husband
  { item_name: 'Phone charger', category: 'husband' },
  { item_name: 'Cash/card', category: 'husband' },
  { item_name: 'Snacks', category: 'husband' },
  { item_name: 'Extra clothes', category: 'husband' },
  { item_name: 'Parking plan', category: 'husband' },
  // Documents
  { item_name: 'IC/passport', category: 'documents' },
  { item_name: 'Appointment book', category: 'documents' },
  { item_name: 'Insurance card if applicable', category: 'documents' },
  { item_name: 'Hospital registration documents', category: 'documents' },
]

/**
 * Urgent warning signs for the Safety page.
 */
export const URGENT_WARNING_SIGNS = [
  'Severe headache that does not go away',
  'Vision changes',
  'Fainting or severe dizziness',
  'Fever',
  'Chest pain',
  'Trouble breathing',
  'Severe belly pain',
  'Heavy bleeding',
  'Fluid leaking',
  'Extreme swelling of face or hands',
  'Baby movement feels reduced or unusual',
  'Thoughts of self-harm or harming baby',
]
