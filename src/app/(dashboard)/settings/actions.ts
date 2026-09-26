"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;

// Linking starts from the logged-in web session: the token proves ownership of this
// account, and the bot takes the Telegram ID from Telegram itself (never from a URL).
export async function createTelegramLink() {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) redirect("/login");

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const token = randomBytes(16).toString("hex");

  const { error } = await supabase
    .from("profiles")
    .update({
      link_token: token,
      link_token_expires_at: new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString(),
    })
    .eq("user_id", user.id);

  if (error || !botUsername) redirect("/settings?error=failed");

  redirect(`https://t.me/${botUsername}?start=${token}`);
}
