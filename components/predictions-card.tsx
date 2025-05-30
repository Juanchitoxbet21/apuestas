import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, AlertTriangle } from "lucide-react"

interface Prediction {
  homeTeam: string
  awayTeam: string
  avgGoals: number
  over25Pct: number
  isLikelyOver25: boolean
}

interface PredictionsCardProps {
  predictions: Prediction[]
  isBackup?: boolean
}

export function PredictionsCard({ predictions, isBackup = false }: PredictionsCardProps) {
  const recommended = predictions.filter((p) => p.isLikelyOver25)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Predicciones Over 2.5
          {isBackup && (
            <Badge variant="secondary" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Datos de respaldo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommended.length === 0 ? (
          <p className="text-muted-foreground">No hay predicciones recomendadas hoy</p>
        ) : (
          <div className="space-y-4">
            {recommended.map((pred, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {pred.homeTeam} vs {pred.awayTeam}
                  </h3>
                  <Badge variant="default">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Recomendado
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Promedio goles:</span>
                    <span className="ml-2 font-medium">{pred.avgGoals.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Over 2.5:</span>
                    <span className="ml-2 font-medium">{pred.over25Pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
