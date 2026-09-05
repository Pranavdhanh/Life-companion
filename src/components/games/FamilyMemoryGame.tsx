'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { calculateAndSaveScore } from '@/lib/scoring'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  patientId: string
  difficulty: number
  lifeEvents: any[]
}

export function FamilyMemoryGame({ patientId, difficulty, lifeEvents }: Props) {
  const router = useRouter()
  const photoEvents = lifeEvents.filter(e => e.event_type === 'PHOTO' && e.media_url)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [gameState, setGameState] = useState<'PLAYING' | 'FEEDBACK' | 'FINISHED'>('PLAYING')
  const [isCorrect, setIsCorrect] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [finalScore, setFinalScore] = useState<any>(null)

  // Need at least 2 photos to play
  if (photoEvents.length < 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Need More Memories</h1>
        <p className="text-xl text-gray-600 mb-8">
          To play this game, your Caregiver needs to upload at least 2 photos to your Life Story timeline!
        </p>
        <Button size="large" onClick={() => router.push('/patient/games')}>Back to Games</Button>
      </div>
    )
  }

  const currentEvent = photoEvents[currentIndex]
  
  // Generate choices dynamically based on difficulty
  // Level 1: 2 choices, Level 2: 3 choices, Level 3+: 4 choices
  const numChoices = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4
  
  const generateChoices = () => {
    const choices = [currentEvent.title]
    const otherEvents = photoEvents.filter(e => e.id !== currentEvent.id)
    // Shuffle and pick
    const shuffledOthers = [...otherEvents].sort(() => 0.5 - Math.random())
    for (let i = 0; i < numChoices - 1 && i < shuffledOthers.length; i++) {
      choices.push(shuffledOthers[i].title)
    }
    return choices.sort(() => 0.5 - Math.random())
  }
  
  // Need useMemo or just state to keep choices stable during a question
  const [choices, setChoices] = useState<string[]>([])
  
  useEffect(() => {
    if (gameState === 'PLAYING') {
      setChoices(generateChoices())
      setStartTime(Date.now())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, gameState])

  const handleAnswer = async (answer: string) => {
    if (gameState !== 'PLAYING') return
    
    const correct = answer === currentEvent.title
    setIsCorrect(correct)
    setSelectedAnswer(answer)
    setGameState('FEEDBACK')
    
    if (correct) {
      setCorrectAnswers(prev => prev + 1)
    }

    // Wait a moment, then next question or finish
    setTimeout(async () => {
      if (currentIndex < Math.min(photoEvents.length - 1, 4)) {
        // Cap at 5 questions per session max
        setCurrentIndex(prev => prev + 1)
        setGameState('PLAYING')
        setSelectedAnswer(null)
      } else {
        // Game Finished
        setGameState('FINISHED')
        const endTime = Date.now()
        const totalTime = endTime - startTime // Simplified time tracking
        const accuracy = (correct ? correctAnswers + 1 : correctAnswers) / (currentIndex + 1)
        
        const scoreResult = await calculateAndSaveScore({
          patientId,
          gameType: 'WHO_PHOTO',
          accuracy,
          responseTimeMs: totalTime,
          difficultyLevel: difficulty
        })
        setFinalScore(scoreResult)
      }
    }, 2500)
  }

  if (gameState === 'FINISHED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-blue-50">
        <Card className="max-w-lg w-full text-center py-12 px-6">
          <h1 className="text-4xl font-bold text-blue-900 mb-6">Game Complete! 🎉</h1>
          <p className="text-2xl text-gray-700 mb-8">
            You got {correctAnswers} out of {currentIndex + 1} right!
          </p>
          
          {finalScore && (
            <div className="bg-white p-6 rounded-xl border border-blue-100 mb-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-500 mb-2 uppercase tracking-wider">Session Analytics (P-Score)</h3>
              <div className="text-3xl font-black text-blue-600">{(finalScore.pScore * 100).toFixed(0)}%</div>
              <p className="text-sm text-gray-400 mt-2">Saved to your cognitive weather map.</p>
            </div>
          )}

          <Button size="large" onClick={() => router.push('/patient/games')} className="w-full">
            Play Another Game
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col max-w-xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Who is in this photo?</h2>
      
      <div className="w-full h-72 bg-gray-200 rounded-2xl mb-8 overflow-hidden shadow-md relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={currentEvent.media_url} 
          alt="Memory"
          className="w-full h-full object-cover"
        />
        
        {gameState === 'FEEDBACK' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            {isCorrect ? (
              <div className="flex flex-col items-center text-green-400">
                <CheckCircle size={80} />
                <span className="text-3xl font-bold text-white mt-2 drop-shadow-md">Correct!</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-red-400">
                <XCircle size={80} />
                <span className="text-3xl font-bold text-white mt-2 drop-shadow-md">Not quite!</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {choices.map((choice, i) => {
          let btnClass = "py-6 text-2xl shadow-sm border-2 "
          if (gameState === 'FEEDBACK') {
            if (choice === currentEvent.title) {
              btnClass += "bg-green-100 border-green-500 text-green-900" // Highlight correct answer
            } else if (choice === selectedAnswer) {
              btnClass += "bg-red-100 border-red-500 text-red-900" // Highlight wrong guess
            } else {
              btnClass += "bg-white border-gray-200 opacity-50"
            }
          } else {
            btnClass += "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-800"
          }

          return (
            <button
              key={i}
              disabled={gameState !== 'PLAYING'}
              onClick={() => handleAnswer(choice)}
              className={`rounded-xl font-bold transition-all ${btnClass}`}
            >
              {choice}
            </button>
          )
        })}
      </div>
      
      <p className="text-center text-gray-400 mt-8 font-medium">
        Question {currentIndex + 1}
      </p>
    </div>
  )
}
