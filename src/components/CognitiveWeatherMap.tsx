'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sun, Cloud, CloudRain, CloudLightning, Loader2 } from 'lucide-react'
import { Card } from './ui/Card'

export function CognitiveWeatherMap({ patientId }: { patientId: string }) {
  const [weather, setWeather] = useState<'SUNNY' | 'CLOUDY' | 'RAINY' | 'STORM' | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ avgScore: 0, sessions: 0 })
  const supabase = createClient()

  useEffect(() => {
    const fetchWeatherStats = async () => {
      // Fetch game sessions from the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('p_score')
        .eq('patient_id', patientId)
        .gte('created_at', sevenDaysAgo.toISOString())

      if (sessions && sessions.length > 0) {
        const totalScore = sessions.reduce((acc, s) => acc + s.p_score, 0)
        const avgScore = totalScore / sessions.length
        setStats({ avgScore, sessions: sessions.length })

        // Determine weather status based on P-Score
        if (avgScore >= 0.75) setWeather('SUNNY')
        else if (avgScore >= 0.50) setWeather('CLOUDY')
        else if (avgScore >= 0.30) setWeather('RAINY')
        else setWeather('STORM')
      } else {
        // No data = cloudy/neutral
        setWeather('CLOUDY')
      }
      
      setLoading(false)
    }

    fetchWeatherStats()
  }, [patientId, supabase])

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-500 mb-2" />
        <p className="text-gray-500">Calculating cognitive weather...</p>
      </Card>
    )
  }

  const renderWeatherUI = () => {
    switch (weather) {
      case 'SUNNY':
        return {
          icon: <Sun size={64} className="text-yellow-500" />,
          title: 'Sunny',
          desc: 'Great cognitive engagement this week! Accuracy and speed are high.',
          bg: 'bg-yellow-50 border-yellow-200'
        }
      case 'CLOUDY':
        return {
          icon: <Cloud size={64} className="text-gray-400" />,
          title: 'Cloudy',
          desc: 'Stable engagement. Recommend playing a few more memory games to boost activity.',
          bg: 'bg-gray-50 border-gray-200'
        }
      case 'RAINY':
        return {
          icon: <CloudRain size={64} className="text-blue-500" />,
          title: 'Rainy',
          desc: 'Slight drop in cognitive performance or missed activities. Consider checking in.',
          bg: 'bg-blue-50 border-blue-200'
        }
      case 'STORM':
        return {
          icon: <CloudLightning size={64} className="text-red-500" />,
          title: 'Storm Warning',
          desc: 'Notable drop in activity and P-Score. High priority check-in recommended.',
          bg: 'bg-red-50 border-red-200'
        }
      default:
        return null
    }
  }

  const ui = renderWeatherUI()
  if (!ui) return null

  return (
    <Card className={`flex items-start gap-6 ${ui.bg}`}>
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        {ui.icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Current Status: {ui.title}</h3>
        <p className="text-gray-600 mb-3">{ui.desc}</p>
        <div className="flex gap-4 text-sm font-medium text-gray-500">
          <span className="bg-white px-3 py-1 rounded-full shadow-sm">
            Avg P-Score: {(stats.avgScore * 100).toFixed(0)}%
          </span>
          <span className="bg-white px-3 py-1 rounded-full shadow-sm">
            Games this week: {stats.sessions}
          </span>
        </div>
      </div>
    </Card>
  )
}
