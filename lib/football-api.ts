interface MatchPrediction {
  homeTeam: string
  awayTeam: string
  league: string
  matchDate: string
  matchTime: string
  avgGoals: number
  over25Pct: number
  isLikelyOver25: boolean
  // Nuevas propiedades para predicción de resultado
  homeWinProb: number
  drawProb: number
  awayWinProb: number
  predictedWinner: "home" | "away" | "draw"
  confidence: number
}

interface FootballMatch {
  fixture: {
    id: number
    date: string
  }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  league: {
    id: number
    name: string
  }
}

export class FootballAPI {
  private static readonly BASE_URL = "https://v3.football.api-sports.io"
  private static readonly API_KEY = process.env.FOOTBALL_API_KEY

  private static async makeRequest(url: string): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    try {
      const response = await fetch(url, {
        headers: {
          "x-apisports-key": this.API_KEY!,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("API request timeout")
      }
      throw error
    }
  }

  static async getTodayPredictions(): Promise<MatchPrediction[]> {
    try {
      const now = new Date()
      const today = now.toISOString().split("T")[0]
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      console.log("Fetching fixtures for today and tomorrow:", today, tomorrow)

      // Obtener partidos de hoy y mañana
      const [todayFixtures, tomorrowFixtures] = await Promise.all([
        this.makeRequest(`${this.BASE_URL}/fixtures?date=${today}`),
        this.makeRequest(`${this.BASE_URL}/fixtures?date=${tomorrow}`),
      ])

      const allFixtures: FootballMatch[] = [...(todayFixtures || []), ...(tomorrowFixtures || [])]

      if (!allFixtures || allFixtures.length === 0) {
        console.log("No fixtures found")
        return []
      }

      // Filtrar solo partidos que AÚN NO HAN COMENZADO
      const futureFixtures = allFixtures.filter((match) => {
        const matchDate = new Date(match.fixture.date)
        const currentTime = new Date()
        return matchDate > currentTime // Solo partidos futuros
      })

      console.log(`Found ${futureFixtures.length} future fixtures from ${allFixtures.length} total`)

      if (futureFixtures.length === 0) {
        console.log("No future fixtures found")
        return []
      }

      // Ordenar por fecha (más próximos primero)
      futureFixtures.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())

      const predictions: MatchPrediction[] = []

      for (const match of futureFixtures.slice(0, 5)) {
        // Limit to 5 matches
        try {
          const [homeStats, awayStats] = await Promise.all([
            this.getTeamStats(match.teams.home.id, match.league.id),
            this.getTeamStats(match.teams.away.id, match.league.id),
          ])

          if (homeStats && awayStats) {
            const homeAvg = homeStats.goals?.for?.average?.total || 0
            const awayAvg = awayStats.goals?.for?.average?.total || 0
            const homeOver = homeStats.goals?.for?.percentage?.total || 0
            const awayOver = awayStats.goals?.for?.percentage?.total || 0

            const avgGoals = homeAvg + awayAvg
            const over25Pct = Math.round((homeOver + awayOver) / 2)

            // ALGORITMO CONSISTENTE - SIN RANDOM
            const prediction = this.calculateConsistentPrediction(homeStats, awayStats, match)

            const finalPrediction: MatchPrediction = {
              homeTeam: match.teams.home.name,
              awayTeam: match.teams.away.name,
              league: match.league.name,
              matchDate: new Date(match.fixture.date).toLocaleDateString("es-ES"),
              matchTime: new Date(match.fixture.date).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              avgGoals,
              over25Pct,
              isLikelyOver25: avgGoals >= 2.5 && over25Pct >= 10,
              homeWinProb: prediction.homeWinProb,
              drawProb: prediction.drawProb,
              awayWinProb: prediction.awayWinProb,
              predictedWinner: prediction.predictedWinner,
              confidence: prediction.confidence,
            }

            predictions.push(finalPrediction)
          }
        } catch (error) {
          console.error(`Error processing match ${match.teams.home.name} vs ${match.teams.away.name}:`, error)
        }
      }

      return predictions
    } catch (error) {
      console.error("Error getting predictions:", error)
      throw error
    }
  }

  // ALGORITMO CONSISTENTE - SIN RANDOM, SIEMPRE IGUALES RESULTADOS
  private static calculateConsistentPrediction(homeStats: any, awayStats: any, match: any) {
    // Función para generar número "aleatorio" pero consistente basado en IDs
    const getConsistentValue = (teamId1: number, teamId2: number, factor: number) => {
      const combined = teamId1 + teamId2 * factor
      return (combined % 100) / 100 // Valor entre 0 y 1
    }

    // Obtener estadísticas con valores por defecto FIJOS
    const homeWins = homeStats.fixtures?.wins?.home || 8
    const homeDraws = homeStats.fixtures?.draws?.home || 4
    const homeLosses = homeStats.fixtures?.loses?.home || 3
    const homeGamesPlayed = homeWins + homeDraws + homeLosses

    const awayWins = awayStats.fixtures?.wins?.away || 5
    const awayDraws = awayStats.fixtures?.draws?.away || 6
    const awayLosses = awayStats.fixtures?.loses?.away || 4
    const awayGamesPlayed = awayWins + awayDraws + awayLosses

    // Calcular porcentajes base
    const homeWinRate = (homeWins / homeGamesPlayed) * 100
    const awayWinRate = (awayWins / awayGamesPlayed) * 100

    // Goles con valores por defecto FIJOS
    const homeGoalsFor = homeStats.goals?.for?.total?.home || 18
    const homeGoalsAgainst = homeStats.goals?.against?.total?.home || 12
    const awayGoalsFor = awayStats.goals?.for?.total?.away || 14
    const awayGoalsAgainst = awayStats.goals?.against?.total?.away || 16

    // Diferencia de goles
    const homeGoalDiff = (homeGoalsFor - homeGoalsAgainst) / homeGamesPlayed
    const awayGoalDiff = (awayGoalsFor - awayGoalsAgainst) / awayGamesPlayed

    // Variación consistente basada en IDs de equipos (no random)
    const homeId = match.teams.home.id
    const awayId = match.teams.away.id
    const variation = (getConsistentValue(homeId, awayId, 7) - 0.5) * 30 // -15 a +15

    // Calcular fuerza base
    const homeStrength = homeWinRate * 0.4 + homeGoalDiff * 8 + variation + 10 // Ventaja local
    const awayStrength = awayWinRate * 0.4 + awayGoalDiff * 8 - variation / 2

    // Calcular probabilidades base
    const total = Math.abs(homeStrength) + Math.abs(awayStrength) + 25

    let homeWinProb = Math.max(20, Math.min(60, (homeStrength / total) * 100))
    let awayWinProb = Math.max(15, Math.min(55, (awayStrength / total) * 100))

    // Empates consistentes (no random)
    const drawVariation = getConsistentValue(homeId, awayId, 13) * 10 - 5 // -5 a +5
    let drawProb = Math.max(20, Math.min(40, 30 + drawVariation))

    // Normalizar para que sume 100%
    const totalProb = homeWinProb + drawProb + awayWinProb
    homeWinProb = Math.round((homeWinProb / totalProb) * 100)
    awayWinProb = Math.round((awayWinProb / totalProb) * 100)
    drawProb = 100 - homeWinProb - awayWinProb

    // Determinar ganador
    const predictedWinner =
      homeWinProb > awayWinProb && homeWinProb > drawProb ? "home" : awayWinProb > drawProb ? "away" : "draw"

    const confidence = Math.max(homeWinProb, drawProb, awayWinProb)

    return {
      homeWinProb,
      drawProb,
      awayWinProb,
      predictedWinner,
      confidence,
    }
  }

  private static async getTeamStats(teamId: number, leagueId: number): Promise<any> {
    try {
      const season = new Date().getFullYear()
      const url = `${this.BASE_URL}/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`
      return await this.makeRequest(url)
    } catch (error) {
      console.error(`Error getting stats for team ${teamId}:`, error)
      return null
    }
  }

  // Fallback data FIJOS - NUNCA CAMBIAN
  static getFallbackPredictions(): MatchPrediction[] {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toLocaleDateString("es-ES")

    return [
      {
        homeTeam: "Olimpia Asunción",
        awayTeam: "CD San Antonio",
        league: "Liga Boliviana",
        matchDate: tomorrowStr,
        matchTime: "17:00",
        avgGoals: 3.45,
        over25Pct: 72,
        isLikelyOver25: true,
        homeWinProb: 50, // SIEMPRE IGUALES
        drawProb: 24,
        awayWinProb: 26,
        predictedWinner: "home",
        confidence: 50,
      },
      {
        homeTeam: "Peñarol",
        awayTeam: "Vélez Sarsfield",
        league: "Copa Libertadores",
        matchDate: tomorrowStr,
        matchTime: "17:00",
        avgGoals: 2.39,
        over25Pct: 58,
        isLikelyOver25: true,
        homeWinProb: 39, // SIEMPRE IGUALES
        drawProb: 27,
        awayWinProb: 34,
        predictedWinner: "home",
        confidence: 39,
      },
      {
        homeTeam: "Colo Colo",
        awayTeam: "Atlético Bucaramanga",
        league: "Copa Libertadores",
        matchDate: tomorrowStr,
        matchTime: "19:30",
        avgGoals: 3.33,
        over25Pct: 68,
        isLikelyOver25: true,
        homeWinProb: 25, // SIEMPRE IGUALES
        drawProb: 32,
        awayWinProb: 43,
        predictedWinner: "away",
        confidence: 43,
      },
      {
        homeTeam: "Racing Club",
        awayTeam: "Fortaleza",
        league: "Copa Sudamericana",
        matchDate: tomorrowStr,
        matchTime: "19:30",
        avgGoals: 2.16,
        over25Pct: 45,
        isLikelyOver25: false,
        homeWinProb: 48, // SIEMPRE IGUALES
        drawProb: 32,
        awayWinProb: 20,
        predictedWinner: "home",
        confidence: 48,
      },
      {
        homeTeam: "Grêmio",
        awayTeam: "Sportivo Luqueño",
        league: "Copa Libertadores",
        matchDate: tomorrowStr,
        matchTime: "17:00",
        avgGoals: 2.73,
        over25Pct: 62,
        isLikelyOver25: true,
        homeWinProb: 40, // SIEMPRE IGUALES
        drawProb: 29,
        awayWinProb: 31,
        predictedWinner: "home",
        confidence: 40,
      },
    ]
  }
}
