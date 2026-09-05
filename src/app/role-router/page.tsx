'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RoleRouterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const routeUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.replace('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        // Profile fetch failed — likely the profile row doesn't exist yet
        // This happens when registration partially succeeded (Auth user created but profile insert failed)
        setError(`Profile not found. Your account was created but setup is incomplete. User ID: ${user.id}. Please contact support or try registering again.`)
        return
      }

      switch (profile.role) {
        case 'PATIENT':
          router.replace('/patient/home')
          break
        case 'CAREGIVER':
          router.replace('/caregiver/dashboard')
          break
        case 'ASHA':
          router.replace('/asha/dashboard')
          break
        case 'ADMIN':
          router.replace('/admin/dashboard')
          break
        default:
          setError(`Unknown role "${profile.role}". Please contact support.`)
      }
    }

    routeUser()
  }, [router, supabase])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Account Setup Incomplete</h2>
          <p className="text-sm mb-6">{error}</p>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xl text-gray-600 font-medium">Loading your dashboard...</p>
    </div>
  )
}

