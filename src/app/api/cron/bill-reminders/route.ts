import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildBillMessage } from "@/lib/bills";
import { sendTelegramMessage } from "@/lib/telegram/utils";

/**
 * Daily bill reminders (H-3, H-0, every day while overdue) to every linked Telegram user.
 * Scheduled in vercel.json: daily 02:00 UTC = 09:00 WIB.
 * Same auth as weekly-recap: "Authorization: Bearer <CRON_SECRET>"; ?dry=1 returns the
 * messages as JSON without sending them.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dry") === "1";

  // Service role: a cron has no user session and reads every linked user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, telegram_id")
    .not("telegram_id", "is", null);

  if (error) {
    console.error("Bill reminders: failed to load profiles:", error);
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 });
  }

  // ponytail: one query per linked user; fine for a handful of users, query bills in bulk past ~100.
  const results = [];
  for (const profile of profiles || []) {
    try {
      const message = await buildBillMessage(supabase, profile.user_id, { onlyReminders: true });
      if (!message) continue;
      if (!dryRun) {
        await sendTelegramMessage(profile.telegram_id, message.text, {
          reply_markup: { inline_keyboard: message.buttons },
        });
      }
      results.push({ telegramId: profile.telegram_id, ok: true, ...(dryRun && { message }) });
    } catch (err) {
      console.error(`Bill reminder failed for ${profile.telegram_id}:`, err);
      results.push({ telegramId: profile.telegram_id, ok: false });
    }
  }

  return NextResponse.json({
    dryRun,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
