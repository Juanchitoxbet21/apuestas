export class TelegramBot {
  private static readonly TOKEN = process.env.TELEGRAM_BOT_TOKEN
  private static readonly BASE_URL = `https://api.telegram.org/bot${this.TOKEN}`

  static async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      })

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Error sending Telegram message:", error)
      return false
    }
  }

  static formatPredictions(predictions: any[], isBackup = false): string {
    let message = "🔮 <b>PRONÓSTICOS REALES</b> 🔮\n\n"

    if (isBackup) {
      message += "⚠️ <i>Usando datos de respaldo - API no disponible</i>\n\n"
    }

    const recommended = predictions.filter((p) => p.isLikelyOver25 || p.confidence >= 50)

    if (recommended.length === 0) {
      return message + "❌ No hay pronósticos recomendados hoy"
    }

    recommended.forEach((pred, index) => {
      message += `⚽ <b>${pred.homeTeam} vs ${pred.awayTeam}</b>\n`
      message += `🏆 ${pred.league}\n`
      message += `🕐 ${pred.matchDate}, ${pred.matchTime}\n\n`

      // Ganador probable
      const winnerText =
        pred.predictedWinner === "home" ? pred.homeTeam : pred.predictedWinner === "away" ? pred.awayTeam : "Empate"
      message += `🏆 <b>Ganador probable:</b> ${winnerText}\n\n`

      // Probabilidades
      message += `📊 <b>Probabilidades:</b>\n`
      message += `- Victoria local: ${pred.homeWinProb}%\n`
      message += `- Empate: ${pred.drawProb}%\n`
      message += `- Victoria visitante: ${pred.awayWinProb}%\n\n`

      // Over 2.5 si aplica
      if (pred.isLikelyOver25) {
        message += `⚽ <b>Over 2.5 goles:</b> ${pred.over25Pct}% (${pred.avgGoals.toFixed(1)} promedio)\n`
        message += `✅ <b>RECOMENDADO OVER 2.5</b>\n\n`
      }

      message += `📈 <b>Confianza:</b> ${pred.confidence}%\n`
      message += "━━━━━━━━━━━━━━━━━━━━\n\n"
    })

    message += `📋 <b>Total pronósticos: ${recommended.length}</b>`
    return message
  }
}
