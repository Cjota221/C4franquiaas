import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🚨 TEMPORARIAMENTE DESABILITADO PARA DEBUG
  // O middleware estava bloqueando o login
  console.log('� Middleware ativo na rota:', pathname)
  
  // Apenas passar a requisição sem verificar autenticação
  return NextResponse.next()
}

// Configurar quais rotas o middleware deve proteger
export const config = {
  matcher: [
    '/admin/:path*',
    '/revendedora/:path*',
    '/franqueada/:path*',
  ],
}
