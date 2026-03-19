import { Context, Markup } from "telegraf";
import { createClient } from "@supabase/supabase-js";
import {
  parseAmount,
  formatRupiah,
  getCurrentMonthRange,
  generateToken,
} from "./utils";
import {
  classifyMessage,
  parseTransaction,
  parseQuery,
  parseTransfer,
  getDateRange,
  getPeriodLabel,
  hasAmount,
  type ParsedTransaction,
  type ParsedQuery,
  type ParsedTransfer,
} from "./parser";

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
  await supabase
    .from("telegram_sessions")
    .delete()
    .eq("telegram_id", telegramId);
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
    (c: any) =>
      c.type === type && c.name.toLowerCase().includes(normalizedQuery),
  );

  // 2. Fallback ke "Lainnya" atau "Other"
  if (!match) {
    match = categories.find(
      (c: any) =>
        c.type === type &&
        (c.name.toLowerCase() === "lainnya" ||
          c.name.toLowerCase() === "other"),
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
      `/transfer <jumlah> <akun_dari> <akun_ke> [catatan]\n` +
      `/balance - Cek saldo\n` +
      `/categories - Daftar kategori\n` +
      `/summary - Ringkasan bulan ini\n` +
      `/cancel - Batalkan wizard aktif\n` +
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
      `*Transfer Antar Akun:*\n` +
      `/transfer 50k BCA GoPay\n` +
      `/transfer 100000 dari BCA ke GoPay\n` +
      `Transfer 200k BCA ke BRI (Natural Language)\n\n` +
      `*Format Jumlah:*\n` +
      `• \`50rb\` atau \`50ribu\` = Rp 50.000\n` +
      `• \`5jt\` atau \`5juta\` = Rp 5.000.000\n` +
      `• \`50k\` = Rp 50.000\n` +
      `• \`50000\` = Rp 50.000\n\n` +
      `*Mode Wizard (Step-by-step):*\n` +
      `• Ketik \`/expense\`, \`/income\`, atau \`/transfer\` tanpa argumen\n` +
      `• Ikuti panduan step-by-step dari bot\n` +
      `• Ketik \`/cancel\` untuk keluar dari wizard\n\n` +
      `*Lainnya:*\n` +
      `/balance - Lihat saldo semua akun\n` +
      `/categories - Lihat daftar kategori tersedia\n` +
      `/summary - Ringkasan bulan ini\n` +
      `/cancel - Batalkan wizard aktif\n` +
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
    await setTelegramSession(telegramId, {
      type: "wizard",
      wizardType: "expense",
      step: "amount",
    });
    await ctx.reply(
      "💸 *Catat Pengeluaran Baru*\n\nBerapa nominalnya? (Contoh: `50k`, `100000`, `2.5jt`)",
      { parse_mode: "Markdown" },
    );
    return;
  }

  // LOGIKA QUICK INPUT (Jika ada argumen)
  if (parts.length < 2) {
    await ctx.reply(
      "❌ Format salah.\n\nContoh: `/expense 50rb makan [catatan]`\nAtau cukup ketik `/expense` untuk panduan step-by-step.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  if (!amount) {
    await ctx.reply("❌ Jumlah tidak valid. Contoh: `50rb`, `5jt`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const categoryName = parts[1];
  const description = parts.slice(2).join(" ") || null;
  const category = findCategory(profile.categories, "expense", categoryName);

  await showAccountSelection(
    ctx,
    profile,
    "expense",
    amount,
    category,
    description,
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

  // LOGIKA WIZARD
  if (parts.length === 0) {
    await setTelegramSession(telegramId, {
      type: "wizard",
      wizardType: "income",
      step: "amount",
    });
    await ctx.reply(
      "💰 *Catat Pemasukan Baru*\n\nBerapa nominalnya? (Contoh: `5jt`, `500k`)",
      { parse_mode: "Markdown" },
    );
    return;
  }

  // LOGIKA QUICK INPUT
  if (parts.length < 2) {
    await ctx.reply(
      "❌ Format salah.\n\nContoh: `/income 5jt gaji [catatan]`\nAtau cukup ketik `/income` untuk panduan step-by-step.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  if (!amount) {
    await ctx.reply("❌ Jumlah tidak valid. Contoh: `50rb`, `1jt`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const categoryName = parts[1];
  const description = parts.slice(2).join(" ") || null;
  const category = findCategory(profile.categories, "income", categoryName);

  await showAccountSelection(
    ctx,
    profile,
    "income",
    amount,
    category,
    description,
  );
}

// /transfer
export async function handleTransfer(ctx: Context) {
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
    const accounts = profile.accounts as any[];
    if (accounts.length < 2) {
      await ctx.reply(
        "❌ Kamu perlu minimal 2 akun untuk transfer. Tambahkan akun dulu di aplikasi.",
      );
      return;
    }

    await setTelegramSession(telegramId, {
      type: "wizard",
      wizardType: "transfer",
      step: "amount",
    });
    await ctx.reply(
      "💸 *Transfer Saldo Antar Akun*\n\nBerapa nominalnya? (Contoh: `50k`, `100000`, `2.5jt`)",
      { parse_mode: "Markdown" },
    );
    return;
  }

  // LOGIKA QUICK INPUT (Jika ada argumen)
  if (parts.length < 3) {
    await ctx.reply(
      "❌ Format salah.\n\nContoh: `/transfer 50rb BCA GoPay`\nAtau cukup ketik `/transfer` untuk panduan step-by-step.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  if (!amount) {
    await ctx.reply("❌ Jumlah tidak valid. Contoh: `50rb`, `5jt`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const srcAccountName = parts[1];
  const dstAccountName = parts[2];
  const description = parts.slice(3).join(" ") || null;

  const srcAccount = profile.accounts.find(
    (a: any) => a.name.toLowerCase() === srcAccountName.toLowerCase(),
  );
  const dstAccount = profile.accounts.find(
    (a: any) => a.name.toLowerCase() === dstAccountName.toLowerCase(),
  );

  await showTransferConfirmation(
    ctx,
    profile,
    amount,
    srcAccount,
    dstAccount,
    description,
  );
}

// Helper: Tampilkan pilihan akun (Tahap Akhir)
async function showAccountSelection(
  ctx: Context,
  profile: any,
  type: string,
  amount: number,
  category: any,
  description: any,
) {
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
    categoryName: category
      ? category.icon + " " + category.name
      : "Tanpa Kategori",
    description,
    today: new Date().toISOString().split("T")[0],
    requestId,
  });

  const buttons = accounts.map((acc: any) =>
    Markup.button.callback(acc.name, `a:${requestId}:${acc.id}`),
  );

  // Tambah tombol cancel
  buttons.push(Markup.button.callback("❌ Batal", `cancel:${requestId}`));

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
    },
  );
}

// Helper: Tampilkan konfirmasi transfer
async function showTransferConfirmation(
  ctx: Context,
  profile: any,
  amount: number,
  srcAccount: any,
  dstAccount: any,
  description: string | null,
) {
  // Validasi: Cek apakah akun ditemukan
  if (!srcAccount) {
    await ctx.reply("❌ Akun sumber tidak ditemukan.");
    return;
  }

  if (!dstAccount) {
    await ctx.reply("❌ Akun tujuan tidak ditemukan.");
    return;
  }

  // Validasi: Cek apakah source dan destination sama
  if (srcAccount.id === dstAccount.id) {
    await ctx.reply("❌ Akun sumber dan tujuan tidak boleh sama!");
    return;
  }

  // Validasi: Cek saldo cukup
  if (Number(srcAccount.balance) < amount) {
    await ctx.reply(
      `❌ Saldo tidak mencukupi!\n\n` +
        `Saldo ${srcAccount.name}: ${formatRupiah(Number(srcAccount.balance))}\n` +
        `Jumlah transfer: ${formatRupiah(amount)}`,
    );
    return;
  }

  const requestId = Math.random().toString(36).slice(2, 10);

  // Simpan ke pending session
  await setTelegramSession(profile.telegram_id, {
    type: "pending",
    userId: profile.user_id,
    wizardType: "transfer",
    amount,
    srcAccountId: srcAccount.id,
    srcAccountName: srcAccount.name,
    dstAccountId: dstAccount.id,
    dstAccountName: dstAccount.name,
    description,
    today: new Date().toISOString().split("T")[0],
    requestId,
  });

  await ctx.reply(
    `💸 *Konfirmasi Transfer*\n\n` +
      `💵 Jumlah: *${formatRupiah(amount)}*\n` +
      `🏦 Dari: ${srcAccount.name}\n` +
      `🏦 Ke: ${dstAccount.name}\n` +
      `📝 Catatan: ${description || "-"}\n` +
      `📅 Tanggal: ${new Date().toISOString().split("T")[0]}\n\n` +
      `Apakah sudah benar?`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Konfirmasi", `t:${requestId}`),
          Markup.button.callback("❌ Batal", `cancel:${requestId}`),
        ],
      ]),
    },
  );
}

// Helper: Execute transfer (simpan 2 transaksi dan update balances)
async function executeTransfer(
  userId: string,
  srcAccountId: string,
  dstAccountId: string,
  amount: number,
  description: string | null,
  date: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get current balances
    const [srcAcc, dstAcc] = await Promise.all([
      supabase
        .from("accounts")
        .select("balance")
        .eq("id", srcAccountId)
        .single(),
      supabase
        .from("accounts")
        .select("balance")
        .eq("id", dstAccountId)
        .single(),
    ]);

    if (srcAcc.error || !srcAcc.data) {
      return { success: false, error: "Akun sumber tidak ditemukan" };
    }

    if (dstAcc.error || !dstAcc.data) {
      return { success: false, error: "Akun tujuan tidak ditemukan" };
    }

    const srcBalance = Number(srcAcc.data.balance);
    const dstBalance = Number(dstAcc.data.balance);

    // 2. Validate balance
    if (srcBalance < amount) {
      return { success: false, error: "Saldo tidak mencukupi" };
    }

    // 3. Insert expense transaction (source account)
    const { error: expenseError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "expense",
      amount: amount,
      description: description || `Transfer ke akun lain`,
      date: date,
      account_id: srcAccountId,
      category_id: null, // Transfer tidak pakai kategori
      source: "telegram",
    });

    if (expenseError) {
      console.error("❌ Error inserting expense transaction:", expenseError);
      return { success: false, error: "Gagal mencatat pengeluaran" };
    }

    // 4. Insert income transaction (destination account)
    const { error: incomeError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "income",
      amount: amount,
      description: description || `Transfer dari akun lain`,
      date: date,
      account_id: dstAccountId,
      category_id: null, // Transfer tidak pakai kategori
      source: "telegram",
    });

    if (incomeError) {
      console.error("❌ Error inserting income transaction:", incomeError);
      return { success: false, error: "Gagal mencatat pemasukan" };
    }

    // 5. Update balances
    const newSrcBalance = srcBalance - amount;
    const newDstBalance = dstBalance + amount;

    const [srcUpdate, dstUpdate] = await Promise.all([
      supabase
        .from("accounts")
        .update({ balance: newSrcBalance })
        .eq("id", srcAccountId),
      supabase
        .from("accounts")
        .update({ balance: newDstBalance })
        .eq("id", dstAccountId),
    ]);

    if (srcUpdate.error) {
      console.error("❌ Error updating source balance:", srcUpdate.error);
      return { success: false, error: "Gagal mengupdate saldo sumber" };
    }

    if (dstUpdate.error) {
      console.error("❌ Error updating destination balance:", dstUpdate.error);
      return { success: false, error: "Gagal mengupdate saldo tujuan" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ Transfer error:", error);
    return { success: false, error: error.message || "Terjadi kesalahan" };
  }
}

// Handler untuk pesan teks biasa (Menangkap input Wizard dan Natural Language)
export async function handleTextMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";

  console.log(`📨 Received message from ${telegramId}: "${text}"`);

  const session = await getTelegramSession(telegramId);

  // Jika sedang dalam session wizard, cek apakah user ingin keluar dari wizard
  if (session && session.type === "wizard") {
    console.log(`📋 In wizard mode, step: ${session.step}`);

    // Check jika user mengirim input yang jelas-jelas transaction (mengandung amount)
    // Jika ya, cancel wizard dan handle sebagai natural language transaction
    if (hasAmount(text) && session.step !== "amount") {
      console.log(
        `🔄 User sent amount while in wizard - canceling wizard and handling as natural language`,
      );
      await deleteTelegramSession(telegramId);

      // Get profile ulang dan handle sebagai natural language
      const profile = await getUserByTelegramId(telegramId);
      if (!profile) {
        await ctx.reply(
          "❌ Akun belum terhubung. Gunakan /link terlebih dahulu.",
        );
        return;
      }

      const messageType = classifyMessage(text);
      console.log(`🔎 Classified as: ${messageType}`);

      if (messageType === "transaction") {
        await handleNaturalLanguageTransaction(ctx, profile, text);
        return;
      }

      if (messageType === "query") {
        await handleNaturalLanguageQuery(ctx, profile, text);
        return;
      }
    }

    await handleWizardMessage(ctx, telegramId, session, text);
    return;
  }

  // Jika tidak dalam wizard, coba parse dengan rule-based parser
  console.log(`🔍 Getting user profile...`);
  const profile = await getUserByTelegramId(telegramId);

  if (!profile) {
    console.log(`❌ Profile not found for Telegram ID: ${telegramId}`);
    await ctx.reply("❌ Akun belum terhubung. Gunakan /link terlebih dahulu.");
    return;
  }

  console.log(`✅ Profile found: ${profile.user_id}`);

  const messageType = classifyMessage(text);
  console.log(`🔎 Classified as: ${messageType}`);

  // Handle transfer (check for transfer keywords)
  const transferKeywords = ["transfer", "pindah", "move"];
  if (transferKeywords.some((kw) => text.toLowerCase().includes(kw))) {
    console.log(`💸 Processing as transfer...`);
    await handleNaturalLanguageTransfer(ctx, profile, text);
    return;
  }

  // Handle natural language transaction
  if (messageType === "transaction") {
    console.log(`💰 Processing as transaction...`);
    await handleNaturalLanguageTransaction(ctx, profile, text);
    return;
  }

  // Handle natural language query
  if (messageType === "query") {
    console.log(`📊 Processing as query...`);
    await handleNaturalLanguageQuery(ctx, profile, text);
    return;
  }

  // Unknown message
  console.log(`❓ Unknown message type`);
  await ctx.reply(
    "🤔 Maaf, saya tidak mengerti. Coba format seperti:\n" +
      '• "Makan 25k" untuk catat pengeluaran\n' +
      '• "Transfer 50k BCA GoPay" untuk transfer\n' +
      '• "Saldo berapa?" untuk cek saldo\n' +
      '• "/help" untuk bantuan',
  );
}

// Helper: Handle wizard message
async function handleWizardMessage(
  ctx: Context,
  telegramId: number,
  session: any,
  text: string,
) {
  // Tahap 1: Input Nominal
  if (session.step === "amount") {
    const parts = text.split(" ");
    const amount = parseAmount(parts[0]);

    if (!amount) {
      await ctx.reply(
        "❌ Jumlah tidak valid. Harap masukkan angka atau format seperti `50k`, `2jt`.",
      );
      return;
    }

    // Ambil profile untuk data kategori/akun
    const profile = await getUserByTelegramId(telegramId);
    if (!profile) return;

    // JIKA TRANSFER WIZARD
    if (session.wizardType === "transfer") {
      session.amount = amount;
      session.step = "src_account";
      await setTelegramSession(telegramId, session);

      const accounts = profile.accounts as any[];
      const buttons = accounts.map((acc) =>
        Markup.button.callback(acc.name, `sa:${acc.id}:${acc.name}`),
      );

      await ctx.reply(
        `✅ Nominal: *${formatRupiah(amount)}*\n\nPilih akun sumber:`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard(buttons, { columns: 2 }),
        },
      );
      return;
    }

    // JIKA USER INPUT GANDA (Contoh: "50k makan" atau "50k makan siomay")
    if (parts.length > 1) {
      const categoryName = parts[1];
      const description = parts.slice(2).join(" ") || null;
      const category = findCategory(
        profile.categories,
        session.wizardType,
        categoryName,
      );

      await deleteTelegramSession(telegramId); // Hapus session wizard
      await showAccountSelection(
        ctx,
        profile,
        session.wizardType,
        amount,
        category,
        description,
      );
      return;
    }

    // JIKA HANYA INPUT NOMINAL (Lanjut Wizard Normal)
    session.amount = amount;
    session.step = "category";
    await setTelegramSession(telegramId, session);

    const categories = (profile.categories as any[]).filter(
      (c) => c.type === session.wizardType,
    );

    if (categories.length === 0) {
      session.step = "description";
      await setTelegramSession(telegramId, session);
      await ctx.reply(
        "📂 Belum ada kategori. Langsung tulis catatan/deskripsi (atau ketik 'skip'):",
      );
      return;
    }

    // Tampilkan pilihan kategori dengan tombol (prefix "c:" untuk category)
    const buttons = categories.map((c) =>
      Markup.button.callback(
        `${c.icon || ""} ${c.name}`,
        `c:${c.id}:${c.icon + " " + c.name}`,
      ),
    );

    await ctx.reply(
      `✅ Nominal: *${formatRupiah(amount)}*\n\nSekarang pilih kategori:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons, { columns: 2 }),
      },
    );
    return;
  }

  // Tahap 2: Input Deskripsi (Tahap kategori dihandle oleh handleCallback)
  if (session.step === "description") {
    const description = text.toLowerCase() === "skip" ? null : text;

    // Selesai Wizard
    const profile = await getUserByTelegramId(telegramId);
    if (!profile) return;

    await deleteTelegramSession(telegramId); // Bersihkan session

    // Jika TRANSFER WIZARD
    if (session.wizardType === "transfer") {
      const srcAccount = profile.accounts.find(
        (a: any) => a.id === session.srcAccountId,
      );
      const dstAccount = profile.accounts.find(
        (a: any) => a.id === session.dstAccountId,
      );

      await showTransferConfirmation(
        ctx,
        profile,
        session.amount!,
        srcAccount,
        dstAccount,
        description,
      );
      return;
    }

    // Jika EXPENSE/INCOME WIZARD
    const category = session.categoryId
      ? {
          id: session.categoryId,
          name: session.categoryName?.split(" ").slice(1).join(" "),
          icon: session.categoryName?.split(" ")[0],
        }
      : null;

    await showAccountSelection(
      ctx,
      profile,
      session.wizardType,
      session.amount!,
      category,
      description,
    );
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

    await ctx.editMessageText(
      `📂 Kategori: *${categoryName}*\n\nSekarang tulis catatan/deskripsi (atau ketik \`skip\`)`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // CASE 1.5: Pilihan Akun Sumber (Transfer Wizard)
  if (cbData.startsWith("sa:")) {
    const session = await getTelegramSession(telegramId);
    if (!session || session.type !== "wizard") return;

    const [, srcAccountId, srcAccountName] = cbData.split(":");
    session.srcAccountId = srcAccountId;
    session.srcAccountName = srcAccountName;
    session.step = "dst_account";
    await setTelegramSession(telegramId, session);

    // Get accounts for destination selection (excluding source)
    const profile = await getUserByTelegramId(telegramId);
    if (!profile) return;

    const accounts = profile.accounts as any[];
    const dstAccounts = accounts.filter((a) => a.id !== srcAccountId);

    const buttons = dstAccounts.map((acc) =>
      Markup.button.callback(acc.name, `da:${acc.id}:${acc.name}`),
    );

    await ctx.editMessageText(
      `✅ Nominal: *${formatRupiah(session.amount!)}*\n` +
        `🏦 Akun Sumber: ${srcAccountName}\n\n` +
        `Pilih akun tujuan:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons, { columns: 2 }),
      },
    );
    return;
  }

  // CASE 1.6: Pilihan Akun Tujuan (Transfer Wizard)
  if (cbData.startsWith("da:")) {
    const session = await getTelegramSession(telegramId);
    if (!session || session.type !== "wizard") return;

    const [, dstAccountId, dstAccountName] = cbData.split(":");
    session.dstAccountId = dstAccountId;
    session.dstAccountName = dstAccountName;
    session.step = "description";
    await setTelegramSession(telegramId, session);

    await ctx.editMessageText(
      `✅ Nominal: *${formatRupiah(session.amount!)}*\n` +
        `🏦 Akun Sumber: ${session.srcAccountName}\n` +
        `🏦 Akun Tujuan: ${dstAccountName}\n\n` +
        `Sekarang tulis catatan/deskripsi (atau ketik \`skip\`)`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // CASE 2: Transfer Confirmation
  if (cbData.startsWith("t:")) {
    const [, requestId] = cbData.split(":");
    const data = await getTelegramSession(telegramId);

    if (!data || data.type !== "pending" || data.requestId !== requestId) {
      await ctx.answerCbQuery("❌ Sesi berakhir atau data tidak ditemukan.");
      return;
    }

    console.log(`💸 Executing transfer:`, JSON.stringify(data, null, 2));

    // Execute transfer
    const result = await executeTransfer(
      data.userId,
      data.srcAccountId,
      data.dstAccountId,
      data.amount,
      data.description,
      data.today || new Date().toISOString().split("T")[0],
    );

    if (!result.success) {
      console.error("❌ Transfer failed:", result.error);
      await ctx.answerCbQuery(`❌ ${result.error}`);
      return;
    }

    // Hapus session
    await deleteTelegramSession(telegramId);

    await ctx.answerCbQuery("✅ Transfer berhasil!");
    await ctx.editMessageText(
      `✅ *Transfer Berhasil!*\n\n` +
        `💵 Jumlah: *${formatRupiah(data.amount)}*\n` +
        `🏦 Dari: ${data.srcAccountName}\n` +
        `🏦 Ke: ${data.dstAccountName}\n` +
        `📝 Catatan: ${data.description || "-"}\n` +
        `📅 Tanggal: ${data.today || new Date().toISOString().split("T")[0]}`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // CASE 3: Cancel Transaction/Transfer
  if (cbData.startsWith("cancel:")) {
    const [, requestId] = cbData.split(":");
    const data = await getTelegramSession(telegramId);

    if (!data || data.type !== "pending" || data.requestId !== requestId) {
      await ctx.answerCbQuery("❌ Sesi berakhir atau data tidak ditemukan.");
      return;
    }

    console.log(`🚫 Canceling transaction/transfer: ${requestId}`);

    // Hapus session
    await deleteTelegramSession(telegramId);

    let label = "";
    if (data.wizardType === "expense") {
      label = "Pengeluaran";
    } else if (data.wizardType === "income") {
      label = "Pemasukan";
    } else if (data.wizardType === "transfer") {
      label = "Transfer";
    }

    let message = "";
    if (data.wizardType === "transfer") {
      message =
        `❌ *${label} Dibatalkan*\n\n` +
        `💵 Jumlah: ${formatRupiah(data.amount)}\n` +
        `🏦 Dari: ${data.srcAccountName}\n` +
        `🏦 Ke: ${data.dstAccountName}\n` +
        `📝 Catatan: ${data.description || "-"}`;
    } else {
      message =
        `❌ *${label} Dibatalkan*\n\n` +
        `💵 Jumlah: ${formatRupiah(data.amount)}\n` +
        `📂 Kategori: ${data.categoryName || "Tanpa Kategori"}\n` +
        `📝 Catatan: ${data.description || "-"}`;
    }

    await ctx.answerCbQuery("✅ Dibatalkan");
    await ctx.editMessageText(message, { parse_mode: "Markdown" });
    return;
  }

  // CASE 3: Pilihan Akun (Final)
  if (cbData.startsWith("a:")) {
    const [, requestId, accountId] = cbData.split(":");
    const data = await getTelegramSession(telegramId);

    if (!data || data.type !== "pending" || data.requestId !== requestId) {
      await ctx.answerCbQuery("❌ Sesi berakhir atau data tidak ditemukan.");
      return;
    }

    console.log(`📝 Saving transaction:`, JSON.stringify(data, null, 2));
    console.log(`💳 Selected account ID: ${accountId}`);

    // Ambil nama akun untuk konfirmasi
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      console.error("❌ Error fetching account:", accountError);
      await ctx.answerCbQuery("❌ Akun tidak ditemukan.");
      return;
    }

    // Validasi data sebelum simpan
    if (!data.userId || !data.wizardType || !data.amount || !accountId) {
      console.error("❌ Missing required data:", {
        userId: data.userId,
        type: data.wizardType,
        amount: data.amount,
        accountId,
      });
      await ctx.answerCbQuery("❌ Data tidak lengkap.");
      return;
    }

    // Siapkan data untuk insert (pastikan tidak ada null yang tidak diizinkan)
    const transactionData: any = {
      user_id: data.userId,
      type: data.wizardType,
      amount: data.amount,
      description: data.description || "", // Pastikan tidak null
      date: data.date || data.today || new Date().toISOString().split("T")[0], // Gunakan date atau today
      account_id: accountId,
      category_id: data.categoryId, // Boleh null jika kolom database nullable
      source: "telegram",
    };

    console.log(
      `💾 Inserting to database:`,
      JSON.stringify(transactionData, null, 2),
    );

    // Simpan ke database
    const { error } = await supabase
      .from("transactions")
      .insert(transactionData);

    if (error) {
      console.error("❌ Database error:", error);
      await ctx.answerCbQuery(`❌ Gagal menyimpan: ${error.message}`);
      return;
    }

    // Hapus dari session db
    await deleteTelegramSession(telegramId);

    // Gunakan tanggal yang benar (date untuk NLP, today untuk wizard)
    const dateDisplay =
      data.date || data.today || new Date().toISOString().split("T")[0];

    // Update pesan agar tidak bisa diklik lagi (ganti dengan status sukses)
    await ctx.answerCbQuery("✅ Berhasil disimpan!");
    await ctx.editMessageText(
      `✅ *${data.wizardType === "expense" ? "Pengeluaran" : "Pemasukan"} Tercatat!*\n\n` +
        `💵 Jumlah: *${formatRupiah(data.amount)}*\n` +
        `📂 Kategori: ${data.categoryName}\n` +
        `🏦 Akun: ${account?.name || "Unknown"}\n` +
        `📝 Catatan: ${data.description || "-"}\n` +
        `📅 Tanggal: ${dateDisplay}`,
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
    `� *Daftar Kategori*\n\n` +
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

// /cancel
export async function handleCancel(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const session = await getTelegramSession(telegramId);

  if (!session) {
    await ctx.reply("✅ Tidak ada wizard aktif.");
    return;
  }

  if (session.type !== "wizard") {
    await ctx.reply(
      "❌ Tidak ada wizard aktif. Gunakan /cancel hanya saat sedang mengisi form.",
    );
    return;
  }

  console.log(
    `🚫 Canceling wizard for user ${telegramId}, step: ${session.step}`,
  );

  await deleteTelegramSession(telegramId);

  const wizardType =
    session.wizardType === "expense" ? "Pengeluaran" : "Pemasukan";

  await ctx.reply(
    `✅ *${wizardType} Dibatalkan*\n\n` +
      `Wizard telah dihentikan. Anda dapat mulai wizard baru dengan ketik:\n` +
      `• \`/expense\` untuk catat pengeluaran\n` +
      `• \`/income\` untuk catat pemasukan`,
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
      `� Pemasukan: *${formatRupiah(income)}*\n` +
      `� Pengeluaran: *${formatRupiah(expense)}*\n` +
      `� Selisih: *${formatRupiah(income - expense)}*\n` +
      `─────────────────\n` +
      `🏆 Top Pengeluaran:\n${topSpending || "Belum ada data"}`,
    { parse_mode: "Markdown" },
  );
}

// Helper: Handle natural language transaction
async function handleNaturalLanguageTransaction(
  ctx: Context,
  profile: any,
  text: string,
) {
  const parsed = parseTransaction(text, profile.categories, profile.accounts);

  console.log(`🔍 Parsed transaction:`, JSON.stringify(parsed, null, 2));

  // Validasi amount
  if (parsed.amount === 0) {
    await ctx.reply(
      "❌ Saya tidak menemukan jumlah dalam pesan Anda.\n\n" +
        "Contoh format:\n" +
        '• "Makan 25k"\n' +
        '• "Belanja 85rb pakai GoPay"',
    );
    return;
  }

  // Validasi confidence
  if (parsed.confidence === "low") {
    await ctx.reply(
      "⚠️ Saya tidak yakin dengan input Anda.\n\n" +
        "Silakan gunakan command /expense atau /income untuk input yang lebih jelas.",
    );
    return;
  }

  // Tampilkan konfirmasi parsing
  const emoji = parsed.type === "expense" ? "💸" : "💰";
  const label = parsed.type === "expense" ? "Pengeluaran" : "Pemasukan";
  const categoryDisplay = parsed.category.name
    ? (profile.categories.find((c: any) => c.id === parsed.category.id)?.icon ||
        "📦") +
      " " +
      parsed.category.name
    : "Tanpa Kategori";
  const merchantDisplay = parsed.merchant ? `🏪 ${parsed.merchant}` : "";
  const descDisplay = parsed.description
    ? `📝 ${parsed.description}`
    : merchantDisplay || "Tanpa Catatan";

  const requestId = Math.random().toString(36).slice(2, 10);

  // Jika akun sudah terdeteksi, simpan langsung
  if (parsed.account.id) {
    console.log(
      `✅ Account detected: ${parsed.account.id} - ${parsed.account.name}`,
    );

    // Simpan ke pending session
    await setTelegramSession(profile.telegram_id, {
      type: "pending",
      userId: profile.user_id,
      wizardType: parsed.type,
      amount: parsed.amount,
      categoryId: parsed.category.id || null,
      categoryName: categoryDisplay,
      description: parsed.description || parsed.merchant || null,
      date: parsed.date,
      requestId,
    });

    // Tampilkan tombol konfirmasi langsung
    await ctx.reply(
      `${emoji} *Konfirmasi ${label}*\n\n` +
        `💵 Jumlah: *${formatRupiah(parsed.amount)}*\n` +
        `📂 Kategori: ${categoryDisplay}\n` +
        `🏦 Akun: ${parsed.account.name}\n` +
        `📝 Catatan: ${descDisplay}\n` +
        `📅 Tanggal: ${parsed.date}\n\n` +
        `Apakah sudah benar?`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "✅ Simpan",
              `a:${requestId}:${parsed.account.id}`,
            ),
            Markup.button.callback("❌ Batal", `cancel:${requestId}`),
          ],
        ]),
      },
    );
  }
  // Jika akun belum terdeteksi, tampilkan pilihan akun
  else {
    console.log(`⚠️ No account detected, showing account selection`);

    const accounts = profile.accounts as any[];
    if (accounts.length === 0) {
      await ctx.reply("❌ Kamu belum punya akun. Tambahkan dulu di aplikasi.");
      return;
    }

    // Simpan ke pending session
    await setTelegramSession(profile.telegram_id, {
      type: "pending",
      userId: profile.user_id,
      wizardType: parsed.type,
      amount: parsed.amount,
      categoryId: parsed.category.id || null,
      categoryName: categoryDisplay,
      description: parsed.description || parsed.merchant || null,
      date: parsed.date,
      requestId,
    });

    const buttons = accounts.map((acc: any) =>
      Markup.button.callback(acc.name, `a:${requestId}:${acc.id}`),
    );

    // Tambah tombol cancel
    buttons.push(Markup.button.callback("❌ Batal", `cancel:${requestId}`));

    await ctx.reply(
      `${emoji} *Konfirmasi ${label}*\n\n` +
        `💵 Jumlah: *${formatRupiah(parsed.amount)}*\n` +
        `📂 Kategori: ${categoryDisplay}\n` +
        `📝 Catatan: ${descDisplay}\n` +
        `📅 Tanggal: ${parsed.date}\n\n` +
        `Pilih akun untuk menyimpan:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons, { columns: 2 }),
      },
    );
  }
}

// Helper: Handle natural language transfer
async function handleNaturalLanguageTransfer(
  ctx: Context,
  profile: any,
  text: string,
) {
  const parsed = parseTransfer(text, profile.accounts);

  console.log(`🔍 Parsed transfer:`, JSON.stringify(parsed, null, 2));

  // Validasi amount
  if (parsed.amount === 0) {
    await ctx.reply(
      "❌ Saya tidak menemukan jumlah dalam pesan Anda.\n\n" +
        "Contoh format:\n" +
        '• "Transfer 50k BCA GoPay"\n' +
        '• "Pindah 100rb dari BCA ke GoPay"',
    );
    return;
  }

  // Validasi confidence
  if (parsed.confidence === "low") {
    await ctx.reply(
      "⚠️ Saya tidak yakin dengan input Anda.\n\n" +
        "Silakan gunakan command /transfer untuk input yang lebih jelas.",
    );
    return;
  }

  await showTransferConfirmation(
    ctx,
    profile,
    parsed.amount,
    parsed.srcAccount,
    parsed.dstAccount,
    parsed.description,
  );
}

// Helper: Handle natural language query
async function handleNaturalLanguageQuery(
  ctx: Context,
  profile: any,
  text: string,
) {
  const parsed = parseQuery(text);

  switch (parsed.queryType) {
    case "balance":
      await handleBalance(ctx);
      break;

    case "expense_summary":
      await handleExpenseSummary(ctx, profile, parsed);
      break;

    case "income_summary":
      await handleIncomeSummary(ctx, profile, parsed);
      break;

    case "recent":
      await handleRecentTransactions(ctx, profile, parsed);
      break;

    case "category_breakdown":
      await handleCategoryBreakdown(ctx, profile, parsed);
      break;

    default:
      await ctx.reply(
        "🤔 Maaf, saya belum mengerti query tersebut.\n\n" +
          "Coba query seperti:\n" +
          '• "Saldo berapa?"\n' +
          '• "Pengeluaran minggu ini"\n' +
          '• "Pemasukan bulan ini"',
      );
  }
}

// Helper: Handle expense summary
async function handleExpenseSummary(
  ctx: Context,
  profile: any,
  parsed: ParsedQuery,
) {
  const { start, end } = getDateRange(parsed.period);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", profile.user_id)
    .eq("type", "expense")
    .gte("date", start)
    .lte("date", end);

  const total = transactions
    ? transactions.reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  await ctx.reply(
    `💸 *Pengeluaran ${getPeriodLabel(parsed.period)}*\n\n` +
      `Total: *${formatRupiah(total)}*`,
    { parse_mode: "Markdown" },
  );
}

// Helper: Handle income summary
async function handleIncomeSummary(
  ctx: Context,
  profile: any,
  parsed: ParsedQuery,
) {
  const { start, end } = getDateRange(parsed.period);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", profile.user_id)
    .eq("type", "income")
    .gte("date", start)
    .lte("date", end);

  const total = transactions
    ? transactions.reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  await ctx.reply(
    `💰 *Pemasukan ${getPeriodLabel(parsed.period)}*\n\n` +
      `Total: *${formatRupiah(total)}*`,
    { parse_mode: "Markdown" },
  );
}

// Helper: Handle recent transactions
async function handleRecentTransactions(
  ctx: Context,
  profile: any,
  parsed: ParsedQuery,
) {
  const { start, end } = getDateRange(parsed.period);

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "type, amount, date, description, categories(name, icon), accounts(name)",
    )
    .eq("user_id", profile.user_id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .limit(10);

  if (!transactions || transactions.length === 0) {
    await ctx.reply(
      `📋 *Transaksi Terakhir (${getPeriodLabel(parsed.period)})*\n\nBelum ada transaksi.`,
      {
        parse_mode: "Markdown",
      },
    );
    return;
  }

  const typeEmoji: Record<string, string> = { expense: "💸", income: "💰" };
  const lines = transactions
    .map(
      (t: any) =>
        `${typeEmoji[t.type] || ""} *${formatRupiah(t.amount)}* - ${t.categories?.icon || ""} ${t.categories?.name || "?"}\n` +
        `   ${t.description || "-"} (${t.date})`,
    )
    .join("\n\n");

  await ctx.reply(
    `📋 *Transaksi Terakhir (${getPeriodLabel(parsed.period)})*\n\n${lines}`,
    { parse_mode: "Markdown" },
  );
}

// Helper: Handle category breakdown
async function handleCategoryBreakdown(
  ctx: Context,
  profile: any,
  parsed: ParsedQuery,
) {
  const { start, end } = getDateRange(parsed.period);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, categories(name, icon)")
    .eq("user_id", profile.user_id)
    .eq("type", "expense")
    .gte("date", start)
    .lte("date", end);

  if (!transactions || transactions.length === 0) {
    await ctx.reply(
      `📊 *Rincian Pengeluaran ${parsed.category}*\n\nBelum ada transaksi.`,
      {
        parse_mode: "Markdown",
      },
    );
    return;
  }

  // Group by category
  const catMap: Record<string, { name: string; icon: string; total: number }> =
    {};
  transactions.forEach((t: any) => {
    const name = t.categories?.name || "Lainnya";
    const icon = t.categories?.icon || "📦";
    if (!catMap[name]) catMap[name] = { name, icon, total: 0 };
    catMap[name].total += Number(t.amount);
  });

  const lines = Object.values(catMap)
    .sort((a, b) => b.total - a.total)
    .map((c) => `${c.icon} ${c.name}: *${formatRupiah(c.total)}*`)
    .join("\n");

  await ctx.reply(
    `📊 *Rincian Pengeluaran ${getPeriodLabel(parsed.period)}*\n\n${lines}`,
    { parse_mode: "Markdown" },
  );
}
