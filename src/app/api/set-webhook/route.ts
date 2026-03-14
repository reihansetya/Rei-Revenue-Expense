import { NextResponse } from "next/server";

/**
 * Setup Telegram Webhook
 * Panggil endpoint ini sekali setelah deploy
 * URL: https://your-app.vercel.app/api/set-webhook
 */
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // Biasanya NEXT_PUBLIC_APP_URL dari setup vercel. Kita akan tambahkan ke vercel set env
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken || !appUrl) {
    return NextResponse.json({ error: "Missing configuration botToken or appUrl. Pastikan NEXT_PUBLIC_APP_URL ter-set, atau VERCEL_PROJECT_PRODUCTION_URL ada." }, { status: 500 });
  }

  // Jika URL nya masih localhost karena local dev kita tolak
  if(appUrl.includes("localhost")){
    return NextResponse.json({ error: "Tidak dapat menggunakan localhost untuk webhook mode." }, { status: 400 });
  }

  const webhookUrl = `${appUrl}/api/webhook`;

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: webhookSecret, // Optional, untuk verifikasi
      }),
    }
  );

  const data = await response.json();

  return NextResponse.json({
    success: data.ok,
    webhookUrl,
    response: data,
  });
}
