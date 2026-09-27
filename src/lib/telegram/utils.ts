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
