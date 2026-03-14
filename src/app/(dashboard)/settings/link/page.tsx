// src/app/(dashboard)/settings/link/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LinkTelegramPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) redirect("/settings");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Parse token: format adalah `randomstring_telegramId`
  const lastUnderscore = token.lastIndexOf("_");
  const telegramId = parseInt(token.substring(lastUnderscore + 1));

  if (isNaN(telegramId)) redirect("/settings?error=invalid_token");

  // Check apakah telegram_id sudah dipakai akun lain
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("telegram_id", telegramId)
    .single();

  if (existing && existing.user_id !== user.id) {
    redirect("/settings?error=already_linked");
  }

  // Update profile dengan telegram_id
  const { error } = await supabase
    .from("profiles")
    .update({ telegram_id: telegramId })
    .eq("user_id", user.id);

  if (error) redirect("/settings?error=failed");

  redirect("/settings?success=telegram_linked");
}
