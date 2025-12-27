"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function CadastroRevendedoraPage() {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    nomeLoja: '',
    cidade: '',
    estado: '',
    senha: '',
    confirmarSenha: ''
  });

  // Máscara de telefone
  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  }

  // Máscara de CPF
  function formatarCPF(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      if (form.senha.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }

      if (form.senha !== form.confirmarSenha) {
        throw new Error('As senhas não coincidem');
      }

      const res = await fetch('/api/cadastro/revendedora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          cpf: form.cpf,
          nomeLoja: form.nomeLoja,
          cidade: form.cidade,
          estado: form.estado,
          senha: form.senha
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao cadastrar');
      }

      setSucesso(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
      console.error('Erro ao cadastrar:', err);
      alert('❌ ' + msg);
    } finally {
      setLoading(false);
    }
  }

  // Tela de sucesso
  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h2>
          <p className="text-gray-600 mb-6">
            Sua solicitação foi enviada com sucesso. Aguarde a análise do administrador.
            Você receberá um aviso assim que sua conta for aprovada.
          </p>
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-700">
              <strong>📧 Email cadastrado:</strong><br />
              {form.email}
            </p>
          </div>
          <Link
            href="/login/revendedora"
            className="inline-block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 transition"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Seja uma Revendedora</h1>
          <p className="text-gray-500 text-sm mt-1">
            Preencha seus dados para criar sua conta
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Maria Silva"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          {/* Telefone e CPF */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                required
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>

          {/* Nome da Loja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da sua Loja *
            </label>
            <input
              type="text"
              required
              value={form.nomeLoja}
              onChange={(e) => setForm({ ...form, nomeLoja: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Ex: Beleza da Maria"
            />
            <p className="text-xs text-gray-500 mt-1">Este nome aparecerá no seu catálogo</p>
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UF *
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-center"
                placeholder="SP"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.confirmarSenha}
              onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Digite a senha novamente"
            />
            {form.confirmarSenha && form.senha !== form.confirmarSenha && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
            )}
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading || (form.confirmarSenha !== '' && form.senha !== form.confirmarSenha)}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Cadastrando...
              </span>
            ) : (
              'Criar Minha Conta'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <p className="text-center text-sm text-gray-500">
            Já tem cadastro?{' '}
            <Link href="/login/revendedora" className="text-purple-600 hover:underline font-medium">
              Fazer login
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500">
            <Link href="/" className="text-gray-600 hover:underline">
              ← Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
