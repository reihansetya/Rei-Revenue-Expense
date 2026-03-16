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

  // Hanya parse jika murni angka (opsional dengan titik/koma)
  if (/^[\d.,]+$/.test(cleaned)) {
    const plain = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    if (!isNaN(plain)) return plain;
  }

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
