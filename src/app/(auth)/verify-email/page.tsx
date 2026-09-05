'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { Mail } from 'lucide-react'

function VerifyEmailContent() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  const supabase = createClient()
  const { toast } = useToast()

  const handleResend = async () => {
    if (!email) {
      toast('No email found', 'error')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    
    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Verification email resent', 'success')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
      <Mail className="mx-auto text-blue-600 mb-4" size={64} />
      <h1 className="text-3xl font-bold mb-4 text-blue-900">Please verify your email</h1>
      
      <p className="text-gray-600 mb-6 text-lg">
        We've sent a verification link to<br />
        <strong>{email}</strong>
      </p>

      <button
        onClick={handleResend}
        disabled={loading || !email}
        className="w-full bg-blue-100 text-blue-700 rounded-xl py-4 text-xl font-bold hover:bg-blue-200 transition disabled:opacity-50 mb-6"
      >
        {loading ? 'Sending...' : 'Resend verification email'}
      </button>

      <Link href="/login" className="text-blue-600 font-bold hover:underline block mb-8">
        Back to Login
      </Link>
      
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm text-left">
        <strong>Reminder:</strong> Life Companion is a support tool and not a medical device. Always consult your healthcare provider.
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
