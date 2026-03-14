-- Migration: Tambah kolom untuk Telegram Bot integration
-- Jalankan di Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS link_token_expires_at TIMESTAMPTZ;
