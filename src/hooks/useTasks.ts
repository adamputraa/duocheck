/**
 * Care tasks hook for DuoCare.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'

export interface CareTask {
  id: string
  couple_id: string
  assigned_to: string | null
  created_by: string
  title: string
  description: string | null
  category: string
  status: string
  due_date: string | null
  created_at: string
  updated_at: string
}

export function useTasks() {
  const { user } = useAuth()
  const { couple } = useCouple()
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!couple) { setLoading(false); return }
    setLoading(true)

    const { data, error: fetchErr } = await supabase
      .from('care_tasks').select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })

    if (fetchErr) setError('Failed to load tasks.')
    else setTasks((data as CareTask[]) ?? [])
    setLoading(false)
  }, [couple])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const pending = tasks.filter(t => t.status === 'pending')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const done = tasks.filter(t => t.status === 'done')

  const addTask = useCallback(async (data: Partial<CareTask>): Promise<boolean> => {
    if (!user || !couple) return false
    const { error: err } = await supabase.from('care_tasks').insert({
      couple_id: couple.id, created_by: user.id, ...data,
    })
    if (err) { setError('Failed to add task.'); return false }
    await fetchTasks()
    return true
  }, [user, couple, fetchTasks])

  const updateTask = useCallback(async (id: string, data: Partial<CareTask>): Promise<boolean> => {
    const { error: err } = await supabase.from('care_tasks').update(data).eq('id', id)
    if (err) { setError('Failed to update task.'); return false }
    await fetchTasks()
    return true
  }, [fetchTasks])

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('care_tasks').delete().eq('id', id)
    if (err) { setError('Failed to delete task.'); return false }
    await fetchTasks()
    return true
  }, [fetchTasks])

  return {
    tasks, pending, inProgress, done,
    loading, error, addTask, updateTask, deleteTask,
    refresh: fetchTasks,
  }
}
