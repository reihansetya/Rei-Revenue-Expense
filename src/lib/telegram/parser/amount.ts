/**
 * AMOUNT PARSER
 * Extract nominal uang dari berbagai format text
 */

/**
 * Parse amount dari string (standalone)
 * Examples: "50rb" → 50000, "5jt" → 5000000, "50k" → 50000
 */
export function parseAmount(word: string): number | null {
  const cleaned = word.toLowerCase().trim();

  // Pattern: N + jt/juta/j
  const juta = cleaned.match(/^([\d.,]+)\s*j(t|uta)?$/);
  if (juta) {
    return parseFloat(juta[1].replace(/\./g, "").replace(",", ".")) * 1_000_000;
  }

  // Pattern: N + rb/ribu/r
  const ribu = cleaned.match(/^([\d.,]+)\s*r(b|ibu)?$/);
  if (ribu) {
    return parseFloat(ribu[1].replace(/\./g, "").replace(",", ".")) * 1_000;
  }

  // Pattern: N + k
  const k = cleaned.match(/^([\d.,]+)\s*k$/);
  if (k) {
    return parseFloat(k[1].replace(/\./g, "").replace(",", ".")) * 1_000;
  }

  // Pattern: Plain number with optional separators
  if (/^[\d.,]+$/.test(cleaned)) {
    const plain = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    if (!isNaN(plain) && plain > 0) return plain;
  }

  return null;
}

/**
 * Extract amount dari pesan lengkap
 * Examples: "Makan 25k di warteg" → 25000, "Belanja 2.5jt" → 2500000
 */
export function extractAmount(message: string): number | null {
  const lower = message.toLowerCase();

  // Pattern 1: Embedded amount with suffix (jt/juta/ribu/rb/k)
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:jt|juta|j)\b/gi,
    /(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|r|k)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...message.matchAll(pattern)];
    if (matches.length > 0) {
      // Ambil match terbesar jika ada multiple
      const amounts = matches.map((m) => {
        const num = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
        const suffix = m[0].toLowerCase();

        if (
          suffix.includes("jt") ||
          suffix.includes("juta") ||
          suffix.includes(" j")
        ) {
          return num * 1_000_000;
        }
        return num * 1_000;
      });
      return Math.max(...amounts);
    }
  }

  // Pattern 2: Plain number (check if it's likely an amount)
  const plainNumbers = [...message.matchAll(/\b\d{4,}(?:[.,]\d+)?\b/g)];
  if (plainNumbers.length > 0) {
    // Filter: hanya angka yang "terlihat" seperti nominal (4+ digit)
    const amounts = plainNumbers
      .map((m) => parseFloat(m[0].replace(/\./g, "").replace(",", ".")))
      .filter((n) => !isNaN(n) && n >= 1000); // Minimal 1000 (masuk akal sebagai nominal)

    if (amounts.length > 0) {
      return Math.max(...amounts);
    }
  }

  return null;
}

/**
 * Cek apakah pesan mengandung amount
 */
export function hasAmount(message: string): boolean {
  return extractAmount(message) !== null;
}

/**
 * Format amount ke Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
