import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, TrendingUp } from "lucide-react"

interface Prediction {
  homeTeam: string
  awayTeam: string
  league: string
  matchDate: string
  matchTime: string
  avgGoals: number
  over25Pct: number
  isLikelyOver25: boolean
  homeWinProb: number
  drawProb: number
  awayWinProb: number
  predictedWinner: "home" | "away" | "draw"
  confidence: number
}

interface PredictionCardProps {
  prediction: Prediction
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const getWinnerText = () => {
    switch (prediction.predictedWinner) {
      case "home":
        return prediction.homeTeam
      case "away":
        return prediction.awayTeam
      case "draw":
        return "Empate"
    }
  }

  const getConfidenceColor = () => {
    if (prediction.confidence >= 60) return "bg-green-500"
    if (prediction.confidence >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">🔮</div>
          <CardTitle className="text-lg">PRONÓSTICO REAL</CardTitle>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            ⚽{" "}
            <span className="text-xl font-bold">
              {prediction.homeTeam} vs {prediction.awayTeam}
            </span>
          </div>
          <div className="flex items-center gap-2 text-yellow-400">
            🏆 <span>{prediction.league}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            🕐{" "}
            <span>
              {prediction.matchDate}, {prediction.matchTime}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ganador Probable */}
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span className="font-semibold">Ganador probable:</span>
          <Badge variant="secondary" className="bg-yellow-600 text-white">
            {getWinnerText()}
          </Badge>
        </div>

        {/* Probabilidades */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            📊 <span className="font-semibold">Probabilidades:</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Victoria local:</span>
              <span className="font-bold">{prediction.homeWinProb}%</span>
            </div>
            <Progress value={prediction.homeWinProb} className="h-2" />

            <div className="flex justify-between items-center">
              <span>Empate:</span>
              <span className="font-bold">{prediction.drawProb}%</span>
            </div>
            <Progress value={prediction.drawProb} className="h-2" />

            <div className="flex justify-between items-center">
              <span>Victoria visitante:</span>
              <span className="font-bold">{prediction.awayWinProb}%</span>
            </div>
            <Progress value={prediction.awayWinProb} className="h-2" />
          </div>
        </div>

        {/* Over 2.5 */}
        {prediction.isLikelyOver25 && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-green-400">Over 2.5 Goles</span>
            </div>
            <div className="text-sm space-y-1">
              <div>Promedio: {prediction.avgGoals.toFixed(1)} goles</div>
              <div>Probabilidad: {prediction.over25Pct}%</div>
              <Badge className="bg-green-600 text-white mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                RECOMENDADO
              </Badge>
            </div>
          </div>
        )}

        {/* Confianza */}
        <div className="flex items-center justify-between">
          <span>Confianza:</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getConfidenceColor()}`} />
            <span className="font-bold">{prediction.confidence}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
