import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile untuk cek telegram_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("telegram_id, full_name")
    .eq("user_id", user.id)
    .single();

  const { success, error } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Toast-style notification untuk link result */}
      {success === "telegram_linked" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          ✅ Akun Telegram berhasil dihubungkan!
        </div>
      )}
      {error === "already_linked" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          ❌ Akun Telegram ini sudah terhubung ke akun lain.
        </div>
      )}
      {error === "invalid_token" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          ❌ Token tidak valid. Minta link baru dari bot.
        </div>
      )}
      {error === "failed" && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          ❌ Gagal menghubungkan akun. Coba lagi nanti.
        </div>
      )}

      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-xs font-mono text-muted-foreground">{user.id.slice(0, 8)}...</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tampilan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tema</p>
                <p className="text-xs text-muted-foreground">Pilih mode terang atau gelap</p>
              </div>
              <ModeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Telegram Bot</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.telegram_id
                    ? `ID: ${profile.telegram_id}`
                    : "Belum terhubung — gunakan /link di bot"}
                </p>
              </div>
              {profile?.telegram_id ? (
                <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                  ✅ Connected
                </span>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Gunakan /link di bot
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
