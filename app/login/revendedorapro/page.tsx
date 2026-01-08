'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginRevendedoraProPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw new Error(signInError.message);
      if (!user) throw new Error('Usuário não encontrado após o login.');

      // Verificar se é Revendedora Pro (franqueada)
      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id, status, nome')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!franqueada) {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Esta área é exclusiva para Revendedoras Pro.');
      }

      if (franqueada.status !== 'aprovada') {
        await supabase.auth.signOut();
        if (franqueada.status === 'pendente') {
          throw new Error('Seu cadastro ainda está em análise. Aguarde a aprovação!');
        } else if (franqueada.status === 'rejeitada') {
          throw new Error('Seu cadastro foi rejeitado. Entre em contato conosco.');
        } else {
          throw new Error('Sua conta não está ativa. Entre em contato com o administrador.');
        }
      }

      router.push('/franqueada/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#DB1472] via-pink-600 to-[#DB1472] font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        {/* Logo e Título */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-[#DB1472] rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Revendedora Pro</h1>
          <p className="text-sm text-gray-500">C4 Franquias - Área Exclusiva</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#DB1472] focus:border-[#DB1472] transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-semibold text-white bg-[#DB1472] rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DB1472] disabled:bg-pink-300 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Entrando...
              </span>
            ) : (
              'Acessar Portal'
            )}
          </button>
        </form>

        {/* Links adicionais */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <p className="text-center text-sm text-gray-500">
            Ainda não tem conta?{' '}
            <Link href="/cadastro/franqueada" className="text-[#DB1472] hover:underline font-medium">
              Cadastre-se como Revendedora Pro
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500">
            É revendedora comum?{' '}
            <Link href="/login/revendedora" className="text-[#DB1472] hover:underline font-medium">
              Acesse aqui
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="text-gray-600 hover:underline">
              ← Voltar ao login principal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
