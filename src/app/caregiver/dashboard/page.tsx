'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CaregiverDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Caregiver Dashboard</h1>
      <p className="mb-4">Welcome to your dashboard.</p>
      <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Log Out</button>
    </div>
  )
}
