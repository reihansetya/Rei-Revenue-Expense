import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { sendTelegramMessage } from "@/lib/telegram/utils";

/**
 * Weekly recap to every linked Telegram user.
 * Scheduled in vercel.json: Monday 02:00 UTC = 09:00 WIB.
 * Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; without the env var every
 * request is rejected. Add ?dry=1 to get the messages as JSON without sending them.
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
    console.error("Weekly recap: failed to load profiles:", error);
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 });
  }

  // Sequential and isolated: one failing user never blocks the others.
  // ponytail: fine for a handful of users; batch/parallelize if this grows past ~100.
  const results = [];
  for (const profile of profiles || []) {
    try {
      const text = await buildWeeklyRecap(supabase, profile.user_id);
      if (!dryRun) await sendTelegramMessage(profile.telegram_id, text);
      results.push({ telegramId: profile.telegram_id, ok: true, ...(dryRun && { text }) });
    } catch (err) {
      console.error(`Weekly recap failed for ${profile.telegram_id}:`, err);
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
