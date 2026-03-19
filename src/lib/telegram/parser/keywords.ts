/**
 * KEYWORD MAPPINGS
 * Define keyword mappings untuk klasifikasi
 */

/**
 * Expense Keywords (untuk detect type)
 */
export const EXPENSE_KEYWORDS = [
  // Action verbs
  "beli",
  "bayar",
  "pesan",
  "order",
  "checkout",
  "isi",
  "topup",
  "withdraw",
  "tarik",
  "ambil",

  // Categories
  "makan",
  "minum",
  "kopi",
  "snack",
  "lunch",
  "dinner",
  "breakfast",
  "bensin",
  "parkir",
  "tol",
  "ojek",
  "taxi",
  "transport",
  "belanja",
  "grocery",
  "market",
  "listrik",
  "air",
  "pdam",
  "pln",
  "bpjs",
  "asuransi",
  "nonton",
  "bioskop",
  "game",
  "spotify",
  "netflix",
  "obat",
  "apotek",
  "dokter",
  "rs",

  // Merchants
  "gojek",
  "grab",
  "shopee",
  "tokopedia",
  "lazada",
  "indomaret",
  "alfamart",
  "starbucks",
  "kfc",
  "mcd",
];

/**
 * Income Keywords
 */
export const INCOME_KEYWORDS = [
  "gaji",
  "salary",
  "paycheck",
  "bonus",
  "thr",
  "tunjangan",
  "insentif",
  "freelance",
  "project",
  "client",
  "side job",
  "transfer masuk",
  "duit masuk",
  "uang masuk",
  "terima",
  "dapat",
  "income",
  "dividen",
  "bunga",
  "profit",
  "keuntungan",
  "refund",
  "cashback",
];

/**
 * Query Keywords
 */
export const QUERY_KEYWORDS = [
  "pengeluaran",
  "pemasukan",
  "saldo",
  "balance",
  "berapa",
  "total",
  "riwayat",
  "history",
  "transaksi terakhir",
  "recent",
  "ringkasan",
  "summary",
  "laporan",
  "report",
];

/**
 * Category Keyword Mapping
 */
export const CATEGORY_KEYWORDS: Record<
  string,
  {
    keywords: string[];
    type: "expense" | "income";
  }
> = {
  Makan: {
    type: "expense",
    keywords: [
      "makan",
      "minum",
      "kopi",
      "snack",
      "food",
      "lunch",
      "dinner",
      "breakfast",
      "brunch",
      "warteg",
      "restoran",
      "restaurant",
      "cafe",
      "starbucks",
      "kfc",
      "mcd",
      "jco",
      "pizza",
      "burger",
      "nasi",
      "ayam",
      "bakso",
      "sate",
      "indomie",
      "siomay",
    ],
  },
  Transport: {
    type: "expense",
    keywords: [
      "bensin",
      "transport",
      "gojek",
      "grab",
      "ojek",
      "taxi",
      "parkir",
      "tol",
      "mrt",
      "lrt",
      "kereta",
      "bus",
      "angkot",
      "pertamina",
      "shell",
      "petronas",
      "fuel",
    ],
  },
  Belanja: {
    type: "expense",
    keywords: [
      "belanja",
      "shopping",
      "grocery",
      "market",
      "indomaret",
      "alfamart",
      "shopee",
      "tokopedia",
      "lazada",
    ],
  },
  Tagihan: {
    type: "expense",
    keywords: [
      "listrik",
      "pln",
      "air",
      "pdam",
      "bpjs",
      "asuransi",
      "internet",
      "wifi",
      "pulsa",
      "paket data",
    ],
  },
  Hiburan: {
    type: "expense",
    keywords: ["nonton", "bioskop", "movie", "game", "spotify", "netflix"],
  },
  Kesehatan: {
    type: "expense",
    keywords: ["obat", "apotek", "dokter", "rs", "rumah sakit", "vitamin"],
  },
  Gaji: {
    type: "income",
    keywords: ["gaji", "salary", "paycheck", "gajian"],
  },
  Bonus: {
    type: "income",
    keywords: ["bonus", "thr", "tunjangan", "insentif"],
  },
  Freelance: {
    type: "income",
    keywords: ["freelance", "project", "client", "side job"],
  },
};

/**
 * Account Keyword Mapping
 */
export const ACCOUNT_KEYWORDS: Record<string, string[]> = {
  GoPay: ["gopay", "go pay", "gopaylater"],
  OVO: ["ovo", "ovoid"],
  Dana: ["dana", "dana id"],
  ShopeePay: ["shopeepay", "shopee pay", "spay"],
  BCA: ["bca", "bank bca", "klikbca", "flazz"],
  Mandiri: ["mandiri", "bank mandiri", "livin"],
  BNI: ["bni", "bank bni"],
  BRI: ["bri", "bank bri", "brimo"],
  Jago: ["jago", "bank jago"],
  SeaBank: ["seabank", "sea bank"],
  Cash: ["cash", "tunai", "uang tunai", "kontan"],
};

/**
 * Query Type Keywords
 */
export const QUERY_TYPE_KEYWORDS: Record<string, string> = {
  pengeluaran: "expense_summary",
  expense: "expense_summary",
  spending: "expense_summary",
  pemasukan: "income_summary",
  income: "income_summary",
  saldo: "balance",
  balance: "balance",
  duit: "balance",
  uang: "balance",
  riwayat: "recent",
  history: "recent",
  "transaksi terakhir": "recent",
  recent: "recent",
  ringkasan: "general",
  summary: "general",
  laporan: "general",
  report: "general",
};

/**
 * Period Keywords
 */
export const PERIOD_KEYWORDS: Record<string, string> = {
  "hari ini": "today",
  kemarin: "yesterday",
  "minggu ini": "this_week",
  "bulan ini": "this_month",
  "bulan lalu": "last_month",
  semuanya: "all",
};

/**
 * Check apakah string mengandung keyword dari array
 */
export function containsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

/**
 * Find kategori berdasarkan keyword
 */
export function findCategoryByKeyword(text: string): {
  name: string | null;
  type: "expense" | "income" | null;
} {
  const lower = text.toLowerCase();

  for (const [categoryName, data] of Object.entries(CATEGORY_KEYWORDS)) {
    if (data.keywords.some((kw) => lower.includes(kw))) {
      return {
        name: categoryName,
        type: data.type,
      };
    }
  }

  return { name: null, type: null };
}

/**
 * Find account berdasarkan keyword
 */
export function findAccountByKeyword(text: string): string | null {
  const lower = text.toLowerCase();

  for (const [accountName, keywords] of Object.entries(ACCOUNT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return accountName;
    }
  }

  return null;
}
