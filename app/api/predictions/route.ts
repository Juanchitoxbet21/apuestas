import { NextResponse } from "next/server"
import { FootballAPI } from "@/lib/football-api"

export async function GET() {
  try {
    console.log("Getting predictions...")

    let predictions
    let isBackup = false

    try {
      predictions = await FootballAPI.getTodayPredictions()

      if (predictions.length === 0) {
        console.log("No predictions from API, using fallback")
        predictions = FootballAPI.getFallbackPredictions()
        isBackup = true
      }
    } catch (error) {
      console.error("API failed, using fallback:", error)
      predictions = FootballAPI.getFallbackPredictions()
      isBackup = true
    }

    return NextResponse.json({
      success: true,
      predictions,
      isBackup,
      count: predictions.length,
      recommended: predictions.filter((p) => p.isLikelyOver25).length,
    })
  } catch (error) {
    console.error("Error in predictions API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get predictions",
        predictions: [],
        isBackup: false,
      },
      { status: 500 },
    )
  }
}
