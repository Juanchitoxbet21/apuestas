"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Send, RefreshCw, Bot, BarChart3, Plus, Trash2, Users, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PredictionCard } from "@/components/prediction-card"

interface TelegramChat {
  id: string
  name: string
  chatId: string
  isActive: boolean
}

export default function Dashboard() {
  const [predictions, setPredictions] = useState([])
  const [isBackup, setIsBackup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Multi-chat state
  const [chats, setChats] = useState<TelegramChat[]>([
    { id: "1", name: "Chat Principal", chatId: "6097718185", isActive: true },
  ])
  const [newChatName, setNewChatName] = useState("")
  const [newChatId, setNewChatId] = useState("")
  const [selectedChats, setSelectedChats] = useState<string[]>(["1"])

  const { toast } = useToast()

  const fetchPredictions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/predictions")
      const data = await response.json()

      if (data.success) {
        setPredictions(data.predictions)
        setIsBackup(data.isBackup)
        toast({
          title: "Predicciones actualizadas",
          description: `${data.recommended} recomendaciones de ${data.count} partidos`,
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

  const sendPredictions = async () => {
    const selectedChatData = chats.filter((chat) => selectedChats.includes(chat.id) && chat.isActive)

    if (selectedChatData.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un chat activo",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    let successCount = 0
    let errorCount = 0

    try {
      // Enviar a cada chat seleccionado
      for (const chat of selectedChatData) {
        try {
          const response = await fetch("/api/send-predictions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ chatId: chat.chatId }),
          })

          const data = await response.json()

          if (data.success) {
            successCount++
          } else {
            errorCount++
            console.error(`Error enviando a ${chat.name}:`, data.error)
          }
        } catch (error) {
          errorCount++
          console.error(`Error enviando a ${chat.name}:`, error)
        }
      }

      if (successCount > 0) {
        toast({
          title: "¡Enviado!",
          description: `Predicciones enviadas a ${successCount} chat(s)${errorCount > 0 ? `. ${errorCount} falló(s)` : ""}`,
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar a ningún chat",
          variant: "destructive",
        })
      }
    } finally {
      setSending(false)
    }
  }

  // Multi-chat functions
  const addNewChat = () => {
    if (newChatName.trim() && newChatId.trim()) {
      const newChat: TelegramChat = {
        id: Date.now().toString(),
        name: newChatName.trim(),
        chatId: newChatId.trim(),
        isActive: true,
      }
      setChats([...chats, newChat])
      setSelectedChats([...selectedChats, newChat.id])
      setNewChatName("")
      setNewChatId("")
      toast({
        title: "Chat agregado",
        description: `${newChat.name} ha sido agregado exitosamente`,
      })
    }
  }

  const removeChat = (chatId: string) => {
    const chatToRemove = chats.find((chat) => chat.id === chatId)
    setChats(chats.filter((chat) => chat.id !== chatId))
    setSelectedChats(selectedChats.filter((id) => id !== chatId))
    if (chatToRemove) {
      toast({
        title: "Chat eliminado",
        description: `${chatToRemove.name} ha sido eliminado`,
      })
    }
  }

  const toggleChatActive = (chatId: string) => {
    setChats(chats.map((chat) => (chat.id === chatId ? { ...chat, isActive: !chat.isActive } : chat)))
  }

  const toggleChatSelection = (chatId: string) => {
    setSelectedChats((prev) => (prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]))
  }

  const selectAllChats = () => {
    const activeChats = chats.filter((chat) => chat.isActive).map((chat) => chat.id)
    setSelectedChats(activeChats)
  }

  const deselectAllChats = () => {
    setSelectedChats([])
  }

  useEffect(() => {
    fetchPredictions()
  }, [])

  const recommended = predictions.filter((p: any) => p.isLikelyOver25)
  const activeChatsCount = chats.filter((chat) => chat.isActive).length
  const selectedActiveChats = chats.filter((chat) => selectedChats.includes(chat.id) && chat.isActive).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚽ Football Predictions Bot</h1>
          <p className="text-gray-600">Bot moderno de predicciones de fútbol con Next.js</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <CardTitle className="text-sm font-medium">Recomendados</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{recommended.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chats Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeChatsCount}</div>
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

        {/* Telegram Chats Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Gestión de Chats de Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Chat */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-3">Agregar Nuevo Chat</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="chatName" className="text-sm">
                    Nombre del Chat
                  </Label>
                  <Input
                    id="chatName"
                    placeholder="Ej: Canal VIP"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="newChatId" className="text-sm">
                    Chat ID
                  </Label>
                  <Input
                    id="newChatId"
                    placeholder="Ej: -1001234567890"
                    value={newChatId}
                    onChange={(e) => setNewChatId(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addNewChat} className="w-full flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Chats Configurados ({chats.length})</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllChats}>
                    Seleccionar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllChats}>
                    Deseleccionar Todos
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {chats.map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedChats.includes(chat.id)}
                        onCheckedChange={() => toggleChatSelection(chat.id)}
                        disabled={!chat.isActive}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{chat.name}</span>
                          <Badge variant={chat.isActive ? "default" : "secondary"}>
                            {chat.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{chat.chatId}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleChatActive(chat.id)}>
                        {chat.isActive ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeChat(chat.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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

            {/* Selection Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Chats seleccionados:</span> {selectedActiveChats} de {activeChatsCount}{" "}
                activos
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={sendPredictions}
                disabled={sending || predictions.length === 0 || selectedActiveChats === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? "Enviando..." : `Enviar a ${selectedActiveChats} Chat(s)`}
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <p>Las predicciones se enviarán a todos los chats seleccionados y activos.</p>
            </div>
          </CardContent>
        </Card>

        {/* Predictions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {predictions.length > 0 ? (
            predictions
              .filter((p: any) => p.isLikelyOver25 || p.confidence >= 50)
              .map((prediction: any, index: number) => <PredictionCard key={index} prediction={prediction} />)
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

        </div>
      </div>
    </div>
  )
}
