'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('PATIENT')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // 1. Sign up user via Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. The database trigger (or direct insert) handles the profile, 
    // but since we want to specify a role and name, we can insert or update it here.
    // Wait, by default auth.users insert might be blocked, or we just update the profile created by a trigger.
    // Since we don't have a trigger in the SQL schema above, we must insert the profile manually.
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        role: role,
        full_name: fullName,
      })

      if (profileError) {
        // Fallback: If it already exists (e.g., from a trigger we add later), just update
        await supabase.from('profiles').update({
          role: role,
          full_name: fullName,
        }).eq('id', authData.user.id)
      }

      // If they are a patient, also insert into patients table
      if (role === 'PATIENT') {
         await supabase.from('patients').insert({
            profile_id: authData.user.id,
         })
      }

      // Automatically login & redirect
      if (role === 'PATIENT') {
        router.push('/patient/home')
      } else if (role === 'CAREGIVER') {
        router.push('/caregiver/dashboard')
      } else if (role === 'ASHA') {
        router.push('/asha/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md my-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">Life Companion</h1>
        <h2 className="text-xl text-center mb-8 text-gray-600">Create an Account</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="E.g. Rani Devi"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">I am a...</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="PATIENT">Elderly Patient</option>
              <option value="CAREGIVER">Family Caregiver</option>
              <option value="ASHA">ASHA Worker</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-4 text-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
