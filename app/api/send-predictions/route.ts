import { NextResponse } from "next/server"
import { FootballAPI } from "@/lib/football-api"
import { TelegramBot } from "@/lib/telegram"

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json()

    if (!chatId) {
      return NextResponse.json({ success: false, error: "Chat ID is required" }, { status: 400 })
    }

    console.log("Sending NEW predictions to chat:", chatId)

    let predictions
    let isBackup = false

    try {
      predictions = await FootballAPI.getTodayPredictions()

      if (predictions.length === 0) {
        predictions = FootballAPI.getFallbackPredictions()
        isBackup = true
      }
    } catch (error) {
      console.error("API failed, using fallback:", error)
      predictions = FootballAPI.getFallbackPredictions()
      isBackup = true
    }

    const message = TelegramBot.formatPredictions(predictions, isBackup)
    const sent = await TelegramBot.sendMessage(chatId, message)

    if (sent) {
      return NextResponse.json({
        success: true,
        message: "New predictions sent successfully",
        count: predictions.length,
        recommended: predictions.filter((p) => p.isLikelyOver25).length,
        isBackup,
        predictions, // Devolver las predicciones para actualizar el estado
      })
    } else {
      return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending predictions:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
