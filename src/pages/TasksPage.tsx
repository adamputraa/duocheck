/**
 * Tasks page for DuoCare.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { useTasks, type CareTask } from '@/hooks/useTasks'
import { TASK_CATEGORIES } from '@/lib/pregnancy'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { Plus, X, Loader2, Trash2 } from 'lucide-react'

export default function TasksPage() {
  const { user } = useAuth()
  const { partner } = useCouple()
  const { pending, inProgress, done, loading, addTask, updateTask, deleteTask } = useTasks()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('other')
    setAssignedTo(null); setDueDate(''); setShowForm(false)
  }

  const handleSave = async () => {
    if (!title) return
    setSaving(true)
    await addTask({
      title, description: description || null, category,
      assigned_to: assignedTo, due_date: dueDate || null,
    } as any)
    setSaving(false); resetForm()
  }

  const handleStatusChange = async (task: CareTask, status: string) => {
    await updateTask(task.id, { status } as any)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-amber-800',
    in_progress: 'bg-primary-light text-primary-dark',
    done: 'bg-success/10 text-green-800',
  }

  const renderTask = (task: CareTask) => {
    const cat = TASK_CATEGORIES.find(c => c.value === task.category)
    return (
      <div key={task.id} className="bg-card rounded-2xl border border-border-light p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{cat?.emoji || '📝'}</span>
              <p className="text-sm font-semibold text-text-dark truncate">{task.title}</p>
            </div>
            {task.description && <p className="text-xs text-text-muted mb-2">{task.description}</p>}
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[task.status] || ''}`}>
                {task.status.replace('_', ' ')}
              </span>
              {task.due_date && (
                <span className="text-[10px] bg-cream text-text-muted px-2 py-0.5 rounded-full">
                  📅 {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => deleteTask(task.id)} className="w-9 h-9 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4 text-emergency" />
          </button>
        </div>
        {task.status !== 'done' && (
          <div className="flex gap-2 mt-3">
            {task.status === 'pending' && (
              <button onClick={() => handleStatusChange(task, 'in_progress')}
                className="flex-1 h-10 text-xs font-semibold rounded-lg border border-primary text-primary active:bg-primary-light transition min-h-[44px]">
                Start
              </button>
            )}
            <button onClick={() => handleStatusChange(task, 'done')}
              className="flex-1 h-10 text-xs font-semibold rounded-lg bg-success text-white active:bg-green-600 transition min-h-[44px]">
              Done ✓
            </button>
          </div>
        )}
      </div>
    )
  }

  const inputCls = 'w-full h-12 px-3 bg-cream border border-border-light rounded-xl text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <AppHeader subtitle="Care Tasks" onSettingsClick={() => navigate('/settings')} />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-semibold rounded-xl min-h-[44px]">
          <Plus className="w-5 h-5" /> Add Task
        </button>

        {loading && <div className="text-center py-8 text-text-muted animate-pulse">Loading…</div>}

        {!loading && pending.length === 0 && inProgress.length === 0 && done.length === 0 && (
          <div className="bg-card rounded-2xl border border-border-light p-6 shadow-sm text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm text-text-muted">No tasks yet. Add one to get started.</p>
          </div>
        )}

        {pending.length > 0 && (
          <><h2 className="text-sm font-semibold text-text-muted">Pending ({pending.length})</h2>
          <div className="space-y-2">{pending.map(renderTask)}</div></>
        )}
        {inProgress.length > 0 && (
          <><h2 className="text-sm font-semibold text-text-muted">In Progress ({inProgress.length})</h2>
          <div className="space-y-2">{inProgress.map(renderTask)}</div></>
        )}
        {done.length > 0 && (
          <><h2 className="text-sm font-semibold text-text-muted">Done ({done.length})</h2>
          <div className="space-y-2">{done.map(renderTask)}</div></>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-dark">New Task</h3>
              <button onClick={resetForm} className="w-10 h-10 flex items-center justify-center"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Task title *" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
              <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 bg-cream border border-border-light rounded-xl text-text-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {TASK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
              <select value={assignedTo || ''} onChange={e => setAssignedTo(e.target.value || null)} className={inputCls}>
                <option value="">Assign to (optional)</option>
                {user && <option value={user.id}>Me</option>}
                {partner && <option value={partner.id}>{partner.display_name || 'Partner'}</option>}
              </select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              <button onClick={handleSave} disabled={saving || !title}
                className="w-full h-12 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeRoute="/tasks" />
    </div>
  )
}
