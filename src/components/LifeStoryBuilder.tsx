'use client'

import { useState } from 'react'
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload'
import { createClient } from '@/lib/supabase/client'
import { Camera, Mic, Loader2 } from 'lucide-react'

type TimePeriod = 'CHILDHOOD' | 'YOUTH' | 'WORK' | 'FAMILY' | 'LATER'

interface LifeStoryBuilderProps {
  patientId: string
  onEventCreated: () => void
}

export function LifeStoryBuilder({ patientId, onEventCreated }: LifeStoryBuilderProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('CHILDHOOD')
  const [file, setFile] = useState<File | null>(null)
  const [eventType, setEventType] = useState<'PHOTO' | 'VOICE'>('PHOTO')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { uploadFile, isUploading } = useSupabaseUpload('life-stories')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg("Please select a file to upload.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    // 1. Upload File
    const mediaUrl = await uploadFile(file, patientId)
    
    if (!mediaUrl) {
      setErrorMsg("Failed to upload file. Please try again.")
      setIsSubmitting(false)
      return
    }

    // 2. Get current user (Creator)
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Insert Database Record
    const { error: dbError } = await supabase
      .from('life_story_events')
      .insert({
        patient_id: patientId,
        title,
        description,
        time_period: timePeriod,
        event_type: eventType,
        media_url: mediaUrl,
        created_by: user?.id
      })

    if (dbError) {
      setErrorMsg(dbError.message)
    } else {
      // Success - reset form
      setTitle('')
      setDescription('')
      setFile(null)
      onEventCreated()
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Add Life Story Event</h3>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (e.g. Wedding Day)</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
          <select 
            value={timePeriod}
            onChange={e => setTimePeriod(e.target.value as TimePeriod)}
            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="CHILDHOOD">Childhood</option>
            <option value="YOUTH">Youth</option>
            <option value="WORK">Work Life</option>
            <option value="FAMILY">Family Life</option>
            <option value="LATER">Later Years</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            onClick={() => setEventType('PHOTO')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg border ${eventType === 'PHOTO' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
          >
            <Camera size={20} /> Photo
          </button>
          <button 
            type="button"
            onClick={() => setEventType('VOICE')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg border ${eventType === 'VOICE' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
          >
            <Mic size={20} /> Voice Note
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
          <input 
            type="file" 
            accept={eventType === 'PHOTO' ? 'image/*' : 'audio/*'}
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description / Story</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || isUploading}
          className="w-full bg-blue-600 text-white font-bold rounded-lg py-3 flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {(isSubmitting || isUploading) && <Loader2 className="animate-spin" size={20} />}
          {isUploading ? 'Uploading File...' : isSubmitting ? 'Saving...' : 'Save to Timeline'}
        </button>
      </form>
    </div>
  )
}
