"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function LoginFranqueadaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (authError) {
        throw new Error('Email ou senha incorretos');
      }

      if (!authData.user) {
        throw new Error('Erro ao autenticar usuário');
      }

      // Verificar se o usuário está vinculado a uma franqueada
      const { data: franqueada, error: franqueadaError } = await supabase
        .from('franqueadas')
        .select('id, nome, status')
        .eq('user_id', authData.user.id)
        .single();

      if (franqueadaError || !franqueada) {
        await supabase.auth.signOut();
        throw new Error('Usuário não está vinculado a nenhuma franqueada');
      }

      // Verificar se está aprovada
      if (franqueada.status !== 'aprovada') {
        await supabase.auth.signOut();
        throw new Error('Seu cadastro ainda não foi aprovado pelo administrador');
      }

      // Atualizar último acesso
      await supabase
        .from('franqueadas')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', franqueada.id);

      console.log('[login] ✓ Login bem-sucedido:', franqueada.nome);

      // Redirecionar para dashboard
      router.push('/franqueada/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login';
      console.error('[login] Erro:', err);
      alert('❌ ' + msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-pink-600 mb-2">
            Login - Franqueada
          </h1>
          <p className="text-gray-600 text-sm">
            Acesse seu painel de gerenciamento
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <p className="text-gray-600">
            Não tem cadastro?{' '}
            <a href="/cadastro/franqueada" className="text-pink-600 hover:underline font-medium">
              Cadastre-se
            </a>
          </p>
          <p className="text-gray-600">
            <a href="/franqueada/recuperar-senha" className="text-pink-600 hover:underline">
              Esqueceu sua senha?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
