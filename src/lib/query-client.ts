import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data dianggap fresh selama 1 menit secara default
        staleTime: 60 * 1000,
        // Cache dibersihkan setelah 10 menit tidak digunakan
        gcTime: 10 * 60 * 1000,
        // Tidak refetch saat window focus untuk UX yang lebih baik
        refetchOnWindowFocus: false,
        // Retry sekali jika gagal
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: selalu buat instance baru
    return makeQueryClient();
  } else {
    // Browser: gunakan instance yang sama (singleton)
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
