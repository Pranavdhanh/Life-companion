'use client'

import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { calculateAndSaveScore } from '@/lib/scoring'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, ArrowRight, Loader2, Play } from 'lucide-react'
import { DifficultyBadge } from '../DifficultyBadge'

interface FestivalQuizGameProps {
  patientId: string
  difficulty: number
}

// NER specific localized data
const FESTIVALS = [
  { id: 'bihu', name: 'Bihu', state: 'Assam', desc: 'A harvest festival celebrated with traditional dance and feasts.' },
  { id: 'hornbill', name: 'Hornbill Festival', state: 'Nagaland', desc: 'A celebration of indigenous warrior tribes and their rich culture.' },
  { id: 'yaoshang', name: 'Yaoshang', state: 'Manipur', desc: 'A spring festival involving colors, sports, and traditional dances.' },
  { id: 'wangala', name: 'Wangala', state: 'Meghalaya', desc: 'The 100-drum harvest festival of the Garo tribe.' },
  { id: 'losar', name: 'Losar', state: 'Arunachal Pradesh', desc: 'The New Year festival celebrated by Monpa and Sherdukpen tribes.' },
  { id: 'chapchar', name: 'Chapchar Kut', state: 'Mizoram', desc: 'A spring festival celebrated after clearing forests for jhum cultivation.' },
]

export function FestivalQuizGame({ patientId, difficulty }: FestivalQuizGameProps) {
  const router = useRouter()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [options, setOptions] = useState<typeof FESTIVALS>([])
  const [targetFestival, setTargetFestival] = useState<typeof FESTIVALS[0] | null>(null)
  
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [startTime, setStartTime] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  
  const [gameFinished, setGameFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  // Level setup based on difficulty (1-5)
  const numOptions = Math.min(2 + Math.floor(difficulty / 2), 4) // max 4 options
  const totalQuestions = 5

  const startGame = () => {
    setScore({ correct: 0, total: 0 })
    setCurrentQuestionIdx(0)
    setIsPlaying(true)
    setStartTime(Date.now())
    generateQuestion()
  }

  const generateQuestion = () => {
    setSelectedAnswer(null)
    
    // Pick a random target festival
    const target = FESTIVALS[Math.floor(Math.random() * FESTIVALS.length)]
    
    // Pick wrong options
    const wrongOptions = FESTIVALS.filter(f => f.id !== target.id)
    const shuffledWrong = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, numOptions - 1)
    
    // Combine and shuffle
    const allOptions = [target, ...shuffledWrong].sort(() => 0.5 - Math.random())
    
    setTargetFestival(target)
    setOptions(allOptions)
  }

  const handleAnswer = (festivalId: string) => {
    if (selectedAnswer) return // Prevent multiple clicks

    setSelectedAnswer(festivalId)
    const isCorrect = festivalId === targetFestival?.id
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))

    // Wait a moment then go to next question
    setTimeout(() => {
      if (currentQuestionIdx + 1 >= totalQuestions) {
        endGame(isCorrect)
      } else {
        setCurrentQuestionIdx(prev => prev + 1)
        generateQuestion()
      }
    }, 1500)
  }

  const endGame = async (lastAnswerCorrect: boolean) => {
    setGameFinished(true)
    setSaving(true)
    setIsPlaying(false)
    
    const timeTakenMs = Date.now() - startTime
    const timeTakenSeconds = Math.floor(timeTakenMs / 1000)
    
    const finalCorrect = score.correct + (lastAnswerCorrect ? 1 : 0)
    const accuracy = finalCorrect / totalQuestions

    // Use SIH scoring formula
    await calculateAndSaveScore({
      patientId,
      gameType: 'WHICH_FESTIVAL',
      accuracy,
      responseTimeMs: timeTakenMs,
      difficultyLevel: difficulty
    })

    setSaving(false)
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-purple-100">
        <Card className="max-w-md w-full p-8 text-center shadow-xl rounded-3xl border-0">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Great Job!</h2>
          <p className="text-xl text-gray-600 mb-8">
            You got {score.correct} out of {totalQuestions} right.
          </p>
          
          {saving ? (
            <div className="flex flex-col items-center text-purple-600">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="font-bold">Saving your progress...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => router.push('/patient/home')}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl text-xl shadow-lg"
              >
                Back to Home
              </button>
              <button
                onClick={startGame}
                className="w-full bg-white text-purple-600 border-2 border-purple-200 font-bold py-4 rounded-xl text-xl"
              >
                Play Again
              </button>
            </div>
          )}
        </Card>
      </div>
    )
  }

  if (!isPlaying) {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-indigo-50 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8 mt-4">
          <button onClick={() => router.push('/patient/games')} className="text-purple-600 font-bold text-lg px-4 py-2 bg-white rounded-full shadow-sm">
            ← Back
          </button>
          <DifficultyBadge level={difficulty} />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-6xl">
            🪔
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900">Festival Quiz</h1>
          <p className="text-2xl text-gray-600 px-4 leading-relaxed">
            Let's remember the vibrant festivals of our region.
          </p>
          
          <button
            onClick={startGame}
            className="w-full mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-2xl text-2xl font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <Play size={28} /> Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-indigo-50 p-6 flex flex-col max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-8 mt-4">
        <span className="bg-white px-4 py-2 rounded-full font-bold text-purple-600 shadow-sm">
          Question {currentQuestionIdx + 1} of {totalQuestions}
        </span>
        <DifficultyBadge level={difficulty} />
      </div>

      <Card className="p-8 mb-6 text-center shadow-lg rounded-3xl border-0 bg-white">
        <h2 className="text-2xl text-gray-500 mb-2 font-medium">Which festival is from</h2>
        <h1 className="text-4xl font-black text-indigo-700">{targetFestival?.state}?</h1>
        <p className="mt-4 text-lg text-gray-500 italic">"{targetFestival?.desc}"</p>
      </Card>

      <div className="flex flex-col gap-4">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.id
          const isCorrect = option.id === targetFestival?.id
          
          let btnClass = "bg-white text-gray-800 border-2 border-gray-200 hover:border-indigo-300 shadow-sm"
          let icon = null
          
          if (selectedAnswer) {
            if (isCorrect) {
              btnClass = "bg-green-100 border-green-500 text-green-800"
              icon = <CheckCircle2 className="text-green-600" />
            } else if (isSelected) {
              btnClass = "bg-red-100 border-red-500 text-red-800"
              icon = <XCircle className="text-red-600" />
            } else {
              btnClass = "bg-white text-gray-400 border-gray-200 opacity-50"
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={selectedAnswer !== null}
              className={`p-6 rounded-2xl text-2xl font-bold text-left flex justify-between items-center transition-all ${btnClass}`}
            >
              <span>{option.name}</span>
              {icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
