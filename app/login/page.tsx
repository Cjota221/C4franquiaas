'use client';

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      })

      if (error) {
        setErro('Email ou senha incorretos')
        setLoading(false)
        return
      }

      if (data.user) {
        // Verificar se é revendedora
        const { data: revendedora } = await supabase
          .from('revendedoras')
          .select('id, status')
          .eq('user_id', data.user.id)
          .single()

        if (revendedora) {
          if (revendedora.status === 'pendente') {
            setErro('Seu cadastro ainda está em análise. Aguarde a aprovação!')
            await supabase.auth.signOut()
            setLoading(false)
            return
          }
          if (revendedora.status === 'rejeitado') {
            setErro('Seu cadastro foi rejeitado. Entre em contato conosco.')
            await supabase.auth.signOut()
            setLoading(false)
            return
          }
          router.push('/revendedora')
          return
        }

        // Se não é revendedora, desloga
        setErro('Conta não encontrada como franqueada')
        await supabase.auth.signOut()
      }
    } catch {
      setErro('Erro ao fazer login. Tente novamente.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex flex-col">
      {/* Header simples */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image 
            src="/android-chrome-192x192.png" 
            alt="C4 Franquias" 
            width={40} 
            height={40}
            className="rounded-xl"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">C4 Franquias</span>
            <span className="text-xs text-pink-600 -mt-1">by Cjota Rasteirinhas</span>
          </div>
        </Link>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Bem-vinda de volta! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Faça login para acessar seu painel
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <form onSubmit={handleLogin} className="space-y-5">
              {erro && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/recuperar-senha" className="text-sm text-gray-500 hover:text-pink-600 transition">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          {/* Link para cadastro */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Ainda não é franqueada?{' '}
              <Link href="/cadastro/revendedora" className="text-pink-600 font-semibold hover:underline">
                Cadastre-se grátis
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} C4 Franquias by Cjota Rasteirinhas
      </footer>
    </div>
  )
}
