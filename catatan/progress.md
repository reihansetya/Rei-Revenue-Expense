# 📋 Progress Pengembangan: Expense Tracker

> Terakhir diperbarui: 13 Maret 2026
> Status: **Phase 1 MVP ✅ Selesai**

---

## 🗂️ Struktur Direktori Proyek

```
expense-tracker/
├── catatan/                    # Dokumentasi & catatan proyek
│   ├── schema.sql              # SQL schema Supabase (tables, RLS, triggers)
│   ├── expense-tracker-spec.md # Spesifikasi awal proyek
│   └── progress.md             # File ini
├── src/
│   ├── app/
│   │   ├── (auth)/             # Route group autentikasi
│   │   │   ├── layout.tsx      # Layout centered untuk auth pages
│   │   │   ├── actions.ts      # Server Actions: login, signup, logout
│   │   │   ├── login/page.tsx  # Halaman Login
│   │   │   └── register/page.tsx # Halaman Register
│   │   ├── (dashboard)/        # Route group dashboard (protected)
│   │   │   ├── layout.tsx      # Layout dengan Sidebar + Header
│   │   │   ├── page.tsx        # Dashboard utama (data real-time)
│   │   │   ├── accounts/       # Fitur manajemen akun
│   │   │   │   ├── page.tsx
│   │   │   │   ├── actions.ts
│   │   │   │   ├── accounts-list.tsx
│   │   │   │   └── account-form-dialog.tsx
│   │   │   ├── categories/     # Fitur manajemen kategori
│   │   │   │   ├── page.tsx
│   │   │   │   ├── actions.ts
│   │   │   │   ├── categories-list.tsx
│   │   │   │   └── category-form-dialog.tsx
│   │   │   ├── transactions/   # Fitur pencatatan transaksi
│   │   │   │   ├── page.tsx
│   │   │   │   ├── actions.ts
│   │   │   │   ├── transactions-list.tsx
│   │   │   │   └── transaction-form-dialog.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx    # Halaman settings
│   │   ├── globals.css         # Global styling + Tailwind v4 config
│   │   └── layout.tsx          # Root layout (font Inter, ThemeProvider)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx     # Sidebar navigasi desktop
│   │   │   ├── header.tsx      # Header (ModeToggle + User Dropdown)
│   │   │   └── mobile-nav.tsx  # Hamburger menu untuk mobile
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── theme-provider.tsx  # next-themes ThemeProvider
│   │   └── mode-toggle.tsx     # Tombol toggle Light/Dark/System
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase browser client
│   │       └── server.ts       # Supabase server client (dengan cookies)
│   ├── middleware.ts            # Route protection middleware
│   └── types/
│       └── index.ts            # TypeScript interfaces (Account, Category, Transaction, Profile)
└── package.json
```

---

## 🛠️ Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| Next.js | 16.x | App Router, Server Actions, Server Components |
| React | 19.x | Client Components, hooks |
| Supabase | latest | Auth, PostgreSQL, RLS |
| shadcn/ui | latest | UI components berbasis Base UI |
| Tailwind CSS | v4 | Styling utility-first |
| TypeScript | 5.x | Type safety |
| next-themes | latest | Dark/light mode management |
| date-fns | latest | Format tanggal Bahasa Indonesia |
| Lucide React | latest | Icon library |

---

## ✅ Fitur yang Sudah Diimplementasikan

### 1. 🔐 Autentikasi

**File terkait:** `src/app/(auth)/`

- Login menggunakan email + password via Supabase Auth (`signInWithPassword`)
- Register akun baru (`signUp`)
- Logout via Server Action (`signOut`)
- Session dikelola otomatis menggunakan Supabase SSR (`@supabase/ssr`) dengan cookie handling

**Cara kerja Middleware (`src/middleware.ts`):**
- Setiap request masuk dicek session-nya via `supabase.auth.getUser()`
- Jika **tidak login** dan mengakses halaman selain `/login` atau `/register` → redirect ke `/login`
- Jika **sudah login** dan mengakses `/login` atau `/register` → redirect ke `/` (dashboard)
- Konfigurasi `matcher` memastikan middleware hanya berjalan di path yang relevan (bukan `_next`, `favicon`, dll.)

---

### 2. 🏠 Dashboard (Data Real-Time)

**File:** `src/app/(dashboard)/page.tsx` (Server Component)

Data yang diambil langsung dari Supabase saat render:
- **Total Balance**: Jumlah semua saldo dari tabel `accounts` milik user
- **Pemasukan Bulan Ini**: Sum `amount` dari `transactions` bertipe `income` di bulan berjalan
- **Pengeluaran Bulan Ini**: Sum `amount` dari `transactions` bertipe `expense` di bulan berjalan
- **Spending per Kategori**: Group transaksi expense bulan ini berdasarkan `category_id`, ditampilkan sebagai progress bar
- **5 Transaksi Terbaru**: Query dengan join ke `accounts` dan `categories` (name, icon, color), diurutkan berdasarkan tanggal terbaru

**Format:**
- Mata uang: `Intl.NumberFormat` dengan locale `id-ID` dan currency `IDR`
- Tanggal: `date-fns` dengan locale `id` (Bahasa Indonesia)

---

### 3. 💰 Manajemen Akun (Accounts CRUD)

**File:** `src/app/(dashboard)/accounts/`

**Schema tabel `accounts`:**
```sql
id, user_id, name, type (bank|ewallet|cash|investment), balance, icon, color, created_at
```

**Server Actions (`actions.ts`):**
| Fungsi | Deskripsi |
|---|---|
| `getAccounts()` | Fetch semua akun milik user yang login |
| `createAccount(formData)` | Insert akun baru dengan saldo awal |
| `updateAccount(id, formData)` | Update nama, tipe, warna (saldo tidak bisa diubah manual) |
| `deleteAccount(id)` | Hapus akun (dengan pengecekan `user_id` untuk keamanan) |

Semua actions memanggil `revalidatePath("/accounts")` dan `revalidatePath("/")` setelah mutasi agar data di-refresh.

**UI:**
- Grid card responsif (1 kolom mobile, 2 kolom tablet, 3 kolom desktop)
- Color accent bar di atas setiap card
- Icon berdasarkan tipe akun (Bank, E-Wallet, Cash, Investment)
- Dialog form modal custom (tanpa library tambahan) dengan color picker

---

### 4. 🏷️ Manajemen Kategori (Categories CRUD)

**File:** `src/app/(dashboard)/categories/`

**Schema tabel `categories`:**
```sql
id, user_id, name, type (income|expense), icon (emoji), color, created_at
```

**Server Actions (`actions.ts`):**
| Fungsi | Deskripsi |
|---|---|
| `getCategories()` | Fetch semua kategori, diurutkan by type kemudian name |
| `createCategory(formData)` | Insert kategori baru |
| `updateCategory(id, formData)` | Update data kategori |
| `deleteCategory(id)` | Hapus kategori |

**UI:**
- Tampilan dikelompokkan 2 kolom: **Pemasukan** vs **Pengeluaran**
- Form dialog dengan emoji icon picker (18 pilihan icon)
- Color picker (9 pilihan warna)

---

### 5. 💳 Manajemen Transaksi (Transactions CRUD)

**File:** `src/app/(dashboard)/transactions/`

**Schema tabel `transactions`:**
```sql
id, user_id, type (income|expense), amount, description, date, account_id, category_id, source (web|telegram), created_at
```

**Server Actions (`actions.ts`):**
| Fungsi | Deskripsi |
|---|---|
| `getTransactions(filters?)` | Fetch transaksi dengan filter opsional: type, search, startDate, endDate |
| `createTransaction(formData)` | Insert transaksi baru, validasi amount > 0 |
| `deleteTransaction(id)` | Hapus transaksi + reverse balance akun terkait |

**UI:**
- Toggle filter tipe: Semua / Pemasukan / Pengeluaran
- Search bar untuk mencari berdasarkan deskripsi
- Card list dengan icon kategori, nama kategori, catatan, nama akun, tanggal
- Warna amount: hijau untuk income, merah untuk expense
- Form dialog dengan:
  - Toggle button Income/Expense (mengubah warna dan memfilter dropdown kategori)
  - Dropdown kategori (terfilter berdasarkan tipe yang dipilih)
  - Dropdown akun
  - Input tanggal (default: hari ini)
  - Input deskripsi/catatan (opsional)

---

### 6. ⚙️ Settings

**File:** `src/app/(dashboard)/settings/page.tsx`

- Menampilkan informasi profil user (email, sebagian User ID)
- Kontrol tema (Light/Dark/System) via `ModeToggle`
- Placeholder untuk integrasi Telegram Bot (Phase 2)

---

### 7. 🎨 UI/UX & Styling

**Font:**
- Sebelumnya: Geist (default Next.js)
- Sekarang: **Inter** dari Google Fonts → lebih casual, clean, dan modern

**Dark Mode:**
- Provider: `next-themes` di root layout
- `suppressHydrationWarning` pada `<html>` untuk menghindari hydration mismatch
- CSS variable `oklch` untuk warna yang adaptif light/dark

**Komponen Layout:**
- `Sidebar`: fixed di kiri, hanya terlihat di `lg` ke atas
- `Header`: sticky top, berisi `ModeToggle` dan dropdown user
- `MobileNav`: Sheet dari kiri, aktif di layar `< lg`

**Fix Bug Hydration (`<button>` nesting):**
- shadcn/ui versi terbaru menggunakan `@base-ui/react` bukan Radix
- `DropdownMenuTrigger` dari Base UI sudah merender `<button>` sendiri
- Solusi: styling langsung pada `DropdownMenuTrigger` tanpa membungkusnya dengan `<Button>` atau menggunakan `asChild`

---

## 🗄️ Database (Supabase)

**File SQL:** `catatan/schema.sql`

### Tabel yang dibuat:
| Tabel | Keterangan |
|---|---|
| `profiles` | Data profil user (auto-created via trigger saat signup) |
| `accounts` | Akun keuangan user |
| `categories` | Kategori transaksi |
| `transactions` | Record setiap transaksi |
| `transfers` | Transfer antar akun (Phase 2) |

### Keamanan (RLS):
Setiap tabel memiliki kebijakan RLS:
```sql
-- Contoh untuk tabel accounts
CREATE POLICY "Users can only see their own accounts"
  ON accounts FOR SELECT USING (auth.uid() = user_id);
```

### Trigger otomatis:
1. **`on_auth_user_created`**: Otomatis membuat row di `profiles` saat user baru register
2. **`update_account_balance`**: Otomatis update saldo akun saat ada transaksi baru masuk

---

## 🐛 Bug yang Diperbaiki

| Bug | Penyebab | Solusi |
|---|---|---|
| Middleware error "missing expected function export" | Fungsi middleware dinamai `updateSession`, bukan `middleware` | Rename ke `middleware` dan tambahkan `export { config }` |
| Halaman default Next.js tampil setelah login | `src/app/page.tsx` mengoverride `(dashboard)/page.tsx` | Hapus `src/app/page.tsx` |
| Hydration error: `<button>` di dalam `<button>` | `asChild` tidak didukung Base UI; `DropdownMenuTrigger` sudah merender `<button>`, tapi kita masih membungkusnya lagi dengan `<Button>` | Hapus `asChild` dan wrapper `<Button>`, styling langsung di `DropdownMenuTrigger` |
| `npm run dev` crash (memory allocation 17GB) | Cache `.next` corrupt akibat Turbopack | Hapus folder `.next` dan jalankan ulang |

---

## ⏭️ Rencana Pengembangan Selanjutnya (Phase 2)

- [ ] **Grafik interaktif** (pie chart/bar chart spending per kategori) menggunakan Recharts atau Chart.js
- [ ] **Transfer Antar Akun** – Fitur pindah saldo dengan mencatat dari akun mana ke akun mana
- [ ] **Budget Management** – Set batas pengeluaran per kategori per bulan
- [ ] **Integrasi Telegram Bot** – Input transaksi cepat via chat bot
- [ ] **Export Laporan** – Download rekap keuangan dalam format Excel/PDF
- [ ] **Filter Tanggal di Dashboard** – Bisa pilih bulan/tahun untuk melihat ringkasan historis
