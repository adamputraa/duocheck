/**
 * PendingTasksCard for DuoCare dashboard.
 */

import { ListChecks } from 'lucide-react'
import type { CareTask } from '@/hooks/useTasks'
import { TASK_CATEGORIES } from '@/lib/pregnancy'

interface PendingTasksCardProps {
  tasks: CareTask[]
  onViewAll: () => void
}

export default function PendingTasksCard({ tasks, onViewAll }: PendingTasksCardProps) {
  const top3 = tasks.slice(0, 3)

  return (
    <div className="bg-card rounded-2xl border border-border-light p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-dark flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-primary" />
          Pending Tasks
        </h3>
        <button onClick={onViewAll} className="text-xs text-primary font-medium min-h-[44px] flex items-center">
          View all ({tasks.length})
        </button>
      </div>
      {top3.length === 0 ? (
        <p className="text-sm text-text-muted">No pending tasks. 🎉</p>
      ) : (
        <div className="space-y-2">
          {top3.map(task => {
            const cat = TASK_CATEGORIES.find(c => c.value === task.category)
            return (
              <div key={task.id} className="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
                <span className="text-sm">{cat?.emoji || '📝'}</span>
                <p className="text-sm text-text-dark flex-1 truncate">{task.title}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
