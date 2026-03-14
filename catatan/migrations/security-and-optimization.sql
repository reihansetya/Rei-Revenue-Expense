-- Migration: Database Optimization & Security Indexes
-- Jalankan di Supabase SQL Editor

-- Index untuk filter Telegram ID agar pencarian user instan
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);

-- Index untuk filter User ID di tabel transaksi (sangat penting untuk scaling)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Index untuk rentang tanggal (digunakan di /summary)
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Index untuk lookup accounts & categories
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Tambahan: Pastikan RLS aktif (sudah ada di schema.sql tapi untuk jaga-jaga)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
