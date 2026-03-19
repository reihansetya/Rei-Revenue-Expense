import { Telegraf } from "telegraf";
import {
  handleStart,
  handleHelp,
  handleLink,
  handleExpense,
  handleIncome,
  handleTransfer,
  handleBalance,
  handleSummary,
  handleCategories,
  handleCancel,
  handleCallback,
  handleTextMessage,
} from "./commands";
import { Context } from "telegraf";
import rateLimit from "telegraf-ratelimit";

// Konfigurasi rate limit: 1 pesan per 2 detik
const limitConfig = {
  window: 2000,
  limit: 1,
  onLimitExceeded: (ctx: Context) =>
    ctx.reply("⚠️ Terlalu cepat! Mohon tunggu sebentar."),
};

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Pasang Rate Limiting di urutan pertama
bot.use(rateLimit(limitConfig));

bot.start(handleStart);
bot.help(handleHelp);
bot.command("link", handleLink);
bot.command("expense", handleExpense);
bot.command("income", handleIncome);
bot.command("transfer", handleTransfer);
bot.command("balance", handleBalance);
bot.command("summary", handleSummary);
bot.command("categories", handleCategories);
bot.command("cancel", handleCancel);

bot.on("callback_query", handleCallback);
bot.on("text", handleTextMessage);

export async function setupBotCommands() {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Mulai bot & panduan" },
    {
      command: "expense",
      description: "Catat pengeluaran (format: /expense 50rb makan)",
    },
    {
      command: "income",
      description: "Catat pemasukan (format: /income 5jt gaji)",
    },
    {
      command: "transfer",
      description: "Transfer antar akun (format: /transfer 50k BCA GoPay)",
    },
    { command: "balance", description: "Cek saldo semua dompet" },
    { command: "categories", description: "Lihat daftar kategori tersedia" },
    { command: "summary", description: "Ringkasan transaksi bulan ini" },
    { command: "cancel", description: "Batalkan wizard aktif" },
    { command: "link", description: "Hubungkan akun Telegram" },
    { command: "help", description: "Bantuan penggunaan" },
  ]);
}

bot.catch((err) => {
  console.error("Bot error:", err);
});
