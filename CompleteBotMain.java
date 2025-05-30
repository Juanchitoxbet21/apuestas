import java.util.List;

public class CompleteBotMain {
    public static void main(String[] args) {
        System.out.println("🤖 Bot de fútbol iniciado...");
        
        // 1. Enviar predicciones pre-partido
        sendPreGamePredictions();
        
        // 2. Enviar alertas de partidos en vivo
        sendLiveMatchAlerts();
    }
    
    private static void sendPreGamePredictions() {
        try {
            List<MatchPrediction> predictions = FootballAPI.getTodayPredictions();
            
            if (predictions.isEmpty()) {
                TelegramNotifier.sendMessage("🚫 No hay partidos hoy para predecir");
                return;
            }
            
            StringBuilder message = new StringBuilder();
            message.append("⚽ PREDICCIONES PRE-PARTIDO ⚽\n\n");
            
            int count = 0;
            for (MatchPrediction pred : predictions) {
                if (pred.isLikelyOver25()) {
                    count++;
                    message.append(String.format(
                        "🔥 %s vs %s\n" +
                        "📊 %.2f goles promedio\n" +
                        "📈 %d%% over 2.5\n" +
                        "✅ RECOMENDADO: Over 2.5\n\n",
                        pred.getHomeTeam(),
                        pred.getAwayTeam(),
                        pred.getAvgGoals(),
                        pred.getOver25Pct()
                    ));
                }
            }
            
            if (count > 0) {
                TelegramNotifier.sendMessage(message.toString());
            }
            
        } catch (Exception e) {
            TelegramNotifier.sendMessage("❌ Error en predicciones: " + e.getMessage());
        }
    }
    
    private static void sendLiveMatchAlerts() {
        try {
            // Aquí necesitarías un método para obtener partidos en vivo
            // List<Match> liveMatches = FootballAPI.getLiveMatches();
            
            TelegramNotifier.sendMessage("🔴 Función de partidos en vivo próximamente...");
            
        } catch (Exception e) {
            TelegramNotifier.sendMessage("❌ Error en partidos en vivo: " + e.getMessage());
        }
    }
}
