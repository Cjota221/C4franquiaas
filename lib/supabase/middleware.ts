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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // IMPORTANTE: Evitar escrever qualquer lógica entre createServerClient e
  // supabase.auth.getUser(). Um simples erro pode fazer seu usuário ficar
  // deslogado aleatoriamente.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se não está logado e tenta acessar rotas protegidas, redirecionar para login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api/wallet/webhook') &&  // Webhook não precisa de auth
    !request.nextUrl.pathname.startsWith('/site') &&
    !request.nextUrl.pathname.startsWith('/loja') &&
    !request.nextUrl.pathname.startsWith('/sistema-c4') &&  // Login admin central
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/favicon') &&
    request.nextUrl.pathname !== '/'
  ) {
    // Permitir rotas de API - elas retornam 401 se não autenticado
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return supabaseResponse
    }
    
    // Redirecionar páginas para login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANTE: Você *deve* retornar o supabaseResponse object como está.
  // Se você criar um novo response object com NextResponse.next(), certifique-se de:
  // 1. Passar o request: NextResponse.next({ request })
  // 2. Copiar os cookies: NextResponse.next({ request }).cookies = supabaseResponse.cookies
  return supabaseResponse
}
