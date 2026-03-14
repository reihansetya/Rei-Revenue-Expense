import { bot } from "../src/lib/telegram/bot";

console.log("🤖 Telegram bot starting (polling mode)...");

bot.launch({ dropPendingUpdates: true });

console.log("✅ Bot is running!");

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
