import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  let role = 'OPERATOR'
  let isTokenDecoded = false
  if (session?.access_token) {
    try {
      const base64Url = session.access_token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      const rawClaims = JSON.parse(jsonPayload)
      if (rawClaims?.app_metadata?.role) {
        role = rawClaims.app_metadata.role
        isTokenDecoded = true
      }
    } catch (e) {
      // Decode failed
    }
  }

  // Fallback to session user if decode failed or role missing
  if (!isTokenDecoded) {
    role = session?.user?.app_metadata?.role || 'OPERATOR'
  }

  const user = session?.user

  const path = request.nextUrl.pathname
  
  // PROTEÇÃO DAS ROTAS DE ADMIN
  if (path.startsWith('/admin')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (role !== 'ADMIN' && role !== 'OWNER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Rotas que pertencem a area protegida do sistema
  const isProtected = path === '/' || 
                      path.startsWith('/admin') ||
                      path.startsWith('/producers') || 
                      path.startsWith('/properties') || 
                      path.startsWith('/credit-analysis') || 
                      path.startsWith('/proposals') || 
                      path.startsWith('/document-management')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // A permissão de admin já foi verificada nas linhas 62-71 usando a role descodificada.

  // Redireciona para a home se o user ja estiver logado e tentar aceder a tela de auth
  if (user && path.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
