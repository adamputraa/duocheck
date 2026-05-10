/**
 * Hospital Bag page for DuoCare.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHospitalBag } from '@/hooks/useHospitalBag'
import { HOSPITAL_BAG_CATEGORIES } from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'

export default function HospitalBagPage() {
  const { byCategory, completionPercent, checkedItems, totalItems, loading,
    toggleItem, addItem, deleteItem } = useHospitalBag()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('other')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    await addItem(newName.trim(), newCat)
    setAdding(false); setNewName(''); setShowAdd(false)
  }

  return (
    <div className="app-page">
      <AppHeader subtitle="Hospital Bag" onSettingsClick={() => navigate('/settings')} />
      <main className="app-main space-y-4">
        {/* Progress */}
        <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-text-dark">Packing Progress</h2>
            <span className="text-lg font-bold text-primary">{completionPercent}%</span>
          </div>
          <div className="w-full bg-cream rounded-full h-4 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-1">{checkedItems} of {totalItems} items packed</p>
        </div>

        <button onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-semibold rounded-xl min-h-[44px]">
          <Plus className="w-5 h-5" /> Add Item
        </button>

        {loading && <div className="text-center py-8 text-text-muted animate-pulse">Loading…</div>}

        {/* Categories */}
        {HOSPITAL_BAG_CATEGORIES.map(cat => {
          const items = byCategory[cat.value as keyof typeof byCategory] || []
          if (items.length === 0) return null
          const catChecked = items.filter(i => i.is_checked).length
          return (
            <div key={cat.value}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-dark">{cat.label}</h3>
                <span className="text-xs text-text-muted">{catChecked}/{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl border border-border-light px-4 py-3 shadow-sm">
                    <button onClick={() => toggleItem(item.id, !item.is_checked)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 min-h-[44px] min-w-[24px] transition ${
                        item.is_checked ? 'bg-success border-success' : 'border-border-light'
                      }`}>
                      {item.is_checked && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                    <span className={`flex-1 text-sm ${item.is_checked ? 'text-text-muted line-through' : 'text-text-dark'}`}>
                      {item.item_name}
                    </span>
                    <button onClick={() => deleteItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </main>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-dark">Add Item</h3>
              <button onClick={() => setShowAdd(false)} className="w-10 h-10 flex items-center justify-center"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Item name" value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {HOSPITAL_BAG_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button onClick={handleAdd} disabled={adding || !newName.trim()}
                className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

        <BottomNav activeRoute="/hospital-bag" />
    </div>
  )
}
