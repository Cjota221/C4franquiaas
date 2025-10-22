"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function FranqueadoLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // Login com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        setErro('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setErro('Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Verificar se usuário está vinculado a uma franqueada aprovada
      const { data: franqueada, error: franqueadaError } = await supabase
        .from('franqueadas')
        .select('id, nome, status')
        .eq('user_id', authData.user.id)
        .single();

      if (franqueadaError || !franqueada) {
        await supabase.auth.signOut();
        setErro('Usuário não está vinculado a nenhuma franqueada');
        setLoading(false);
        return;
      }

      if (franqueada.status !== 'aprovada') {
        await supabase.auth.signOut();
        setErro('Sua franqueada ainda não foi aprovada pelo administrador');
        setLoading(false);
        return;
      }

      // Sucesso! Redirecionar para dashboard
      console.log('Login bem-sucedido:', franqueada.nome);
      router.push('/franqueado/dashboard');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setErro('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 mb-2">C4 Franquias</h1>
          <p className="text-gray-600">Portal do Franqueado</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Entrar</h2>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
              {erro}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pink-600 text-white rounded font-medium hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Links Adicionais */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Esqueceu sua senha? <a href="#" className="text-pink-600 hover:underline">Recuperar</a></p>
            <p className="mt-2">Não tem conta? <a href="#" className="text-pink-600 hover:underline">Cadastre sua franquia</a></p>
          </div>
        </div>

        {/* Informação */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Acesso restrito a franqueados aprovados</p>
        </div>
      </div>
    </div>
  );
}
