'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
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

      // Verificar se é admin
      const { data: perfil } = await supabase
        .from('perfis')
        .select('papel')
        .eq('id', user.id)
        .maybeSingle();

      if (perfil && perfil.papel === 'admin') {
        router.push('/admin/dashboard');
        return;
      }

      // Verificar se é franqueada (prioridade)
      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id, ativo')
        .eq('user_id', user.id)
        .maybeSingle();

      if (franqueada) {
        if (franqueada.ativo) {
          router.push('/franqueada/dashboard');
          return;
        } else {
          await supabase.auth.signOut();
          throw new Error('Sua conta de franqueada está inativa. Entre em contato com o administrador.');
        }
      }

      // Verificar se é revendedora
      const { data: revendedora } = await supabase
        .from('resellers')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (revendedora) {
        if (revendedora.status === 'aprovada') {
          router.push('/revendedora/dashboard');
          return;
        } else {
          await supabase.auth.signOut();
          throw new Error('Sua conta de revendedora ainda não foi aprovada pelo administrador.');
        }
      }

      // Se não encontrou nenhum perfil
      await supabase.auth.signOut();
      throw new Error('Acesso negado. Usuário não possui perfil válido.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#DB1472]">C4 Franquias</h1>
          <p className="text-gray-600">Sistema de Gestão</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 text-center">Acesso ao Sistema</h2>

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
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Links de Acesso Direto */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-sm text-gray-600 text-center mb-4">Ou acesse diretamente:</p>
          
          <div className="grid grid-cols-1 gap-3">
            <Link 
              href="/login/franqueada"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#DB1472] hover:bg-pink-50 transition-all group"
            >
              <div className="w-10 h-10 bg-[#DB1472] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Portal da Franqueada</p>
                <p className="text-xs text-gray-500">Gerencie sua franquia</p>
              </div>
            </Link>

            <Link 
              href="/login/revendedora"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Portal da Revendedora</p>
                <p className="text-xs text-gray-500">Acesse sua conta de revenda</p>
              </div>
            </Link>

            <Link 
              href="/login/admin"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-800 hover:bg-gray-50 transition-all group"
            >
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Painel Administrativo</p>
                <p className="text-xs text-gray-500">Acesso restrito</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Cadastro Revendedora */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Quer ser uma revendedora?{' '}
            <Link href="/cadastro/revendedora" className="text-[#DB1472] hover:underline font-medium">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
