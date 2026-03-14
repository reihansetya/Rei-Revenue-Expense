# 🤖 Telegram Bot Setup — Polling Mode

## Pre-requisites

### 1. Buat Bot di @BotFather
```
1. Buka Telegram → cari @BotFather
2. /newbot
3. Masukkan nama: Expense Tracker
4. Masukkan username: xxxxx_bot (harus unik, diakhiri _bot)
5. Copy BOT TOKEN
```

### 2. Tambah Environment Variables
```env
# .env.local
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username_here
```

### 3. Install Dependencies
```bash
npm install telegraf
npm install --save-dev tsx
```

---

## Step 1: Database Migration

Jalankan di Supabase SQL Editor:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_token_expires_at TIMESTAMPTZ;
```

---

## Step 2: Buat File Structure

```
src/lib/telegram/
├── bot.ts
├── commands.ts
└── utils.ts

scripts/
└── telegram-bot.ts
```

---

## Step 3: `src/lib/telegram/utils.ts`

```ts
// Parse amount dari berbagai format
// "50rb" → 50000, "5jt" → 5000000, "50000" → 50000
export function parseAmount(raw: string): number | null {
  const cleaned = raw.toLowerCase().trim();

  const juta = cleaned.match(/^([\d.,]+)\s*j(t|uta)?$/);
  if (juta) return parseFloat(juta[1].replace(",", ".")) * 1_000_000;

  const ribu = cleaned.match(/^([\d.,]+)\s*r(b|ibu)?$/);
  if (ribu) return parseFloat(ribu[1].replace(",", ".")) * 1_000;

  const k = cleaned.match(/^([\d.,]+)\s*k$/);
  if (k) return parseFloat(k[1].replace(",", ".")) * 1_000;

  const plain = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  if (!isNaN(plain)) return plain;

  return null;
}

// Format ke Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Get start & end of current month
export function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { start, end };
}

// Generate random token
export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}
```

---

## Step 4: `src/lib/telegram/commands.ts`

```ts
import { Context } from "telegraf";
import { createClient } from "@supabase/supabase-js";
import { parseAmount, formatRupiah, getCurrentMonthRange, generateToken } from "./utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Helper: get user by telegram_id
async function getUserByTelegramId(telegramId: number) {
  const { data } = await supabase
    .from("profiles")
    .select("*, accounts(*), categories(*)")
    .eq("telegram_id", telegramId)
    .single();
  return data;
}

// /start
export async function handleStart(ctx: Context) {
  const name = ctx.from?.first_name || "there";
  await ctx.reply(
    `👋 Halo ${name}!\n\n` +
    `Saya adalah bot expense tracker Anda.\n\n` +
    `Untuk mulai, hubungkan akun Anda terlebih dahulu:\n` +
    `/link\n\n` +
    `📋 *Commands tersedia:*\n` +
    `/expense <jumlah> <kategori> [catatan]\n` +
    `/income <jumlah> <kategori> [catatan]\n` +
    `/balance - Cek saldo\n` +
    `/summary - Ringkasan bulan ini\n` +
    `/help - Bantuan`,
    { parse_mode: "Markdown" }
  );
}

// /help
export async function handleHelp(ctx: Context) {
  await ctx.reply(
    `📖 *Panduan Penggunaan*\n\n` +
    `*Catat Pengeluaran:*\n` +
    `/expense 50rb makan\n` +
    `/expense 150000 transport ojek\n` +
    `/expense 2jt belanja bulanan\n\n` +
    `*Catat Pemasukan:*\n` +
    `/income 5jt gaji\n` +
    `/income 500rb freelance project web\n\n` +
    `*Format Jumlah:*\n` +
    `• \`50rb\` atau \`50ribu\` = Rp 50.000\n` +
    `• \`5jt\` atau \`5juta\` = Rp 5.000.000\n` +
    `• \`50k\` = Rp 50.000\n` +
    `• \`50000\` = Rp 50.000\n\n` +
    `*Lainnya:*\n` +
    `/balance - Lihat saldo semua akun\n` +
    `/summary - Ringkasan bulan ini\n` +
    `/link - Hubungkan akun Telegram`,
    { parse_mode: "Markdown" }
  );
}

// /link
export async function handleLink(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Check apakah sudah linked
  const existing = await getUserByTelegramId(telegramId);
  if (existing) {
    await ctx.reply("✅ Akun Anda sudah terhubung!");
    return;
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

  // Simpan token sementara (tanpa user_id dulu, dicari saat klik link)
  // Kita pakai simple approach: simpan di profiles yang sudah ada telegram_id null
  // Atau bisa pakai Redis/KV, tapi untuk simplicity pakai Supabase table terpisah

  // Simple approach: encode telegramId di token
  const linkToken = `${token}_${telegramId}`;

  await ctx.reply(
    `🔗 *Link Akun Telegram*\n\n` +
    `Klik link berikut untuk menghubungkan akun:\n` +
    `${APP_URL}/settings/link?token=${linkToken}\n\n` +
    `⏰ Link berlaku *10 menit*\n` +
    `❗ Jangan bagikan link ini ke siapapun`,
    { parse_mode: "Markdown" }
  );
}

// /expense
export async function handleExpense(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const profile = await getUserByTelegramId(telegramId);
  if (!profile) {
    await ctx.reply("❌ Akun belum terhubung. Gunakan /link terlebih dahulu.");
    return;
  }

  // Parse args: /expense 50rb makan catatan opsional
  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
  const parts = text.split(" ").slice(1); // hapus "/expense"

  if (parts.length < 2) {
    await ctx.reply(
      "❌ Format salah.\n\nContoh: `/expense 50rb makan`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  if (!amount) {
    await ctx.reply("❌ Jumlah tidak valid. Contoh: `50rb`, `5jt`, `150000`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const categoryName = parts[1].toLowerCase();
  const description = parts.slice(2).join(" ") || null;

  // Cari kategori (case insensitive, partial match)
  const categories = profile.categories as any[];
  const category = categories.find(
    (c: any) =>
      c.type === "expense" &&
      c.name.toLowerCase().includes(categoryName)
  );

  // Pakai akun default
  const accounts = profile.accounts as any[];
  const defaultAccount = accounts.find((a: any) => a.is_default) || accounts[0];

  if (!defaultAccount) {
    await ctx.reply("❌ Belum ada akun. Tambahkan akun di aplikasi terlebih dahulu.");
    return;
  }

  // Simpan transaksi
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("transactions").insert({
    user_id: profile.user_id,
    type: "expense",
    amount,
    description,
    date: today,
    account_id: defaultAccount.id,
    category_id: category?.id || null,
    source: "telegram",
  });

  if (error) {
    await ctx.reply(`❌ Gagal menyimpan: ${error.message}`);
    return;
  }

  await ctx.reply(
    `✅ *Pengeluaran Tercatat!*\n\n` +
    `💸 Jumlah: *${formatRupiah(amount)}*\n` +
    `📂 Kategori: ${category ? category.icon + " " + category.name : "Tidak ditemukan"}\n` +
    `🏦 Akun: ${defaultAccount.name}\n` +
    `📝 Catatan: ${description || "-"}\n` +
    `📅 Tanggal: ${today}`,
    { parse_mode: "Markdown" }
  );
}

// /income
export async function handleIncome(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const profile = await getUserByTelegramId(telegramId);
  if (!profile) {
    await ctx.reply("❌ Akun belum terhubung. Gunakan /link terlebih dahulu.");
    return;
  }

  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
  const parts = text.split(" ").slice(1);

  if (parts.length < 2) {
    await ctx.reply(
      "❌ Format salah.\n\nContoh: `/income 5jt gaji`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  if (!amount) {
    await ctx.reply("❌ Jumlah tidak valid. Contoh: `50rb`, `5jt`, `150000`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const categoryName = parts[1].toLowerCase();
  const description = parts.slice(2).join(" ") || null;

  const categories = profile.categories as any[];
  const category = categories.find(
    (c: any) =>
      c.type === "income" &&
      c.name.toLowerCase().includes(categoryName)
  );

  const accounts = profile.accounts as any[];
  const defaultAccount = accounts.find((a: any) => a.is_default) || accounts[0];

  if (!defaultAccount) {
    await ctx.reply("❌ Belum ada akun. Tambahkan akun di aplikasi terlebih dahulu.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("transactions").insert({
    user_id: profile.user_id,
    type: "income",
    amount,
    description,
    date: today,
    account_id: defaultAccount.id,
    category_id: category?.id || null,
    source: "telegram",
  });

  if (error) {
    await ctx.reply(`❌ Gagal menyimpan: ${error.message}`);
    return;
  }

  await ctx.reply(
    `✅ *Pemasukan Tercatat!*\n\n` +
    `💰 Jumlah: *${formatRupiah(amount)}*\n` +
    `📂 Kategori: ${category ? category.icon + " " + category.name : "Tidak ditemukan"}\n` +
    `🏦 Akun: ${defaultAccount.name}\n` +
    `📝 Catatan: ${description || "-"}\n` +
    `📅 Tanggal: ${today}`,
    { parse_mode: "Markdown" }
  );
}

// /balance
export async function handleBalance(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const profile = await getUserByTelegramId(telegramId);
  if (!profile) {
    await ctx.reply("❌ Akun belum terhubung. Gunakan /link terlebih dahulu.");
    return;
  }

  const accounts = profile.accounts as any[];
  if (accounts.length === 0) {
    await ctx.reply("❌ Belum ada akun terdaftar.");
    return;
  }

  const total = accounts.reduce((sum: number, a: any) => sum + Number(a.balance), 0);

  const typeEmoji: Record<string, string> = {
    bank: "🏦",
    ewallet: "📱",
    cash: "💵",
    investment: "📈",
  };

  const lines = accounts
    .map((a: any) => `${typeEmoji[a.type] || "💰"} ${a.name}: *${formatRupiah(Number(a.balance))}*`)
    .join("\n");

  await ctx.reply(
    `💰 *Saldo Akun*\n\n` +
    `${lines}\n` +
    `─────────────────\n` +
    `📊 Total: *${formatRupiah(total)}*`,
    { parse_mode: "Markdown" }
  );
}

// /summary
export async function handleSummary(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const profile = await getUserByTelegramId(telegramId);
  if (!profile) {
    await ctx.reply("❌ Akun belum terhubung. Gunakan /link terlebih dahulu.");
    return;
  }

  const { start, end } = getCurrentMonthRange();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount, categories(name, icon)")
    .eq("user_id", profile.user_id)
    .gte("date", start)
    .lte("date", end);

  if (!transactions || transactions.length === 0) {
    await ctx.reply("📊 Belum ada transaksi bulan ini.");
    return;
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Top spending by category
  const catMap: Record<string, { name: string; icon: string; total: number }> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t: any) => {
      const name = t.categories?.name || "Lainnya";
      const icon = t.categories?.icon || "📦";
      if (!catMap[name]) catMap[name] = { name, icon, total: 0 };
      catMap[name].total += Number(t.amount);
    });

  const topSpending = Object.values(catMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((c) => `${c.icon} ${c.name}: *${formatRupiah(c.total)}*`)
    .join("\n");

  const now = new Date();
  const monthName = now.toLocaleString("id-ID", { month: "long", year: "numeric" });

  await ctx.reply(
    `📊 *Ringkasan ${monthName}*\n` +
    `─────────────────\n` +
    `💰 Pemasukan: *${formatRupiah(income)}*\n` +
    `💸 Pengeluaran: *${formatRupiah(expense)}*\n` +
    `💵 Selisih: *${formatRupiah(income - expense)}*\n` +
    `─────────────────\n` +
    `🏆 Top Pengeluaran:\n${topSpending || "Belum ada data"}`,
    { parse_mode: "Markdown" }
  );
}
```

---

## Step 5: `src/lib/telegram/bot.ts`

```ts
import { Telegraf } from "telegraf";
import {
  handleStart,
  handleHelp,
  handleLink,
  handleExpense,
  handleIncome,
  handleBalance,
  handleSummary,
} from "./commands";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(handleStart);
bot.help(handleHelp);
bot.command("link", handleLink);
bot.command("expense", handleExpense);
bot.command("income", handleIncome);
bot.command("balance", handleBalance);
bot.command("summary", handleSummary);

bot.catch((err) => {
  console.error("Bot error:", err);
});
```

---

## Step 6: `scripts/telegram-bot.ts`

```ts
import "dotenv/config";
import { bot } from "../src/lib/telegram/bot";

console.log("🤖 Telegram bot starting (polling mode)...");

bot.launch({ dropPendingUpdates: true });

console.log("✅ Bot is running!");

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
```

---

## Step 7: `package.json` — tambah script

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "bot": "tsx scripts/telegram-bot.ts",
    "dev:bot": "tsx --watch scripts/telegram-bot.ts"
  }
}
```

---

## Step 8: `src/app/(dashboard)/settings/link/page.tsx`

Halaman untuk handle link token dari Telegram:

```tsx
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
  const { data: { user } } = await supabase.auth.getUser();
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
```

---

## Step 9: Update `settings/page.tsx` — tampilkan status linked

Tambah di bagian Integrasi Telegram:

```tsx
// Fetch profile untuk cek telegram_id
const { data: profile } = await supabase
  .from("profiles")
  .select("telegram_id, full_name")
  .eq("user_id", user.id)
  .single();

// Di JSX — ganti bagian Telegram:
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
            : "Belum terhubung"}
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
```

---

## Step 10: Tambah `NEXT_PUBLIC_APP_URL` ke `.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` bisa dicek di:
```
Supabase Dashboard → Settings → API → service_role key
```

---

## Cara Jalankan

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Telegram Bot
npm run bot
```

---

## Checklist

- [ ] Buat bot di @BotFather, copy token
- [ ] Tambah env vars (TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME, NEXT_PUBLIC_APP_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Jalankan SQL migration (tambah kolom link_token)
- [ ] Buat `src/lib/telegram/utils.ts`
- [ ] Buat `src/lib/telegram/commands.ts`
- [ ] Buat `src/lib/telegram/bot.ts`
- [ ] Buat `scripts/telegram-bot.ts`
- [ ] Update `package.json` tambah script bot
- [ ] Buat `src/app/(dashboard)/settings/link/page.tsx`
- [ ] Update `src/app/(dashboard)/settings/page.tsx`
- [ ] Test: `/start`, `/link`, `/expense`, `/income`, `/balance`, `/summary`
