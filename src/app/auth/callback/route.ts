import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    })
    
    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/?error=auth_error`)
      }

      if (session?.user) {
        // Check if user already has a profile
        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (existingProfile && existingProfile.display_name) {
          // User has completed onboarding, redirect to home
          return NextResponse.redirect(`${requestUrl.origin}/home`)
        } else {
          // New user or incomplete profile, redirect to onboarding
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
        }
      }
    } catch (error) {
      console.error('Unexpected error during auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/?error=unexpected_error`)
    }
  }

  // No code parameter, redirect to home
  return NextResponse.redirect(`${requestUrl.origin}/`)
}