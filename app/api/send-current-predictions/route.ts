import { NextResponse } from "next/server"
import { TelegramBot } from "@/lib/telegram"

export async function POST(request: Request) {
  try {
    const { chatId, predictions, isBackup } = await request.json()

    if (!chatId) {
      return NextResponse.json({ success: false, error: "Chat ID is required" }, { status: 400 })
    }

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ success: false, error: "No predictions to send" }, { status: 400 })
    }

    console.log("Sending current predictions to chat:", chatId)

    const message = TelegramBot.formatPredictions(predictions, isBackup)
    const sent = await TelegramBot.sendMessage(chatId, message)

    if (sent) {
      return NextResponse.json({
        success: true,
        message: "Current predictions sent successfully",
        count: predictions.length,
        recommended: predictions.filter((p: any) => p.isLikelyOver25).length,
        isBackup,
      })
    } else {
      return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending current predictions:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
