// Garante que este componente só será usado no lado do cliente
"use client";

import React, { useState } from 'react';
// Importa o ícone de chave
import { KeyRound } from 'lucide-react';

// Página de Login
export default function LoginPage() {
  // Estados para armazenar o e-mail e a senha
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Função para lidar com o login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // Impede que a página recarregue
    setError(''); // Limpa erros anteriores

    // Simulação de login - LÓGICA TEMPORÁRIA
    // No futuro, aqui será a chamada para o Supabase Auth
    if (email === 'admin@c4franquias.com.br' && password === '123456') {
      alert('Login bem-sucedido! Redirecionando...');
      // No projeto real, usaremos o router do Next.js para redirecionar
      // Ex: router.push('/admin/dashboard');
    } else {
      setError('E-mail ou senha inválidos.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF5FA]">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-2xl">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#DB1472]">C4 Franquias</h1>
          <p className="text-gray-500 mt-2">Acesso ao Painel da Matriz</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            {/* Campo de E-mail */}
            <div>
              <label className="block text-lg font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#F8B81F] focus:border-[#F8B81F]"
                placeholder="seuemail@exemplo.com"
              />
            </div>
            {/* Campo de Senha */}
            <div>
              <label className="block text-lg font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#F8B81F] focus:border-[#F8B81F]"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <p className="mt-4 text-center text-red-500">{error}</p>
          )}

          {/* Botão de Entrar */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-[#DB1472] text-white font-bold rounded-lg text-lg hover:bg-pink-700 transition-all"
            >
              <KeyRound size={20} />
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
