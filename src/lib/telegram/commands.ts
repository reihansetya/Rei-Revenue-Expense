import { Context, Markup } from "telegraf";
import { createClient } from "@supabase/supabase-js";
import {
  parseAmount,
  formatRupiah,
  getCurrentMonthRange,
  generateToken,
} from "./utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// Helper functions untuk interaksi Supabase Session (pengganti In-Memory Map)
async function getTelegramSession(telegramId: number) {
  const { data, error } = await supabase
    .from("telegram_sessions")
    .select("session_data")
    .eq("telegram_id", telegramId)
    .single();

  if (error || !data) return null;
  return data.session_data;
}

async function setTelegramSession(telegramId: number, sessionData: any) {
  await supabase.from("telegram_sessions").upsert({
    telegram_id: telegramId,
    session_data: sessionData,
    updated_at: new Date().toISOString(),
  });
}

async function deleteTelegramSession(telegramId: number) {
  await supabase.from("telegram_sessions").delete().eq("telegram_id", telegramId);
}

// Helper: get user by telegram_id
async function getUserByTelegramId(telegramId: number) {
  console.log(`🔍 Mencari user dengan Telegram ID: ${telegramId}`);

  // 1. Ambil profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (profileError) {
    console.error("❌ Error fetch profile:", profileError.message);
    return null;
  }

  if (!profile) {
    console.log("⚠️ Profile tidak ditemukan untuk ID ini.");
    return null;
  }

  // 2. Ambil data pendukung (accounts & categories) berdasarkan user_id
  const [accountsRes, categoriesRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", profile.user_id),
    supabase.from("categories").select("*").eq("user_id", profile.user_id),
  ]);

  return {
    ...profile,
    accounts: accountsRes.data || [],
    categories: categoriesRes.data || [],
  };
}

// Helper: Mencari kategori dengan fallback ke "Lainnya"
function findCategory(categories: any[], type: string, query: string) {
  const normalizedQuery = query.toLowerCase();
  
  // 1. Cari yang mirip
  let match = categories.find(
    (c: any) => c.type === type && c.name.toLowerCase().includes(normalizedQuery)
  );
  
  // 2. Fallback ke "Lainnya" atau "Other"
  if (!match) {
    match = categories.find(
      (c: any) => c.type === type && (c.name.toLowerCase() === "lainnya" || c.name.toLowerCase() === "other")
    );
  }
  
  return match;
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
      `/categories - Daftar kategori\n` +
      `/summary - Ringkasan bulan ini\n` +
      `/help - Bantuan`,
    { parse_mode: "Markdown" },
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
      `/categories - Lihat daftar kategori tersedia\n` +
      `/summary - Ringkasan bulan ini\n` +
      `/link - Hubungkan akun Telegram`,
    { parse_mode: "Markdown" },
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

  // Simple approach: encode telegramId di token
  const linkToken = `${token}_${telegramId}`;

  await ctx.reply(
    `🔗 <b>Link Akun Telegram</b>\n\n` +
      `Klik link berikut untuk menghubungkan akun:\n` +
      `${APP_URL}/settings/link?token=${linkToken}\n\n` +
      `⏰ Link berlaku <b>10 menit</b>\n` +
      `❗ Jangan bagikan link ini ke siapapun`,
    { parse_mode: "HTML" },
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

  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
  const parts = text.split(" ").slice(1);

  // LOGIKA WIZARD (Jika tanpa argumen)
  if (parts.length === 0) {
    await setTelegramSession(telegramId, { type: "wizard", wizardType: "expense", step: "amount" });
    await ctx.reply("💸 *Catat Pengeluaran Baru*\n\nBerapa nominalnya? (Contoh: `50k`, `100000`, `2.5jt`)", { parse_mode: "Markdown" });
    return;
  }

  // LOGIKA QUICK INPUT (Jika ada argumen)
  if (parts.length < 2) {
    await ctx.reply(
      "❌ Format salah.\n\nContoh: `/expense 50rb makan [catatan]`\nAtau cukup ketik `/expense` untuk panduan step-by-step.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  if (!amount) {
    await ctx.reply("❌ Jumlah tidak valid. Contoh: `50rb`, `5jt`", { parse_mode: "Markdown" });
    return;
  }

  const categoryName = parts[1];
  const description = parts.slice(2).join(" ") || null;
  const category = findCategory(profile.categories, "expense", categoryName);

  await showAccountSelection(ctx, profile, "expense", amount, category, description);
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

  // LOGIKA WIZARD
  if (parts.length === 0) {
    await setTelegramSession(telegramId, { type: "wizard", wizardType: "income", step: "amount" });
    await ctx.reply("💰 *Catat Pemasukan Baru*\n\nBerapa nominalnya? (Contoh: `5jt`, `500k`)", { parse_mode: "Markdown" });
    return;
  }

  // LOGIKA QUICK INPUT
  if (parts.length < 2) {
    await ctx.reply(
      "❌ Format salah.\n\nContoh: `/income 5jt gaji [catatan]`\nAtau cukup ketik `/income` untuk panduan step-by-step.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  if (!amount) {
    await ctx.reply("❌ Jumlah tidak valid. Contoh: `50rb`, `1jt`", { parse_mode: "Markdown" });
    return;
  }

  const categoryName = parts[1];
  const description = parts.slice(2).join(" ") || null;
  const category = findCategory(profile.categories, "income", categoryName);

  await showAccountSelection(ctx, profile, "income", amount, category, description);
}

// Helper: Tampilkan pilihan akun (Tahap Akhir)
async function showAccountSelection(ctx: Context, profile: any, type: string, amount: number, category: any, description: any) {
  const accounts = profile.accounts as any[];
  if (accounts.length === 0) {
    await ctx.reply("❌ Kamu belum punya akun. Tambahkan dulu di aplikasi.");
    return;
  }

  const requestId = Math.random().toString(36).slice(2, 10);
  await setTelegramSession(profile.telegram_id, {
    type: "pending",
    userId: profile.user_id,
    wizardType: type,
    amount,
    categoryId: category?.id || null,
    categoryName: category ? category.icon + " " + category.name : "Tanpa Kategori",
    description,
    today: new Date().toISOString().split("T")[0],
    requestId,
  });

  const buttons = accounts.map((acc: any) =>
    Markup.button.callback(acc.name, `a:${requestId}:${acc.id}`)
  );

  const emoji = type === "expense" ? "💸" : "💰";
  const label = type === "expense" ? "Pengeluaran" : "Pemasukan";

  await ctx.reply(
    `${emoji} *Pilih Akun untuk ${label}*\n\n` +
      `💵 Jumlah: *${formatRupiah(amount)}*\n` +
      `📂 Kategori: ${category ? category.icon + " " + category.name : "Tidak ditemukan"}\n` +
      `📝 Catatan: ${description || "-"}\n\n` +
      `Klik tombol di bawah untuk konfirmasi:`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons, { columns: 2 }),
    }
  );
}

// Handler untuk pesan teks biasa (Menangkap input Wizard)
export async function handleTextMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const session = await getTelegramSession(telegramId);
  if (!session || session.type !== "wizard") return; // Bukan sedang dalam session wizard

  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";

  // Tahap 1: Input Nominal
  if (session.step === "amount") {
    const parts = text.split(" ");
    const amount = parseAmount(parts[0]);

    if (!amount) {
      await ctx.reply("❌ Jumlah tidak valid. Harap masukkan angka atau format seperti `50k`, `2jt`.");
      return;
    }

    // Ambil profile untuk data kategori/akun
    const profile = await getUserByTelegramId(telegramId);
    if (!profile) return;

    // JIKA USER INPUT GANDA (Contoh: "50k makan" atau "50k makan siomay")
    if (parts.length > 1) {
      const categoryName = parts[1];
      const description = parts.slice(2).join(" ") || null;
      const category = findCategory(profile.categories, session.wizardType, categoryName);

      await deleteTelegramSession(telegramId); // Hapus session wizard
      await showAccountSelection(ctx, profile, session.wizardType, amount, category, description);
      return;
    }

    // JIKA HANYA INPUT NOMINAL (Lanjut Wizard Normal)
    session.amount = amount;
    session.step = "category";
    await setTelegramSession(telegramId, session);

    const categories = (profile.categories as any[]).filter(c => c.type === session.wizardType);

    if (categories.length === 0) {
       session.step = "description";
       await setTelegramSession(telegramId, session);
       await ctx.reply("📂 Belum ada kategori. Langsung tulis catatan/deskripsi (atau ketik 'skip'):");
       return;
    }

    // Tampilkan pilihan kategori dengan tombol (prefix "c:" untuk category)
    const buttons = categories.map(c => 
      Markup.button.callback(`${c.icon || ""} ${c.name}`, `c:${c.id}:${c.icon + " " + c.name}`)
    );

    await ctx.reply(`✅ Nominal: *${formatRupiah(amount)}*\n\nSekarang pilih kategori:`, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons, { columns: 2 })
    });
    return;
  }

  // Tahap 2: Input Deskripsi (Tahap kategori dihandle oleh handleCallback)
  if (session.step === "description") {
    const description = text.toLowerCase() === "skip" ? null : text;
    
    // Selesai Wizard -> Lanjut ke pilih akun
    const profile = await getUserByTelegramId(telegramId);
    if (!profile) return;

    const category = session.categoryId ? { id: session.categoryId, name: session.categoryName?.split(" ").slice(1).join(" "), icon: session.categoryName?.split(" ")[0] } : null;

    await deleteTelegramSession(telegramId); // Bersihkan session
    await showAccountSelection(ctx, profile, session.wizardType, session.amount!, category, description);
  }
}

// Handler saat tombol diklik
export async function handleCallback(ctx: Context) {
  const cbData = (ctx.callbackQuery as any)?.data;
  if (!cbData) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // CASE 1: Pilihan Kategori (Wizard)
  if (cbData.startsWith("c:")) {
    const session = await getTelegramSession(telegramId);
    if (!session || session.type !== "wizard") return;

    const [, categoryId, categoryName] = cbData.split(":");
    session.categoryId = categoryId;
    session.categoryName = categoryName;
    session.step = "description";
    await setTelegramSession(telegramId, session);

    await ctx.editMessageText(`📂 Kategori: *${categoryName}*\n\nSekarang tulis catatan/deskripsi (atau ketik \`skip\`)`, { parse_mode: "Markdown" });
    return;
  }

  // CASE 2: Pilihan Akun (Final)
  if (cbData.startsWith("a:")) {
    const [, requestId, accountId] = cbData.split(":");
    const data = await getTelegramSession(telegramId);

    if (!data || data.type !== "pending" || data.requestId !== requestId) {
      await ctx.answerCbQuery("❌ Sesi berakhir atau data tidak ditemukan.");
      return;
    }

    // Ambil nama akun untuk konfirmasi
    const { data: account } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", accountId)
      .single();

    // Simpan ke database
    const { error } = await supabase.from("transactions").insert({
      user_id: data.userId,
      type: data.wizardType,
      amount: data.amount,
      description: data.description,
      date: data.today,
      account_id: accountId,
      category_id: data.categoryId,
      source: "telegram",
    });

    if (error) {
      await ctx.answerCbQuery(`❌ Gagal menyimpan: ${error.message}`);
      return;
    }

    // Hapus dari session db
    await deleteTelegramSession(telegramId);

    // Update pesan agar tidak bisa diklik lagi (ganti dengan status sukses)
    await ctx.answerCbQuery("✅ Berhasil disimpan!");
    await ctx.editMessageText(
      `✅ *${data.wizardType === "expense" ? "Pengeluaran" : "Pemasukan"} Tercatat!*\n\n` +
        `💵 Jumlah: *${formatRupiah(data.amount)}*\n` +
        `📂 Kategori: ${data.categoryName}\n` +
        `🏦 Akun: ${account?.name || "Unkown"}\n` +
        `📝 Catatan: ${data.description || "-"}\n` +
        `📅 Tanggal: ${data.today}`,
      { parse_mode: "Markdown" },
    );
  }
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

  const walletAccounts = accounts.filter((a: any) => a.type !== "investment");
  const investmentAccounts = accounts.filter(
    (a: any) => a.type === "investment",
  );

  const typeEmoji: Record<string, string> = {
    bank: "🏦",
    ewallet: "📱",
    cash: "💵",
    investment: "📈",
  };

  const walletLines = walletAccounts
    .map(
      (a: any) =>
        `${typeEmoji[a.type] || "💰"} ${a.name}: *${formatRupiah(Number(a.balance))}*`,
    )
    .join("\n");

  const investmentLines = investmentAccounts
    .map(
      (a: any) =>
        `${typeEmoji[a.type] || "📈"} ${a.name}: *${formatRupiah(Number(a.balance))}*`,
    )
    .join("\n");

  const walletTotal = walletAccounts.reduce(
    (sum: number, a: any) => sum + Number(a.balance),
    0,
  );
  const investmentTotal = investmentAccounts.reduce(
    (sum: number, a: any) => sum + Number(a.balance),
    0,
  );

  let message = `💰 *Saldo Akun*\n\n`;

  if (walletAccounts.length > 0) {
    message += `👛 *Dompet*\n${walletLines}\n└─ Total Dompet: *${formatRupiah(walletTotal)}*\n\n`;
  }

  if (investmentAccounts.length > 0) {
    message += `📈 *Investasi*\n${investmentLines}\n└─ Total Investasi: *${formatRupiah(investmentTotal)}*\n\n`;
  }

  message += `═══════════════════\n📊 Total Keseluruhan: *${formatRupiah(walletTotal + investmentTotal)}*`;

  await ctx.reply(message, { parse_mode: "Markdown" });
}

// /categories
export async function handleCategories(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const profile = await getUserByTelegramId(telegramId);
  if (!profile) {
    await ctx.reply("❌ Akun belum terhubung. Gunakan /link terlebih dahulu.");
    return;
  }

  const categories = profile.categories as any[];
  if (categories.length === 0) {
    await ctx.reply("❌ Belum ada kategori terdaftar.");
    return;
  }

  const expenseCats = categories
    .filter((c) => c.type === "expense")
    .map((c) => `${c.icon || "💸"} ${c.name}`)
    .join("\n");

  const incomeCats = categories
    .filter((c) => c.type === "income")
    .map((c) => `${c.icon || "💰"} ${c.name}`)
    .join("\n");

  await ctx.reply(
    `📂 *Daftar Kategori*\n\n` +
      `─────────────────\n` +
      `💸 *Pengeluaran*\n\n${expenseCats || "-\n"}\n` +
      `─────────────────\n` +
      `─────────────────\n` +
      `💰 *Pemasukan*\n\n${incomeCats || "-"}\n\n` +
      `─────────────────\n` +
      `💡 *Tips:*\n` +
      `Gunakan nama kategori saat input transaksi.\n\n` +
      `Contoh:\n` +
      `• \`/expense 50rb makan\`\n` +
      `• \`/income 5jt gaji\``,
    { parse_mode: "Markdown" },
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
  const catMap: Record<string, { name: string; icon: string; total: number }> =
    {};
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
  const monthName = now.toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  await ctx.reply(
    `📊 *Ringkasan ${monthName}*\n` +
      `─────────────────\n` +
      `💰 Pemasukan: *${formatRupiah(income)}*\n` +
      `💸 Pengeluaran: *${formatRupiah(expense)}*\n` +
      `💵 Selisih: *${formatRupiah(income - expense)}*\n` +
      `─────────────────\n` +
      `🏆 Top Pengeluaran:\n${topSpending || "Belum ada data"}`,
    { parse_mode: "Markdown" },
  );
}
