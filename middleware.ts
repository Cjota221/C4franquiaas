import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Criar cliente Supabase para o middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificar sessão do usuário
  const { data: { session }, error } = await supabase.auth.getSession()

  // 🔒 ROTAS PROTEGIDAS - ADMIN
  if (pathname.startsWith('/admin')) {
    if (!session || error) {
      // Não autenticado - redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar se é admin
    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      // Não é admin - redirecionar para página apropriada
      if (userRole === 'revendedora') {
        return NextResponse.redirect(new URL('/revendedora/dashboard', request.url))
      }
      if (userRole === 'franqueada') {
        return NextResponse.redirect(new URL('/franqueada/dashboard', request.url))
      }
      // Sem role definido - redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 🔒 ROTAS PROTEGIDAS - REVENDEDORA
  if (pathname.startsWith('/revendedora')) {
    if (!session || error) {
      return NextResponse.redirect(new URL('/login/revendedora', request.url))
    }

    const userRole = session.user.user_metadata?.role
    if (userRole !== 'revendedora') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      if (userRole === 'franqueada') {
        return NextResponse.redirect(new URL('/franqueada/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/login/revendedora', request.url))
    }
  }

  // 🔒 ROTAS PROTEGIDAS - FRANQUEADA
  if (pathname.startsWith('/franqueada')) {
    if (!session || error) {
      return NextResponse.redirect(new URL('/login/franqueada', request.url))
    }

    const userRole = session.user.user_metadata?.role
    if (userRole !== 'franqueada') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      if (userRole === 'revendedora') {
        return NextResponse.redirect(new URL('/revendedora/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/login/franqueada', request.url))
    }
  }

  // ✅ Usuário autenticado e com role correto
  return response
}

// Configurar quais rotas o middleware deve proteger
export const config = {
  matcher: [
    '/admin/:path*',
    '/revendedora/:path*',
    '/franqueada/:path*',
  ],
}
