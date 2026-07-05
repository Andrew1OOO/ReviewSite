import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | null
  const next = searchParams.get('next') ?? '/'

  const cookieStore = await cookies()
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(incoming) {
          // Collect cookies so we can apply them to the redirect response
          incoming.forEach((c) => cookiesToSet.push(c))
        },
      },
    }
  )

  function redirectWithCookies(url: string) {
    const response = NextResponse.redirect(url)
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    )
    return response
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return redirectWithCookies(`${origin}${next}`)
    }
    console.log('[auth/callback] verifyOtp error:', error)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectWithCookies(`${origin}${next}`)
    }
    console.log('[auth/callback] exchangeCode error:', error)
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`)
}
