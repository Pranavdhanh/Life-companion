import { createClient } from './supabase/client'

// SIH 2026 Core Algorithm: P-Score Calculation
export async function calculateAndSaveScore(params: {
  patientId: string
  gameType: string
  accuracy: number // 0 to 1
  responseTimeMs: number
  difficultyLevel: number
}) {
  const supabase = createClient()
  
  // 1. Calculate Speed Score (Normalized)
  // Assume a max response time of 60 seconds (60000ms) for a score of 0
  const MAX_RESPONSE_MS = 60000
  let speedScore = 1 - (params.responseTimeMs / MAX_RESPONSE_MS)
  if (speedScore < 0) speedScore = 0
  if (speedScore > 1) speedScore = 1

  // 2. Fetch recent sessions to calculate Consistency (Average of last 5 games)
  const { data: recentSessions } = await supabase
    .from('game_sessions')
    .select('p_score')
    .eq('patient_id', params.patientId)
    .order('created_at', { ascending: false })
    .limit(5)

  let consistencyScore = 0.5 // Default neutral if no history
  
  if (recentSessions && recentSessions.length > 0) {
    const sum = recentSessions.reduce((acc, curr) => acc + curr.p_score, 0)
    consistencyScore = sum / recentSessions.length
  }

  // 3. Final P-Score Formula (SIH Model)
  const pScore = (0.5 * params.accuracy) + (0.3 * speedScore) + (0.2 * consistencyScore)

  // 4. Save to Database
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      patient_id: params.patientId,
      game_type: params.gameType,
      accuracy: params.accuracy,
      response_time_ms: params.responseTimeMs,
      difficulty_level: params.difficultyLevel,
      p_score: pScore
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to save game session:", error)
    return null
  }

  // 5. Check if difficulty needs adjustment based on P-Score
  // If P > 0.8 consistently, increase difficulty (cap at 5)
  // If P < 0.4 consistently, decrease difficulty (floor at 1)
  // (In a full production version, this would be an async background task or RPC)
  if (pScore > 0.8 && params.difficultyLevel < 5) {
      await supabase.from('patients').update({ difficulty_level: params.difficultyLevel + 1 }).eq('id', params.patientId)
  } else if (pScore < 0.4 && params.difficultyLevel > 1) {
      await supabase.from('patients').update({ difficulty_level: params.difficultyLevel - 1 }).eq('id', params.patientId)
  }

  return { pScore, speedScore, consistencyScore, record: data }
}
