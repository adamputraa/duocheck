/**
 * Hospital bag hook for DuoCare.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCouple } from '@/hooks/useCouple'
import { DEFAULT_HOSPITAL_BAG_ITEMS } from '@/lib/pregnancy'

export interface HospitalBagItem {
  id: string
  couple_id: string
  item_name: string
  category: string
  is_checked: boolean
  created_by: string
  created_at: string
}

export function useHospitalBag() {
  const { user } = useAuth()
  const { couple } = useCouple()
  const [items, setItems] = useState<HospitalBagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!couple) { setLoading(false); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('hospital_bag_items').select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })
    if (err) setError('Failed to load hospital bag.')
    else setItems((data as HospitalBagItem[]) ?? [])
    setLoading(false)
  }, [couple])

  useEffect(() => { fetchItems() }, [fetchItems])

  const totalItems = items.length
  const checkedItems = items.filter(i => i.is_checked).length
  const completionPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  const byCategory = {
    wife: items.filter(i => i.category === 'wife'),
    baby: items.filter(i => i.category === 'baby'),
    husband: items.filter(i => i.category === 'husband'),
    documents: items.filter(i => i.category === 'documents'),
    other: items.filter(i => i.category === 'other'),
  }

  const seedDefaults = useCallback(async (): Promise<boolean> => {
    if (!user || !couple) return false
    const rows = DEFAULT_HOSPITAL_BAG_ITEMS.map(item => ({
      couple_id: couple.id, created_by: user.id,
      item_name: item.item_name, category: item.category,
    }))
    const { error: err } = await supabase.from('hospital_bag_items').insert(rows)
    if (err) { setError('Failed to seed hospital bag.'); return false }
    await fetchItems()
    return true
  }, [user, couple, fetchItems])

  const toggleItem = useCallback(async (id: string, checked: boolean): Promise<boolean> => {
    const { error: err } = await supabase
      .from('hospital_bag_items').update({ is_checked: checked }).eq('id', id)
    if (err) return false
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: checked } : i))
    return true
  }, [])

  const addItem = useCallback(async (itemName: string, category: string): Promise<boolean> => {
    if (!user || !couple) return false
    const { error: err } = await supabase.from('hospital_bag_items').insert({
      couple_id: couple.id, created_by: user.id,
      item_name: itemName, category,
    })
    if (err) { setError('Failed to add item.'); return false }
    await fetchItems()
    return true
  }, [user, couple, fetchItems])

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase
      .from('hospital_bag_items').delete().eq('id', id)
    if (err) return false
    setItems(prev => prev.filter(i => i.id !== id))
    return true
  }, [])

  return {
    items, byCategory, totalItems, checkedItems, completionPercent,
    loading, error, seedDefaults, toggleItem, addItem, deleteItem,
    refresh: fetchItems,
  }
}
