'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginRevendedoraPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleLogin chamado!');
    console.log('📧 Email:', email);
    setLoading(true);
    setError(null);

    try {
      console.log('🔌 Criando cliente Supabase...');
      const supabase = createClient();
      
      console.log('🔐 Tentando fazer login...');
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📦 Resultado do login:', { user: user?.id, error: signInError?.message });

      if (signInError) throw new Error(signInError.message);
      if (!user) throw new Error('Usuário não encontrado após o login.');

      console.log('👤 Usuário logado:', user.id);

      // Verificar se é revendedora
      console.log('🔍 Buscando dados da revendedora...');
      const { data: revendedora } = await supabase
        .from('resellers')
        .select('id, status, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!revendedora) {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Esta área é exclusiva para revendedoras.');
      }

      if (revendedora.status !== 'aprovada') {
        await supabase.auth.signOut();
        if (revendedora.status === 'pendente') {
          throw new Error('Sua conta ainda está aguardando aprovação. Aguarde o contato do administrador.');
        } else if (revendedora.status === 'rejeitada') {
          throw new Error('Sua solicitação foi recusada. Entre em contato para mais informações.');
        } else {
          throw new Error('Sua conta de revendedora não está ativa.');
        }
      }

      console.log('✅ Login OK! Redirecionando para dashboard...');
      window.location.href = '/revendedora/dashboard';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      console.error('❌ Erro no login:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        {/* Logo e Título */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal da Franqueada</h1>
          <p className="text-sm text-gray-500">C4 Franquias</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Seu Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="revendedora@email.com"
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
              className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
            className="w-full px-4 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all"
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
              'Acessar Minha Conta'
            )}
          </button>
        </form>

        {/* Links adicionais */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <p className="text-center text-sm text-gray-500">
            Ainda não é franqueada?{' '}
            <Link href="/cadastro/revendedora" className="text-purple-600 hover:underline font-medium">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
