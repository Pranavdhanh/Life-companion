'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DifficultyBadge } from '@/components/DifficultyBadge'
import { ArrowLeft } from 'lucide-react'

export default function GamesList() {
  const router = useRouter()
  const supabase = createClient()
  const [level, setLevel] = useState(2)

  useEffect(() => {
    const fetchDifficulty = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('patients').select('difficulty_level').eq('profile_id', user.id).single()
        if (data) setLevel(data.difficulty_level)
      }
    }
    fetchDifficulty()
  }, [supabase])

  const gamesList = [
    { id: 'WHO_PHOTO', name: 'Family Memory', desc: 'Identify your family members from photos' },
    { id: 'WHICH_FESTIVAL', name: 'Festival Quiz', desc: 'Recognize your local festivals' },
    { id: 'VOICE_RECALL', name: 'Story Recall', desc: 'Listen to a memory and answer questions' },
    { id: 'MARKET_RECALL', name: 'Market List', desc: 'Remember items to buy from the market' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6 mt-4">
        <button onClick={() => router.push('/patient/home')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
          <ArrowLeft size={28} className="text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Your Games</h1>
      </div>

      <div className="flex flex-col gap-5">
        {gamesList.map(game => (
          <Card key={game.id} className="flex flex-col gap-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-800">{game.name}</h2>
              <DifficultyBadge level={level} />
            </div>
            <p className="text-xl text-gray-600 leading-snug">{game.desc}</p>
            <Button size="large" onClick={() => router.push(`/patient/games/${game.id}`)} className="mt-2 text-xl">
              Play Game
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
