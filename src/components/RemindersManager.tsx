'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Plus, Loader2, Trash2 } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

export function RemindersManager({ patientId }: { patientId: string }) {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [isAdding, setIsAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchReminders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const fetchReminders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('patient_id', patientId)
      .order('time_of_day', { ascending: true })
    
    if (data) setReminders(data)
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !time) return
    setIsAdding(true)

    const { error } = await supabase
      .from('reminders')
      .insert({
        patient_id: patientId,
        title,
        time_of_day: time
      })

    if (!error) {
      setTitle('')
      setTime('09:00')
      await fetchReminders()
    }
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(reminders.filter(r => r.id !== id))
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">Manage Reminders</h3>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input 
          type="text" 
          placeholder="E.g. Take Blood Pressure Meds"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
          required
        />
        <input 
          type="time" 
          value={time}
          onChange={e => setTime(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
          required
        />
        <Button type="submit" disabled={isAdding} className="px-4">
          {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : reminders.length === 0 ? (
        <p className="text-gray-500 text-sm text-center p-4">No reminders scheduled yet.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {reminders.map(r => (
            <li key={r.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <span className="font-mono text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded text-sm">
                  {r.time_of_day}
                </span>
                <span className="font-medium text-gray-700">{r.title}</span>
              </div>
              <button 
                onClick={() => handleDelete(r.id)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
