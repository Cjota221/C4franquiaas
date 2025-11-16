"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Store, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function CadastroRevendedoraPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    store_name: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErro('');
  }

  function validarFormulario() {
    if (!formData.name.trim()) {
      setErro('Por favor, informe seu nome completo');
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErro('Por favor, informe um e-mail válido');
      return false;
    }

    if (!formData.phone.trim()) {
      setErro('Por favor, informe seu telefone/WhatsApp');
      return false;
    }

    if (!formData.store_name.trim()) {
      setErro('Por favor, informe o nome da sua loja');
      return false;
    }

    if (formData.password.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErro('As senhas não conferem');
      return false;
    }

    return true;
  }

  function gerarSlug(storeName: string): string {
    return storeName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    setErro('');

    try {
      console.log(' Iniciando cadastro de revendedora:', formData.email);

      // 1. Verificar se email já existe
      const { data: emailExists } = await supabase
        .from('resellers')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (emailExists) {
        throw new Error('Este e-mail já está cadastrado. Por favor, faça login ou use outro e-mail.');
      }

      // 2. Verificar se slug já existe (adicionar número se necessário)
      let slug = gerarSlug(formData.store_name);
      const { data: slugExists } = await supabase
        .from('resellers')
        .select('slug')
        .eq('slug', slug);

      if (slugExists && slugExists.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }

      // 3. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            user_type: 'revendedora'
          }
        }
      });

      if (authError) {
        console.error(' Erro no signup:', authError);
        if (authError.message.includes('already registered')) {
          throw new Error('Este e-mail já está cadastrado no sistema.');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      console.log(' Usuário criado no Auth:', authData.user.id);

      // 4. Criar registro na tabela resellers
      const { data: resellerData, error: resellerError } = await supabase
        .from('resellers')
        .insert({
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          store_name: formData.store_name,
          slug: slug,
          status: 'pendente',
          is_active: false,
          total_products: 0,
          catalog_views: 0
        })
        .select()
        .single();

      if (resellerError) {
        console.error(' Erro ao criar revendedora:', resellerError);
        // Informar erro mas não tentar deletar (usuário ficará no Auth mas sem reseller)
        // Admin pode limpar manualmente depois
        throw new Error('Erro ao criar registro de revendedora. Por favor, entre em contato com o suporte informando seu e-mail.');
      }

      console.log(' Revendedora criada:', resellerData);

      // Fazer logout automático (usuário precisa aguardar aprovação)
      await supabase.auth.signOut();

      setSucesso(true);

      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/revendedora/login');
      }, 3000);

    } catch (err) {
      console.error(' Erro no cadastro:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Cadastro Realizado! 
            </h1>
            
            <p className="text-gray-600 mb-6">
              Seu cadastro foi enviado para análise. Você receberá um e-mail quando for aprovado pela nossa equipe.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Próximos passos:</strong><br />
                 Nossa equipe irá analisar seu cadastro<br />
                 Você receberá um e-mail de confirmação<br />
                 Após aprovação, você poderá fazer login
              </p>
            </div>

            <p className="text-sm text-gray-500">
              Redirecionando para o login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 mb-2">C4 Franquias</h1>
          <p className="text-gray-600 text-lg">Cadastro de Revendedora</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seja uma Revendedora</h2>
            <p className="text-gray-600">
              Preencha seus dados e aguarde a aprovação para começar a vender
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Seu nome completo"
                required
              />
            </div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  E-mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Telefone/WhatsApp *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            {/* Nome da Loja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store className="inline w-4 h-4 mr-1" />
                Nome da sua Loja *
              </label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => handleChange('store_name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Ex: Loja da Maria"
                required
              />
              {formData.store_name && (
                <p className="text-xs text-gray-500 mt-1">
                  Seu link será: c4franquias.com.br/loja/{gerarSlug(formData.store_name)}
                </p>
              )}
            </div>

            {/* Senhas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-12"
                    placeholder="Mínimo 6 caracteres"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-12"
                    placeholder="Repita a senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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
              {loading ? 'Cadastrando...' : 'Enviar Cadastro'}
            </button>

            <div className="text-center text-sm text-gray-600">
              Já tem cadastro?{' '}
              <button
                type="button"
                onClick={() => router.push('/revendedora/login')}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Fazer login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




