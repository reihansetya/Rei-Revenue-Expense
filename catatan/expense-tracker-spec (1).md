# 📋 Expense Tracker App - Project Specification

## 🎯 Project Overview

Aplikasi tracking pengeluaran dan pendapatan personal dengan integrasi Telegram bot untuk input cepat. Mobile-first design dengan fitur lengkap untuk mengelola keuangan sehari-hari.

---

## 🛠️ Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | Next.js 16 (App Router) | React 19 |
| UI Library | shadcn/ui | Radix + Tailwind |
| Database | Supabase | PostgreSQL + Auth |
| Hosting | Vercel | 0 cost deployment |
| Server State | TanStack Query | Caching, fetching |
| UI State | React useState/Context | Simple state |
| Charts | Recharts | Visualization |
| Bot | Telegram Bot API | Command-based input |

---

## 🗄️ Database Schema

### Users (Supabase Auth)
```sql
-- Managed by Supabase
-- id UUID PRIMARY KEY
-- email TEXT UNIQUE
-- encrypted_password TEXT
-- created_at TIMESTAMP
```

### Profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  telegram_id BIGINT UNIQUE,
  default_currency TEXT DEFAULT 'IDR',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Accounts
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash', 'investment')),
  balance DECIMAL(15,2) DEFAULT 0,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'tag',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'telegram')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Transfers (Transfer antar akun)
```sql
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Budgets (Phase 2)
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  period TEXT DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 UI/UX Design

### Color Palette (Blue Theme)

```
Primary Blue:
- 50:  #EFF6FF
- 100: #DBEAFE
- 200: #BFDBFE
- 300: #93C5FD
- 400: #60A5FA
- 500: #3B82F6  ← Main
- 600: #2563EB
- 700: #1D4ED8
- 800: #1E40AF
- 900: #1E3A8A

Semantic Colors:
- Income:  #10B981 (Green)
- Expense: #EF4444 (Red)
- Transfer: #8B5CF6 (Purple)
```

### Mobile-First Layout

```
┌─────────────────────────────┐
│  HEADER                      │
│  ☰ Menu    💰 Expensify      │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ TOTAL SALDO           │  │
│  │ Rp 2.500.000          │  │
│  │ ▲ +5jt   ▼ -2.5jt     │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ SPENDING BY CATEGORY  │  │
│  │ [Pie Chart]           │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ RECENT TRANSACTIONS   │  │
│  │ • Makan  -Rp 50.000   │  │
│  │ • Gaji  +Rp 5.000.000 │  │
│  │ • GoPay -Rp 25.000    │  │
│  └───────────────────────┘  │
│                             │
│         ┌─────┐             │
│         │  +  │  ← FAB      │
│         └─────┘             │
│                             │
├─────────────────────────────┤
│  BOTTOM NAVIGATION          │
│  🏠    📊    ➕    🏷️    ⚙️  │
│  Home Chart Add  Cat  Set   │
└─────────────────────────────┘
```

### Pages Structure

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Summary, charts, recent transactions |
| Transactions | `/transactions` | List all transactions, filter, search |
| Charts | `/charts` | Detailed analytics |
| Categories | `/categories` | Manage categories |
| Accounts | `/accounts` | Manage accounts, transfer |
| Settings | `/settings` | Profile, Telegram linking, preferences |

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTH FLOW                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Landing Page                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────┐                            │
│  │  LOGIN PAGE                 │                            │
│  │  Email: [____________]      │                            │
│  │  Password: [____________]   │                            │
│  │                             │                            │
│  │  [Login]  [Register]        │                            │
│  └─────────────────────────────┘                            │
│       │                                                     │
│       ▼ (Success)                                           │
│  Dashboard                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 Telegram Bot Commands

### Available Commands

| Command | Usage | Example |
|---------|-------|---------|
| `/start` | Mulai bot, sapaan | `/start` |
| `/help` | Bantuan penggunaan | `/help` |
| `/expense` | Catat pengeluaran | `/expense 50000 makan` |
| `/income` | Catat pemasukan | `/income 5000000 gaji` |
| `/transfer` | Transfer antar akun | `/transfer 100000 bca gopay` |
| `/balance` | Cek saldo | `/balance` atau `/balance bca` |
| `/summary` | Ringkasan bulan ini | `/summary` |
| `/history` | Transaksi terakhir | `/history` atau `/history 20` |
| `/accounts` | List akun | `/accounts` |
| `/categories` | List kategori | `/categories` |
| `/link` | Link ke web account | `/link` |

### Command Format Details

```
/expense <amount> <category> [note]
├── amount: angka (50000 atau 50rb)
├── category: nama kategori (makan, transport, dll)
└── note: catatan opsional

/income <amount> <category> [note]
├── amount: angka (5000000 atau 5jt)
├── category: nama kategori (gaji, freelance, dll)
└── note: catatan opsional

/transfer <amount> <from> <to> [note]
├── amount: angka
├── from: nama akun asal
├── to: nama akun tujuan
└── note: catatan opsional
```

### Example Interactions

```
User: /expense 50000 makan
Bot: ✅ Tercatat!
     💸 Pengeluaran: Rp 50.000
     📂 Kategori: Makan
     🏦 Akun: Cash
     📝 Catatan: -

User: /income 5000000 gaji bulan januari
Bot: ✅ Tercatat!
     💰 Pemasukan: Rp 5.000.000
     📂 Kategori: Gaji
     🏦 Akun: BCA
     📝 Catatan: bulan januari

User: /balance
Bot: 💰 Saldo Akun:
     🏦 BCA: Rp 5.000.000
     💵 Cash: Rp 500.000
     📱 GoPay: Rp 250.000
     ─────────────────
     📊 Total: Rp 5.750.000

User: /summary
Bot: 📊 Ringkasan Januari 2024
     ─────────────────
     💰 Pemasukan: Rp 5.000.000
     💸 Pengeluaran: Rp 2.500.000
     💵 Saldo: Rp 2.500.000
     ─────────────────
     Top Spending:
     🍔 Makan: Rp 1.000.000
     🚗 Transport: Rp 800.000
```

---

## 🔗 Telegram Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│              TELEGRAM LOGIN WIDGET                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Settings Page                                      │
│  ┌───────────────────────────────┐                          │
│  │  Integrations                 │                          │
│  │  Telegram: [Connect Telegram] │                          │
│  └───────────────────────────────┘                          │
│                                                             │
│  Step 2: Telegram Popup                                     │
│  ┌───────────────────────────────┐                          │
│  │  [Telegram Logo]              │                          │
│  │  Log in to Expensify?         │                          │
│  │                               │                          │
│  │  [Confirm on Telegram]        │                          │
│  └───────────────────────────────┘                          │
│                                                             │
│  Step 3: Connected                                          │
│  ┌───────────────────────────────┐                          │
│  │  Telegram: ✅ Connected        │                          │
│  │  @username                    │                          │
│  │  [Disconnect]                 │                          │
│  └───────────────────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📤 Export Feature

### Export Options

```
┌─────────────────────────────┐
│  Export Data                │
├─────────────────────────────┤
│                             │
│  Periode:                   │
│  [▼ Januari 2024      ]     │
│                             │
│  Format:                    │
│  ○ Excel (.xlsx)            │
│  ○ PDF                      │
│                             │
│  Include:                   │
│  ☑️ Semua Transaksi         │
│  ☑️ Ringkasan per Kategori  │
│  ☑️ Grafik                  │
│                             │
│  [Export]                   │
└─────────────────────────────┘
```

### Excel Output Format

| Date | Type | Category | Account | Amount | Description |
|------|------|----------|---------|--------|-------------|
| 2024-01-15 | Expense | Makan | Cash | -50,000 | Makan siang |
| 2024-01-14 | Income | Gaji | BCA | 5,000,000 | Gaji bulanan |

### PDF Output Sections
1. Summary (Total Income, Expense, Balance)
2. Charts (Pie chart by category, Bar chart daily)
3. Transaction Table

---

## 🏷️ Default Categories

### Income Categories

| Name | Icon | Color |
|------|------|-------|
| Gaji | 💰 | #3B82F6 |
| Freelance | 💻 | #60A5FA |
| Investasi | 📈 | #2563EB |
| Bonus | 🎁 | #1D4ED8 |
| Lainnya | 💵 | #93C5FD |

### Expense Categories

| Name | Icon | Color |
|------|------|-------|
| Makan & Minum | 🍔 | #EF4444 |
| Transport | 🚗 | #F97316 |
| Belanja | 🛒 | #EC4899 |
| Entertainment | 🎬 | #8B5CF6 |
| Tagihan | 📱 | #6366F1 |
| Kesehatan | 💊 | #14B8A6 |
| Pendidikan | 📚 | #3B82F6 |
| Investasi | 📊 | #10B981 |
| Lainnya | 📦 | #6B7280 |

---

## 🌓 Theme Support

### Light Mode
```
Background: #FFFFFF
Surface: #F8FAFC
Text Primary: #0F172A
Text Secondary: #64748B
Border: #E2E8F0
```

### Dark Mode
```
Background: #0F172A
Surface: #1E293B
Text Primary: #F8FAFC
Text Secondary: #94A3B8
Border: #334155
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (dashboard)
│   │   ├── transactions/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── categories/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── transactions/route.ts
│   │   ├── accounts/route.ts
│   │   ├── categories/route.ts
│   │   ├── telegram/webhook/route.ts
│   │   └── export/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn)
│   ├── dashboard/
│   │   ├── summary-card.tsx
│   │   ├── spending-chart.tsx
│   │   └── recent-transactions.tsx
│   ├── transactions/
│   │   ├── transaction-form.tsx
│   │   └── transaction-list.tsx
│   ├── accounts/
│   │   ├── account-form.tsx
│   │   └── transfer-form.tsx
│   ├── categories/
│   │   └── category-form.tsx
│   └── layout/
│       ├── mobile-nav.tsx
│       ├── header.tsx
│       └── sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── telegram/
│   │   ├── bot.ts
│   │   └── commands.ts
│   └── utils.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-transactions.ts
│   └── use-accounts.ts
└── types/
    └── index.ts
```

---

## ✅ MVP Features Checklist

### Phase 1 - Core (MVP)
- [ ] Setup project & Supabase
- [ ] Authentication (Email/Password)
- [ ] Dashboard with summary
- [ ] Transaction CRUD
- [ ] Account management
- [ ] Category management
- [ ] Basic charts

### Phase 2 - Integration
- [ ] Telegram bot setup
- [ ] Telegram commands
- [ ] Telegram Login Widget
- [ ] Transfer between accounts

### Phase 3 - Enhancement
- [ ] Export Excel
- [ ] Export PDF with charts
- [ ] Budget management
- [ ] Notifications

---

## 🚀 Getting Started

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
```

### Installation Commands

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Build for production
npm run build
```

---

## 📝 Notes

- Mobile-first design dengan responsive untuk desktop
- Semua data diisolasi per user (RLS di Supabase)
- Telegram bot hanya bisa digunakan setelah akun di-link
- Export bulanan dengan grafik untuk PDF
- Dark mode dengan toggle di settings
