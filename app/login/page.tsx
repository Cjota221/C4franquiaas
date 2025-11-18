'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
      const { data: { user }, error: signInError } = await createClient().auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw new Error(signInError.message);
      if (!user) throw new Error('Usuário não encontrado após o login.');

      // Verificar se é admin
      const { data: perfil } = await createClient()
        .from('perfis')
        .select('papel')
        .eq('id', user.id)
        .maybeSingle();

      if (perfil && perfil.papel === 'admin') {
        router.push('/admin/dashboard');
        return;
      }

      // Verificar se é franqueada (prioridade)
      const { data: franqueada } = await createClient()
        .from('franqueadas')
        .select('id, ativo')
        .eq('user_id', user.id)
        .maybeSingle();

      if (franqueada) {
        if (franqueada.ativo) {
          router.push('/franqueada/dashboard');
          return;
        } else {
          await createClient().auth.signOut();
          throw new Error('Sua conta de franqueada está inativa. Entre em contato com o administrador.');
        }
      }

      // Verificar se é revendedora
      const { data: revendedora } = await createClient()
        .from('resellers')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (revendedora) {
        if (revendedora.status === 'aprovada') {
          router.push('/revendedora/dashboard');
          return;
        } else {
          await createClient().auth.signOut();
          throw new Error('Sua conta de revendedora ainda não foi aprovada pelo administrador.');
        }
      }

      // Se não encontrou nenhum perfil
      await createClient().auth.signOut();
      throw new Error('Acesso negado. Usuário não possui perfil válido.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-[#DB1472]">C4 Franquias</h1>
        <p className="text-center text-gray-600">Acesso ao Sistema</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DB1472] focus:border-[#DB1472]"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#DB1472] focus:border-[#DB1472]"
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-bold text-white bg-[#DB1472] rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DB1472] disabled:bg-pink-300"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
