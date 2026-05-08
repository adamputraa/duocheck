/**
 * Safety page for DuoCare.
 * "When to Get Help" — urgent warning signs, emergency contacts, disclaimer.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmergency } from '@/hooks/useEmergency'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { URGENT_WARNING_SIGNS } from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import EmergencyHelpModal from '@/components/EmergencyHelpModal'
import { Phone, AlertTriangle, Plus, X, Loader2, Trash2 } from 'lucide-react'

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
    await addContact({ name: contactName, phone: contactPhone, contact_type: contactType } as any)
    setAddingContact(false); setContactName(''); setContactPhone('')
    setContactType('other'); setShowAddContact(false)
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader subtitle="Safety" onSettingsClick={() => navigate('/settings')} />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Disclaimer */}
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Important:</strong> DuoCare cannot diagnose or replace medical advice. If symptoms feel serious, unusual, or worrying, contact your doctor, maternity ward, hospital, or emergency services immediately.
          </p>
        </div>

        {/* Emergency Help Button */}
        <button onClick={() => setShowEmergencyModal(true)}
          className="w-full flex items-center justify-center gap-2 h-14 bg-emergency text-white font-bold rounded-xl shadow-lg shadow-red-200 active:bg-red-600 transition min-h-[44px]">
          <AlertTriangle className="w-5 h-5" /> Emergency Help
        </button>

        {/* When to Get Help */}
        <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <h2 className="text-base font-bold text-text-dark mb-3">When to Get Help</h2>
          <p className="text-xs text-text-muted mb-3">Contact your doctor or go to the hospital if you experience:</p>
          <ul className="space-y-2">
            {URGENT_WARNING_SIGNS.map((sign, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emergency mt-0.5 shrink-0">⚠️</span>
                <span className="text-sm text-text-dark">{sign}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Contacts */}
        <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-text-dark">Quick Contacts</h2>
            <button onClick={() => setShowAddContact(true)} className="text-xs text-primary font-medium min-h-[44px] flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2">
            {/* Partner */}
            {partner && (
              <a href={`tel:${partner.phone || ''}`}
                className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3 active:bg-primary-light/50 transition min-h-[44px]">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-dark">{partner.display_name || 'Husband'}</p>
                  <p className="text-xs text-text-muted">{partner.phone || 'No phone set'}</p>
                </div>
              </a>
            )}

            {/* Doctor from pregnancy profile */}
            {profile?.doctor_name && (
              <a href={profile.doctor_phone ? `tel:${profile.doctor_phone}` : '#'}
                className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3 active:bg-primary-light/50 transition min-h-[44px]">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-dark">{profile.doctor_name}</p>
                  <p className="text-xs text-text-muted">{profile.doctor_phone || 'No phone set'}</p>
                </div>
              </a>
            )}

            {/* Emergency contacts */}
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3">
                <a href={`tel:${c.phone}`}
                  className="flex items-center gap-3 flex-1 min-w-0 active:bg-primary-light/50 transition min-h-[44px]">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark">{c.name}</p>
                    <p className="text-xs text-text-muted">{c.phone}</p>
                  </div>
                </a>
                <button onClick={() => deleteContact(c.id)} className="w-8 h-8 flex items-center justify-center shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                </button>
              </div>
            ))}

            {contacts.length === 0 && !partner && !profile?.doctor_name && (
              <p className="text-sm text-text-muted text-center py-2">No contacts added yet.</p>
            )}
          </div>
        </div>

        {/* Hospital Bag shortcut */}
        <button onClick={() => navigate('/hospital-bag')}
          className="w-full flex items-center justify-center gap-2 h-12 border border-border-light bg-card text-text-dark font-semibold rounded-xl min-h-[44px]">
          🎒 Hospital Bag Checklist
        </button>
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
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-dark">Add Contact</h3>
              <button onClick={() => setShowAddContact(false)} className="w-10 h-10 flex items-center justify-center"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Name *" value={contactName} onChange={e => setContactName(e.target.value)}
                className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="tel" placeholder="Phone *" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <select value={contactType} onChange={e => setContactType(e.target.value)}
                className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="doctor">Doctor</option>
                <option value="clinic">Clinic</option>
                <option value="hospital">Hospital</option>
                <option value="family">Family</option>
                <option value="other">Other</option>
              </select>
              <button onClick={handleAddContact} disabled={addingContact || !contactName || !contactPhone}
                className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
                {addingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {addingContact ? 'Adding…' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeRoute="/safety" />
    </div>
  )
}
