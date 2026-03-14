import { NextRequest, NextResponse } from "next/server";
import { bot } from "@/lib/telegram/bot";

/**
 * Telegram Webhook Endpoint
 * URL: https://your-app.vercel.app/api/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify Telegram webhook secret (optional but recommended)
    const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process the update using Telegraf's handleUpdate
    await bot.handleUpdate(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
