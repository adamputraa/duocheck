/**
 * Settings page for DuoCare.
 * Profile, pregnancy profile, privacy, couple info, account.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { usePregnancy } from '@/hooks/usePregnancy'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { User, Baby, Shield, Users, LogOut, AlertTriangle, ArrowLeft } from 'lucide-react'

interface PrivacySettings {
  share_status_with_partner: boolean
  email_alerts_enabled: boolean
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { couple, partner, isInCouple, userRole, refreshCouple } = useCouple()
  const { profile, updateProfile } = usePregnancy()

  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Pregnancy fields
  const [dueDate, setDueDate] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [doctorPhone, setDoctorPhone] = useState('')
  const [bloodType, setBloodType] = useState('')
  const [riskNotes, setRiskNotes] = useState('')
  const [savingPreg, setSavingPreg] = useState(false)
  const [pregSaved, setPregSaved] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles').select('display_name, full_name, phone')
        .eq('id', user.id).single()
      if (profileData) {
        setDisplayName(profileData.display_name || '')
        setFullName(profileData.full_name || '')
        setPhone(profileData.phone || '')
      }

      const { data: privData } = await supabase
        .from('privacy_settings').select('share_status_with_partner, email_alerts_enabled')
        .eq('user_id', user.id).single()
      if (privData) setPrivacy(privData as PrivacySettings)

      setLoading(false)
    }
    load()
  }, [user])

  useEffect(() => {
    if (profile) {
      setDueDate(profile.due_date || '')
      setHospitalName(profile.hospital_name || '')
      setClinicName(profile.clinic_name || '')
      setDoctorName(profile.doctor_name || '')
      setDoctorPhone(profile.doctor_phone || '')
      setBloodType(profile.blood_type || '')
      setRiskNotes(profile.risk_notes || '')
    }
  }, [profile])

  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    await supabase.from('profiles').update({
      display_name: displayName.trim(), full_name: fullName.trim(), phone: phone.trim(),
    }).eq('id', user.id)
    setSavingProfile(false); setProfileSaved(true)
    await refreshCouple()
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const updateRole = async (newRole: 'wife' | 'husband') => {
    if (!user || userRole === newRole) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    if (isInCouple) {
      await supabase.from('couple_members').update({ role: newRole }).eq('user_id', user.id)
    }
    await refreshCouple()
  }

  const savePregnancy = async () => {
    if (!profile) return
    setSavingPreg(true)
    await updateProfile({
      due_date: dueDate, hospital_name: hospitalName || null,
      clinic_name: clinicName || null, doctor_name: doctorName || null,
      doctor_phone: doctorPhone || null, blood_type: bloodType || null,
      risk_notes: riskNotes || null,
    } as any)
    setSavingPreg(false); setPregSaved(true)
    setTimeout(() => setPregSaved(false), 2000)
  }

  const togglePrivacy = async (field: keyof PrivacySettings) => {
    if (!user || !privacy) return
    const newVal = !privacy[field]
    await supabase.from('privacy_settings').update({ [field]: newVal }).eq('user_id', user.id)
    setPrivacy({ ...privacy, [field]: newVal })
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    navigate('/login')
  }

  const inputCls = 'w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'

  if (loading) {
    return (
      <div className="min-h-dvh bg-cream pb-24">
        <AppHeader />
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center py-12 text-text-muted animate-pulse">Loading settings…</div>
        </main>
        <BottomNav activeRoute="/dashboard" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader subtitle="Settings" />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Back button */}
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-sm text-text-muted active:text-primary min-h-[44px]">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Profile */}
        <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Profile
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Email</label>
              <p className="text-sm text-text-dark bg-cream rounded-lg px-3 py-2">{user?.email}</p>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Role</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateRole('wife')}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition ${userRole === 'wife' ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-border-light'}`}
                >👩 Wife</button>
                <button
                  type="button"
                  onClick={() => updateRole('husband')}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition ${userRole === 'husband' ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-border-light'}`}
                >👨 Husband</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
            </div>
            <button onClick={saveProfile} disabled={savingProfile}
              className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 min-h-[44px]">
              {savingProfile ? 'Saving…' : profileSaved ? '✓ Saved' : 'Save Profile'}
            </button>
          </div>
        </section>

        {/* Pregnancy Profile */}
        {profile && (
          <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
            <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
              <Baby className="w-5 h-5 text-primary" /> Pregnancy Profile
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              </div>
              <input type="text" placeholder="Hospital" value={hospitalName} onChange={e => setHospitalName(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Clinic" value={clinicName} onChange={e => setClinicName(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Doctor name" value={doctorName} onChange={e => setDoctorName(e.target.value)} className={inputCls} />
              <input type="tel" placeholder="Doctor phone" value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Blood type" value={bloodType} onChange={e => setBloodType(e.target.value)} className={inputCls} />
              <textarea placeholder="Notes/risk factors" value={riskNotes} onChange={e => setRiskNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 bg-cream border border-border-light rounded-xl text-text-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={savePregnancy} disabled={savingPreg}
                className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 min-h-[44px]">
                {savingPreg ? 'Saving…' : pregSaved ? '✓ Saved' : 'Save Pregnancy Info'}
              </button>
            </div>
          </section>
        )}

        {/* Privacy */}
        <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Privacy
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-dark">Share status with partner</p>
                <p className="text-xs text-text-muted">Allow partner to see your check-ins</p>
              </div>
              <button onClick={() => togglePrivacy('share_status_with_partner')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition min-h-[44px] min-w-[52px] p-1 ${
                  privacy?.share_status_with_partner ? 'bg-success' : 'bg-gray-300'
                }`} role="switch" aria-checked={privacy?.share_status_with_partner}>
                <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  privacy?.share_status_with_partner ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-dark">Email alerts</p>
                <p className="text-xs text-text-muted">Receive email for emergency alerts</p>
              </div>
              <button onClick={() => togglePrivacy('email_alerts_enabled')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition min-h-[44px] min-w-[52px] p-1 ${
                  privacy?.email_alerts_enabled ? 'bg-success' : 'bg-gray-300'
                }`} role="switch" aria-checked={privacy?.email_alerts_enabled}>
                <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  privacy?.email_alerts_enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* Couple Info */}
        {isInCouple && (
          <section className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
            <h2 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Couple Info
            </h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-text-muted">Couple:</span> <span className="text-text-dark font-medium">{couple?.name || 'Unnamed'}</span></div>
              <div><span className="text-text-muted">Partner:</span> <span className="text-text-dark font-medium">{partner?.display_name || 'Waiting…'}</span></div>
              <div><span className="text-text-muted">Joined:</span> <span className="text-text-dark font-medium">
                {couple?.created_at ? new Date(couple.created_at).toLocaleDateString() : 'Unknown'}
              </span></div>
            </div>
          </section>
        )}

        {/* Account */}
        <section className="bg-card rounded-2xl border border-emergency/20 p-5 shadow-sm">
          <h2 className="font-semibold text-emergency mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Account
          </h2>
          <button onClick={handleSignOut} disabled={signingOut}
            className="w-full h-12 border border-emergency/30 text-emergency font-semibold rounded-xl hover:bg-emergency/5 transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
            <LogOut className="w-5 h-5" />
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </section>
      </main>
      <BottomNav activeRoute="/dashboard" />
    </div>
  )
}
