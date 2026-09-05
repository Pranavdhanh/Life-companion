'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { FamilyMemoryGame } from '@/components/games/FamilyMemoryGame'
import { FestivalQuizGame } from '@/components/games/FestivalQuizGame'
import { StoryRecallGame } from '@/components/games/StoryRecallGame'

export default function GameSession() {
  const router = useRouter()
  const params = useParams()
  const gameId = params.id as string
  
  const supabase = createClient()
  const [patientData, setPatientData] = useState<any>(null)
  const [lifeEvents, setLifeEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initGame = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch Patient Record
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', user.id)
        .single()
      
      if (patient) {
        setPatientData(patient)
        
        // Fetch real life story events to use in games
        const { data: events } = await supabase
          .from('life_story_events')
          .select('*')
          .eq('patient_id', patient.id)
        
        if (events) {
          setLifeEvents(events)
        }
      }
      setLoading(false)
    }

    initGame()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-xl text-gray-600">Loading your memories...</p>
      </div>
    )
  }

  if (!patientData) {
    return <div>Error loading patient profile.</div>
  }

  if (gameId === 'WHO_PHOTO') {
    return <FamilyMemoryGame patientId={patientData.id} difficulty={patientData.difficulty_level} lifeEvents={lifeEvents} />
  }
  
  if (gameId === 'WHICH_FESTIVAL') {
    return <FestivalQuizGame patientId={patientData.id} difficulty={patientData.difficulty_level} />
  }
  
  if (gameId === 'VOICE_RECALL') {
    return <StoryRecallGame patientId={patientData.id} difficulty={patientData.difficulty_level} />
  }

  // Placeholder for other games
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Game Under Construction</h1>
      <p className="text-xl text-gray-600 mb-8">We are still porting {gameId} to the production environment.</p>
      <button 
        onClick={() => router.push('/patient/games')}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xl"
      >
        Back to Games
      </button>
    </div>
  )
}
