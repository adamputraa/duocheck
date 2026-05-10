import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmergency } from '@/hooks/useEmergency'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { URGENT_WARNING_SIGNS } from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import EmergencyHelpModal from '@/components/EmergencyHelpModal'
import { AlertTriangle, Loader2, Phone, Plus, Trash2, X } from 'lucide-react'

const CONTACT_TYPES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'family', label: 'Family' },
  { value: 'other', label: 'Other' },
]

export default function SafetyPage() {
  const navigate = useNavigate()
  const { partner } = useCouple()
  const { profile } = usePregnancy()
  const { contacts, triggerEmergency, addContact, deleteContact } = useEmergency()
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactType, setContactType] = useState('other')
  const [addingContact, setAddingContact] = useState(false)

  const handleEmergency = async (opts: { message?: string; includeLocation?: boolean }) => {
    setEmergencyLoading(true)
    await triggerEmergency(opts)
    setEmergencyLoading(false)
    setShowEmergencyModal(false)
  }

  const handleAddContact = async () => {
    if (!contactName || !contactPhone) return
    setAddingContact(true)
    await addContact({ name: contactName, phone: contactPhone, contact_type: contactType })
    setAddingContact(false)
    setContactName('')
    setContactPhone('')
    setContactType('other')
    setShowAddContact(false)
  }

  return (
    <div className="app-page">
      <AppHeader subtitle="Safety" onSettingsClick={() => navigate('/settings')} />
      <main className="app-main space-y-5">
        <section className="rounded-[24px] bg-emergency text-white p-5 shadow-[0_14px_30px_-22px_rgba(239,68,68,0.95)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight">Emergency Help</h2>
              <p className="text-sm text-white/85 mt-1">Send an urgent alert to your partner and use your saved contacts.</p>
            </div>
          </div>
          <button onClick={() => setShowEmergencyModal(true)}
            className="mt-5 w-full min-h-12 rounded-2xl bg-white text-emergency font-black">
            Start Emergency Alert
          </button>
        </section>

        <section className="app-card p-5">
          <p className="app-section-title">Medical Attention</p>
          <h2 className="text-lg font-black text-text-dark mt-1">When to get help</h2>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            DuoCare does not diagnose. If symptoms feel serious, unusual, or worrying, contact your doctor, maternity ward, hospital, or emergency services immediately.
          </p>
          <div className="mt-4 grid gap-2">
            {URGENT_WARNING_SIGNS.map((sign) => (
              <div key={sign} className="flex items-start gap-3 rounded-2xl bg-red-50/70 px-3 py-3">
                <AlertTriangle className="w-4 h-4 text-emergency mt-0.5 shrink-0" />
                <span className="text-sm font-semibold text-text-dark">{sign}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="app-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-section-title">Call List</p>
              <h2 className="text-lg font-black text-text-dark mt-1">Quick contacts</h2>
            </div>
            <button onClick={() => setShowAddContact(true)} className="btn-secondary px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {partner && (
              <a href={`tel:${partner.phone || ''}`} className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
                <ContactIcon tone="primary" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-text-dark truncate">{partner.display_name || 'Partner'}</p>
                  <p className="text-xs text-text-muted">{partner.phone || 'No phone set'}</p>
                </div>
              </a>
            )}

            {profile?.doctor_name && (
              <a href={profile.doctor_phone ? `tel:${profile.doctor_phone}` : '#'} className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
                <ContactIcon tone="success" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-text-dark truncate">{profile.doctor_name}</p>
                  <p className="text-xs text-text-muted">{profile.doctor_phone || 'No phone set'}</p>
                </div>
              </a>
            )}

            {contacts.map(contact => (
              <div key={contact.id} className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <ContactIcon tone="warning" />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-text-dark truncate">{contact.name}</p>
                    <p className="text-xs text-text-muted">{contact.phone}</p>
                  </div>
                </a>
                <button onClick={() => deleteContact(contact.id)} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center" aria-label="Delete contact">
                  <Trash2 className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            ))}

            {contacts.length === 0 && !partner && !profile?.doctor_name && (
              <p className="text-sm text-text-muted py-4">No contacts added yet.</p>
            )}
          </div>
        </section>
      </main>

      {showEmergencyModal && (
        <EmergencyHelpModal
          partnerName={partner?.display_name || 'your partner'}
          onConfirm={handleEmergency}
          onClose={() => setShowEmergencyModal(false)}
          loading={emergencyLoading}
        />
      )}

      {showAddContact && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45">
          <div className="bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-text-dark">Add contact</h3>
              <button onClick={() => setShowAddContact(false)} className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={contactName} onChange={event => setContactName(event.target.value)} className="app-input" />
              <input type="tel" placeholder="Phone" value={contactPhone} onChange={event => setContactPhone(event.target.value)} className="app-input" />
              <select value={contactType} onChange={event => setContactType(event.target.value)} className="app-input">
                {CONTACT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <button onClick={handleAddContact} disabled={addingContact || !contactName || !contactPhone}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {addingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {addingContact ? 'Adding...' : 'Add contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeRoute="/safety" />
    </div>
  )
}

function ContactIcon({ tone }: { tone: 'primary' | 'success' | 'warning' }) {
  const colors = {
    primary: 'bg-primary-light text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }

  return (
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${colors[tone]}`}>
      <Phone className="w-5 h-5" />
    </div>
  )
}
