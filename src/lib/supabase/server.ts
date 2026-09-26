import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Verifies the JWT locally against the project's ES256 JWKS (cached per instance)
// instead of a network round trip to Supabase Auth like auth.getUser().
// ponytail: does not detect sessions revoked server-side until the JWT expires (default 1h).
export async function getAuthUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return null
  return { id: data.claims.sub, email: data.claims.email }
}
