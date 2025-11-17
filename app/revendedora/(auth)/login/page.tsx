"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginRevendedoraPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      console.log('[login]  Tentando login com:', email);
      
      // Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (authError) {
        console.error('[login]  Erro na autenticação:', authError);
        
        // Tratar erros específicos
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada ou entre em contato com o suporte.');
        }
        
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos. Verifique seus dados e tente novamente.');
        }
        
        throw new Error(authError.message || 'Erro ao fazer login. Tente novamente.');
      }

      if (!authData.user) {
        throw new Error('Erro ao autenticar usuÃ¡rio');
      }

      // Verificar se o usuÃ¡rio estÃ¡ vinculado a uma revendedora
      const { data: reseller, error: resellerError } = await supabase
        .from('resellers')
        .select('id, name, store_name, is_active')
        .eq('user_id', authData.user.id)
        .single();

      if (resellerError || !reseller) {
        await supabase.auth.signOut();
        throw new Error('UsuÃ¡rio nÃ£o estÃ¡ vinculado a nenhuma revendedora');
      }

      // Verificar se estÃ¡ aprovada
      if (!reseller.is_active) {
        await supabase.auth.signOut();
        throw new Error('Seu cadastro ainda nÃ£o foi aprovado pelo administrador. VocÃª receberÃ¡ um e-mail quando for aprovado.');
      }

      console.log('[login]  Login bem-sucedido:', reseller.name);

      // Redirecionar para dashboard
      router.push('/revendedora/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 mb-2">C4 Franquias</h1>
          <p className="text-gray-600 text-lg">Portal da Revendedora</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-12"
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="text-center text-sm text-gray-600 space-y-2">
              <div>
                NÃ£o tem cadastro?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/cadastro/revendedora')}
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  Quero ser revendedora
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}