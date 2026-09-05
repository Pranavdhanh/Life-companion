'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

type Role = 'PATIENT' | 'CAREGIVER' | 'ASHA'

const ROLES: { value: Role; label: string; desc: string; icon: string }[] = [
  { value: 'PATIENT', label: 'Elderly Patient', desc: 'I am a patient using this app for cognitive support', icon: '🧓' },
  { value: 'CAREGIVER', label: 'Family Caregiver', desc: 'I am a family member caring for a patient', icon: '❤️' },
  { value: 'ASHA', label: 'ASHA / CHW', desc: 'I am a community health worker', icon: '🏥' },
]

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('PATIENT')
  const [consent, setConsent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const getPasswordStrength = () => {
    if (password.length === 0) return { label: '', color: 'bg-gray-200', width: '0%' }
    if (password.length < 8) return { label: 'Weak', color: 'bg-red-500', width: '33%' }
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (hasUpper && hasLower && hasNumber) return { label: 'Strong', color: 'bg-green-500', width: '100%' }
    return { label: 'Fair', color: 'bg-yellow-500', width: '66%' }
  }
  const strength = getPasswordStrength()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!consent) {
      setError('You must agree to the disclaimer to continue.')
      return
    }

    setLoading(true)

    // Pass role and name as metadata — our DB trigger will read this
    // and automatically create the profile row, avoiding RLS issues
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          preferred_language: 'en',
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // Explicitly call the RPC function to guarantee profile creation
      const { error: rpcError } = await supabase.rpc('create_user_profile', {
        user_id: authData.user.id,
        user_full_name: fullName,
        user_role: role,
        user_language: 'en'
      })

      if (rpcError) {
        setError(`Database Error: ${rpcError.message}. Did you run the definitive_fix_v3.sql script?`)
        setLoading(false)
        return
      }

      // Redirect based on role
      if (role === 'PATIENT') {
        router.replace('/patient/home')
      } else if (role === 'CAREGIVER') {
        router.replace('/caregiver/dashboard')
      } else if (role === 'ASHA') {
        router.replace('/asha/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-8 text-white text-center">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="text-3xl font-bold">Life Companion</h1>
          <p className="text-blue-100 mt-1 text-sm">AI Memory & Cognitive Care Platform</p>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Your Account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-start gap-2">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">I am a...</label>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    role === r.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl">{r.icon}</span>
                  <div>
                    <p className={`font-bold ${role === r.value ? 'text-blue-700' : 'text-gray-800'}`}>{r.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                  </div>
                  {role === r.value && <CheckCircle className="ml-auto text-blue-500" size={20} />}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="E.g. Rani Devi"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${strength.color === 'bg-green-500' ? 'text-green-600' : strength.color === 'bg-yellow-500' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none transition ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Repeat your password"
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="consent" className="text-sm text-amber-800 cursor-pointer leading-relaxed">
                I understand that <strong>Life Companion is a support tool, not a medical device</strong>. It does not diagnose or treat dementia.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl py-4 text-lg font-bold hover:from-blue-700 hover:to-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Creating your account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
