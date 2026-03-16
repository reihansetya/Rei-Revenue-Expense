import { NextResponse } from "next/server";
import { setupBotCommands } from "@/lib/telegram/bot";

/**
 * Setup Telegram Webhook & Commands
 * Panggil endpoint ini sekali setelah deploy
 * URL: https://rei-revenue-expense.vercel.app/api/set-webhook
 */
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken || !appUrl) {
    return NextResponse.json({ error: "Missing configuration botToken or appUrl." }, { status: 500 });
  }

  if(appUrl.includes("localhost")){
    return NextResponse.json({ error: "Tidak dapat menggunakan localhost untuk webhook mode." }, { status: 400 });
  }

  const webhookUrl = `${appUrl}/api/webhook`;

  try {
    // 1. Set Webhook URL
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: webhookSecret,
        }),
      }
    );

    const data = await response.json();

    // 2. Set Bot Commands (Daftar perintah /start, /expense, dll)
    if (data.ok) {
      await setupBotCommands();
    }

    return NextResponse.json({
      success: data.ok,
      webhookUrl,
      commandsUpdated: data.ok,
      response: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

