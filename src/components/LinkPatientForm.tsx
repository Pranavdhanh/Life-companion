'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, UserPlus } from 'lucide-react'

export function LinkPatientForm({ onLinked }: { onLinked: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('link_patient_by_email', {
      patient_email: email
    })

    if (rpcError) {
      setError(rpcError.message)
    } else {
      setEmail('')
      onLinked()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">Link a Patient</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Enter the email address the patient used to register their account to link them to your Caregiver dashboard.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleLink} className="space-y-4">
        <div>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="patient@example.com"
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold rounded-lg py-3 flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="animate-spin" size={20} />}
          {loading ? 'Linking...' : 'Link Patient Account'}
        </button>
      </form>
    </div>
  )
}
