'use client'

import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { calculateAndSaveScore } from '@/lib/scoring'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShoppingCart, Play, Loader2 } from 'lucide-react'
import { DifficultyBadge } from '../DifficultyBadge'

interface MarketRecallGameProps {
  patientId: string
  difficulty: number
}

// Localized market items for NER / India
const MARKET_ITEMS = [
  { id: 'apple', name: 'Apples', emoji: '🍎' },
  { id: 'banana', name: 'Bananas', emoji: '🍌' },
  { id: 'rice', name: 'Rice', emoji: '🍚' },
  { id: 'tea', name: 'Tea Leaves', emoji: '🌿' },
  { id: 'potato', name: 'Potatoes', emoji: '🥔' },
  { id: 'onion', name: 'Onions', emoji: '🧅' },
  { id: 'tomato', name: 'Tomatoes', emoji: '🍅' },
  { id: 'milk', name: 'Milk', emoji: '🥛' },
  { id: 'egg', name: 'Eggs', emoji: '🥚' },
  { id: 'fish', name: 'Fish', emoji: '🐟' },
  { id: 'dal', name: 'Lentils (Dal)', emoji: '🍲' },
  { id: 'chili', name: 'Green Chilies', emoji: '🌶️' },
  { id: 'mustard_oil', name: 'Mustard Oil', emoji: '🛢️' },
  { id: 'tambul', name: 'Betel Nut', emoji: '🌰' },
  { id: 'brinjal', name: 'Eggplant', emoji: '🍆' },
  { id: 'carrot', name: 'Carrots', emoji: '🥕' },
]

type GameState = 'intro' | 'memorize' | 'recall' | 'finished'

export function MarketRecallGame({ patientId, difficulty }: MarketRecallGameProps) {
  const router = useRouter()
  
  const [gameState, setGameState] = useState<GameState>('intro')
  const [targetItems, setTargetItems] = useState<typeof MARKET_ITEMS>([])
  const [gridItems, setGridItems] = useState<typeof MARKET_ITEMS>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  
  const [score, setScore] = useState(0)

  // Configure difficulty
  const numTargets = Math.min(2 + Math.floor(difficulty / 1.5), 6) // Level 1: 2 items, Level 5: 5-6 items
  const numDecoys = Math.min(4 + difficulty * 2, 12) // Level 1: 6 grid items total, Level 5: up to 16
  const memorizeTimeSeconds = Math.max(10 - difficulty, 5) // Faster at higher levels

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === 'memorize' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (gameState === 'memorize' && timeLeft === 0) {
      startRecallPhase()
    }
    return () => clearTimeout(timer)
  }, [gameState, timeLeft])

  const startGame = () => {
    setSelectedIds(new Set())
    setScore(0)
    
    // Pick random target items
    const shuffledItems = [...MARKET_ITEMS].sort(() => 0.5 - Math.random())
    const targets = shuffledItems.slice(0, numTargets)
    const decoys = shuffledItems.slice(numTargets, numTargets + numDecoys)
    
    setTargetItems(targets)
    
    // Combine targets and decoys for the grid and shuffle them
    const allGrid = [...targets, ...decoys].sort(() => 0.5 - Math.random())
    setGridItems(allGrid)
    
    setGameState('memorize')
    setTimeLeft(memorizeTimeSeconds)
  }

  const startRecallPhase = () => {
    setGameState('recall')
    setStartTime(Date.now())
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const submitAnswers = async () => {
    setGameState('finished')
    setSaving(true)
    
    const timeTakenMs = Date.now() - startTime
    
    // Calculate accuracy
    let correctPicks = 0
    let incorrectPicks = 0
    
    selectedIds.forEach(id => {
      if (targetItems.some(t => t.id === id)) {
        correctPicks++
      } else {
        incorrectPicks++
      }
    })
    
    setScore(correctPicks)
    
    // Accuracy = (Correct Picks - Penalty for wrong guesses) / Total Targets
    // Bound between 0 and 1
    let rawAccuracy = (correctPicks - (incorrectPicks * 0.5)) / numTargets
    const accuracy = Math.max(0, Math.min(1, rawAccuracy))

    await calculateAndSaveScore({
      patientId,
      gameType: 'MARKET_RECALL',
      accuracy,
      responseTimeMs: timeTakenMs,
      difficultyLevel: difficulty
    })

    setSaving(false)
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-100">
        <Card className="max-w-md w-full p-8 text-center shadow-xl rounded-3xl border-0">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Shopping Complete!</h2>
          <p className="text-xl text-gray-600 mb-8">
            You remembered {score} out of {numTargets} items correctly.
          </p>
          
          {saving ? (
            <div className="flex flex-col items-center text-orange-600">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="font-bold">Saving your progress...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => router.push('/patient/home')}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg"
              >
                Back to Home
              </button>
              <button
                onClick={startGame}
                className="w-full bg-white text-orange-600 border-2 border-orange-200 font-bold py-4 rounded-xl text-xl"
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
      <div className="min-h-screen flex flex-col p-6 bg-amber-50 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8 mt-4">
          <button onClick={() => router.push('/patient/games')} className="text-orange-600 font-bold text-lg px-4 py-2 bg-white rounded-full shadow-sm">
            ← Back
          </button>
          <DifficultyBadge level={difficulty} />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-6xl text-orange-500">
            <ShoppingCart size={64} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900">Market List</h1>
          <p className="text-2xl text-gray-600 px-4 leading-relaxed">
            Memorize the shopping list, then pick exactly those items from the market!
          </p>
          
          <button
            onClick={startGame}
            className="w-full mt-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-5 rounded-2xl text-2xl font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <Play size={28} /> Start Shopping
          </button>
        </div>
      </div>
    )
  }

  if (gameState === 'memorize') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-amber-50">
         <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Memorize this list!</h2>
         
         <Card className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-sm mb-8 border-t-8 border-orange-400">
           <ul className="space-y-4">
             {targetItems.map(item => (
               <li key={item.id} className="text-3xl font-bold text-gray-700 flex items-center gap-4">
                 <span className="text-4xl">{item.emoji}</span>
                 {item.name}
               </li>
             ))}
           </ul>
         </Card>

         <div className="w-24 h-24 rounded-full border-4 border-orange-200 flex items-center justify-center bg-white shadow-sm">
           <span className="text-4xl font-black text-orange-500">{timeLeft}</span>
         </div>
         <p className="text-lg text-gray-500 mt-4 font-medium">seconds remaining</p>
      </div>
    )
  }

  // Recall Phase
  return (
    <div className="min-h-screen bg-amber-50 p-6 flex flex-col max-w-lg mx-auto pb-32">
      <div className="flex justify-between items-center mb-4 mt-4">
        <h2 className="text-2xl font-black text-gray-800">What was on your list?</h2>
        <DifficultyBadge level={difficulty} />
      </div>
      <p className="text-gray-600 mb-6 font-medium">Tap all the items you remember. Leave the others unselected.</p>

      <div className="grid grid-cols-2 gap-4">
        {gridItems.map((item) => {
          const isSelected = selectedIds.has(item.id)
          
          return (
            <button
              key={item.id}
              onClick={() => toggleSelection(item.id)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                isSelected 
                  ? 'bg-orange-100 border-orange-500 shadow-md transform scale-105' 
                  : 'bg-white border-gray-200 shadow-sm opacity-90'
              }`}
            >
              <span className="text-5xl mb-1">{item.emoji}</span>
              <span className={`font-bold ${isSelected ? 'text-orange-800' : 'text-gray-700'}`}>
                {item.name}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2 text-orange-600">
                  <CheckCircle2 size={24} className="fill-orange-200" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-10 flex justify-center">
        <button
          onClick={submitAnswers}
          disabled={selectedIds.size === 0}
          className="w-full max-w-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl text-xl font-bold shadow-md disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-400"
        >
          Submit Answers
        </button>
      </div>
    </div>
  )
}
