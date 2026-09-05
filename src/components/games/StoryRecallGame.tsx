'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '../ui/Card'
import { calculateAndSaveScore } from '@/lib/scoring'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Volume2, Play, Loader2 } from 'lucide-react'
import { DifficultyBadge } from '../DifficultyBadge'

interface StoryRecallGameProps {
  patientId: string
  difficulty: number
}

// Localized, difficulty-scaled stories
const STORIES = [
  {
    level: 1,
    text: "Aman went to the bazaar and bought three apples.",
    question: "What fruit did Aman buy?",
    options: ["Apples", "Bananas", "Mangoes"],
    correctAnswer: "Apples"
  },
  {
    level: 1,
    text: "Priya drank a glass of warm milk before going to bed.",
    question: "What did Priya drink?",
    options: ["Milk", "Water", "Tea"],
    correctAnswer: "Milk"
  },
  {
    level: 2,
    text: "Rahul put on his red jacket because it was raining outside.",
    question: "What color was Rahul's jacket?",
    options: ["Red", "Blue", "Black", "Yellow"],
    correctAnswer: "Red"
  },
  {
    level: 3,
    text: "Aunty took the morning bus to Guwahati at 10 AM to visit her sister.",
    question: "What time did Aunty take the bus?",
    options: ["10 AM", "8 AM", "12 PM", "9 AM"],
    correctAnswer: "10 AM"
  },
  {
    level: 4,
    text: "Grandpa made tea in the evening. He added ginger and exactly two spoons of sugar, then sat on the porch.",
    question: "How many spoons of sugar did Grandpa add?",
    options: ["Two", "One", "Three", "Four"],
    correctAnswer: "Two"
  },
  {
    level: 5,
    text: "For the Bihu feast, mother prepared pitha, laru, and sweet rice. She served it on fresh banana leaves.",
    question: "What kind of leaves was the food served on?",
    options: ["Banana leaves", "Papaya leaves", "Mango leaves", "Banyan leaves"],
    correctAnswer: "Banana leaves"
  }
]

type GameState = 'intro' | 'speaking' | 'question' | 'finished'

export function StoryRecallGame({ patientId, difficulty }: StoryRecallGameProps) {
  const router = useRouter()
  
  const [gameState, setGameState] = useState<GameState>('intro')
  const [currentStory, setCurrentStory] = useState<typeof STORIES[0] | null>(null)
  
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [startTime, setStartTime] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [roundCount, setRoundCount] = useState(0)
  const MAX_ROUNDS = 3

  // Cancel speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const startGameRound = () => {
    setSelectedAnswer(null)
    
    // Filter stories appropriate for the current difficulty (allow slightly easier ones too)
    const availableStories = STORIES.filter(s => s.level <= difficulty && s.level >= difficulty - 2)
    const fallbackStories = availableStories.length > 0 ? availableStories : STORIES
    const randomStory = fallbackStories[Math.floor(Math.random() * fallbackStories.length)]
    
    // Shuffle options
    const shuffledStory = {
      ...randomStory,
      options: [...randomStory.options].sort(() => 0.5 - Math.random())
    }

    setCurrentStory(shuffledStory)
    setGameState('speaking')
    
    // Slight delay before speaking
    setTimeout(() => {
      speakText(shuffledStory.text)
    }, 500)
  }

  const speakText = (text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85 // Slightly slower for elderly patients
    utterance.pitch = 1
    
    utterance.onend = () => {
      setGameState('question')
      setStartTime(Date.now()) // Start timer when they see the question
    }
    
    // Fallback if onend doesn't fire (some browser bugs)
    setTimeout(() => {
      if (gameState === 'speaking') {
        setGameState('question')
        setStartTime(Date.now())
      }
    }, text.length * 100 + 2000)

    window.speechSynthesis.speak(utterance)
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return // Prevent multiple clicks

    setSelectedAnswer(answer)
    const isCorrect = answer === currentStory?.correctAnswer
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))

    setTimeout(() => {
      const nextRound = roundCount + 1
      setRoundCount(nextRound)
      
      if (nextRound >= MAX_ROUNDS) {
        endGame(isCorrect)
      } else {
        startGameRound()
      }
    }, 2000)
  }

  const endGame = async (lastAnswerCorrect: boolean) => {
    setGameState('finished')
    setSaving(true)
    
    const timeTakenMs = Date.now() - startTime
    const finalCorrect = score.correct + (lastAnswerCorrect ? 1 : 0)
    const accuracy = finalCorrect / MAX_ROUNDS

    // Use SIH scoring formula
    await calculateAndSaveScore({
      patientId,
      gameType: 'VOICE_RECALL',
      accuracy,
      responseTimeMs: timeTakenMs,
      difficultyLevel: difficulty
    })

    setSaving(false)
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-teal-50 to-emerald-100">
        <Card className="max-w-md w-full p-8 text-center shadow-xl rounded-3xl border-0">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Well Done!</h2>
          <p className="text-xl text-gray-600 mb-8">
            You got {score.correct} out of {MAX_ROUNDS} right.
          </p>
          
          {saving ? (
            <div className="flex flex-col items-center text-teal-600">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="font-bold">Saving your progress...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => router.push('/patient/home')}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold py-4 rounded-xl text-xl shadow-lg"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setScore({ correct: 0, total: 0 })
                  setRoundCount(0)
                  setGameState('intro')
                }}
                className="w-full bg-white text-teal-600 border-2 border-teal-200 font-bold py-4 rounded-xl text-xl"
              >
                Play Again
              </button>
            </div>
          )}
        </Card>
      </div>
    )
  }

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-teal-50 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8 mt-4">
          <button onClick={() => router.push('/patient/games')} className="text-teal-600 font-bold text-lg px-4 py-2 bg-white rounded-full shadow-sm">
            ← Back
          </button>
          <DifficultyBadge level={difficulty} />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-6xl text-teal-600">
            <Volume2 size={64} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900">Story Recall</h1>
          <p className="text-2xl text-gray-600 px-4 leading-relaxed">
            Listen carefully to the short story. Then answer a question about it.
          </p>
          
          <button
            onClick={startGameRound}
            className="w-full mt-8 bg-gradient-to-r from-teal-600 to-emerald-500 text-white py-5 rounded-2xl text-2xl font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <Play size={28} /> Start Listening
          </button>
        </div>
      </div>
    )
  }

  if (gameState === 'speaking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-teal-50">
         <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8 border-4 border-teal-100 animate-pulse relative">
            <Volume2 size={80} className="text-teal-600" />
            <div className="absolute inset-0 rounded-full border-4 border-teal-400 animate-ping opacity-20"></div>
         </div>
         <h2 className="text-3xl font-bold text-gray-800 text-center">Please listen carefully...</h2>
         <p className="text-xl text-gray-500 mt-4 text-center">The question will appear when the story ends.</p>
         
         {/* Skip button just in case TTS fails to end */}
         <button 
           onClick={() => {
             window.speechSynthesis.cancel()
             setGameState('question')
             setStartTime(Date.now())
           }}
           className="mt-12 text-teal-600 font-bold px-6 py-3 border-2 border-teal-200 rounded-xl hover:bg-teal-100"
         >
           Skip to Question
         </button>
      </div>
    )
  }

  // Question state
  return (
    <div className="min-h-screen bg-teal-50 p-6 flex flex-col max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-8 mt-4">
        <span className="bg-white px-4 py-2 rounded-full font-bold text-teal-600 shadow-sm">
          Round {roundCount + 1} of {MAX_ROUNDS}
        </span>
        <DifficultyBadge level={difficulty} />
      </div>

      <Card className="p-8 mb-6 text-center shadow-lg rounded-3xl border-0 bg-white">
        <h2 className="text-2xl text-gray-500 mb-2 font-medium">Question</h2>
        <h1 className="text-3xl font-black text-gray-800 leading-tight">
          {currentStory?.question}
        </h1>
        <button 
          onClick={() => currentStory && speakText(currentStory.question)}
          className="mt-4 text-teal-600 flex items-center justify-center gap-2 mx-auto w-full p-2 rounded-lg bg-teal-50 font-semibold"
        >
          <Volume2 size={20} /> Hear Question Again
        </button>
      </Card>

      <div className="flex flex-col gap-4">
        {currentStory?.options.map((option) => {
          const isSelected = selectedAnswer === option
          const isCorrect = option === currentStory.correctAnswer
          
          let btnClass = "bg-white text-gray-800 border-2 border-gray-200 hover:border-teal-300 shadow-sm"
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
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`p-6 rounded-2xl text-2xl font-bold text-left flex justify-between items-center transition-all ${btnClass}`}
            >
              <span>{option}</span>
              {icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
