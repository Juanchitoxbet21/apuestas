"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, RefreshCw, Bot, BarChart3, Repeat } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PredictionCard } from "@/components/prediction-card"

export default function Dashboard() {
  const [predictions, setPredictions] = useState([])
  const [isBackup, setIsBackup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState("6097718185") // Tu chat ID por defecto
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const { toast } = useToast()

  const fetchPredictions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/predictions")
      const data = await response.json()

      if (data.success) {
        setPredictions(data.predictions)
        setIsBackup(data.isBackup)
        setLastUpdateTime(new Date().toLocaleString("es-ES"))
        toast({
          title: "Predicciones actualizadas",
          description: `${data.predictions.length} partidos encontrados`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron obtener las predicciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendCurrentPredictions = async () => {
    if (!chatId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un Chat ID",
        variant: "destructive",
      })
      return
    }

    if (predictions.length === 0) {
      toast({
        title: "Error",
        description: "No hay predicciones para enviar. Actualiza primero.",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/send-current-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          predictions: predictions,
          isBackup: isBackup,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Enviado!",
          description: `${predictions.length} predicciones enviadas (las mismas de siempre)`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const sendNewPredictions = async () => {
    if (!chatId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un Chat ID",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/send-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar las predicciones locales con las nuevas
        setPredictions(data.predictions || [])
        setIsBackup(data.isBackup || false)
        setLastUpdateTime(new Date().toLocaleString("es-ES"))

        toast({
          title: "¡Enviado!",
          description: `${data.count} nuevas predicciones enviadas y guardadas`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
  }, [])

  // MOSTRAR TODOS LOS PARTIDOS - SIN FILTROS ESTRICTOS
  const displayPredictions = predictions.filter((p: any) => p.confidence >= 25) // Solo filtro mínimo

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚽ Football Predictions Bot</h1>
          <p className="text-gray-600">Bot moderno de predicciones de fútbol con Next.js</p>
          {lastUpdateTime && <p className="text-sm text-gray-500 mt-2">Última actualización: {lastUpdateTime}</p>}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partidos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{predictions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Para Enviar</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{displayPredictions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado API</CardTitle>
              <div className={`h-2 w-2 rounded-full ${isBackup ? "bg-yellow-500" : "bg-green-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{isBackup ? "Datos de respaldo" : "API funcionando"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Controles del Bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={fetchPredictions} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar Predicciones
              </Button>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="chatId">Chat ID de Telegram</Label>
                <Input
                  id="chatId"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Ingresa tu Chat ID"
                />
              </div>
            </div>

            {/* Botones de envío separados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={sendCurrentPredictions}
                disabled={sending || predictions.length === 0}
                variant="default"
                className="w-full"
              >
                <Repeat className="h-4 w-4 mr-2" />
                {sending ? "Enviando..." : "Reenviar las Mismas"}
              </Button>

              <Button onClick={sendNewPredictions} disabled={sending} variant="secondary" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Enviando..." : "Buscar y Enviar Nuevas"}
              </Button>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Reenviar las Mismas:</strong> Envía las predicciones actuales sin cambios
              </p>
              <p>
                <strong>Buscar y Enviar Nuevas:</strong> Busca nuevos partidos y actualiza las predicciones
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Predictions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayPredictions.length > 0 ? (
            displayPredictions.map((prediction: any, index: number) => (
              <PredictionCard key={index} prediction={prediction} />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No hay predicciones disponibles</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
