'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient'; // CORREÇÃO: Ajustado o caminho relativo
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

// ESTRUTURA CORRIGIDA: Reflete a tabela final do Supabase
type Produto = {
  id: number;
  nome: string;
  estoque: number;
  preco_base: number | null;
  ativo: boolean;
  imagem: string | null; // Corrigido para uma única imagem
};

type StatusMessage = {
  type: 'success' | 'error' | 'loading';
  text: string;
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar os produtos do nosso banco (Supabase)
  async function fetchProdutosDoBanco() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*');

    if (error) {
      console.error('Erro ao buscar produtos do Supabase:', error);
      setStatus({ type: 'error', text: 'Não foi possível carregar os produtos.' });
    } else {
      setProdutos(data || []);
    }
    setIsLoading(false);
  }

  // Busca os produtos ao carregar a página
  useEffect(() => {
    fetchProdutosDoBanco();
  }, []);

  // Função chamada pelo botão "Sincronizar"
  async function handleSincronizacao() {
    setStatus({ type: 'loading', text: 'Sincronizando... Isso pode levar um momento.' });
    
    try {
      const response = await fetch('/api/sync-produtos', {
        method: 'POST',
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocorreu um erro desconhecido na API.');
      }

      setStatus({ type: 'success', text: result.message || 'Produtos sincronizados com sucesso!' });
      await fetchProdutosDoBanco(); // Atualiza a lista na tela

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao conectar com o servidor.';
      setStatus({ type: 'error', text: `Falha na sincronização: ${errorMessage}` });
    }
  }

  return (
    <div className="p-8 font-sans">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Produtos</h1>
          <p className="text-gray-500 mt-1">Gerencie e sincronize os produtos da sua loja.</p>
        </div>
        <button
          onClick={handleSincronizacao}
          disabled={status?.type === 'loading'}
          className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-pink-600 rounded-lg shadow-md hover:bg-pink-700 disabled:bg-pink-300 transition-colors"
        >
          <RefreshCw className={`h-5 w-5 ${status?.type === 'loading' ? 'animate-spin' : ''}`} />
          {status?.type === 'loading' ? 'Sincronizando...' : 'Sincronizar Produtos'}
        </button>
      </div>
      
      {/* Mensagem de Status */}
      {status && (
        <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 text-white ${
          status.type === 'success' ? 'bg-green-500' :
          status.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {status.type === 'success' && <CheckCircle className="h-5 w-5" />}
          {status.type === 'error' && <AlertCircle className="h-5 w-5" />}
          {status.type === 'loading' && <RefreshCw className="h-5 w-5 animate-spin" />}
          <span className="font-medium">{status.text}</span>
        </div>
      )}

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-gray-600">
                <th className="p-4 font-semibold">Imagem</th>
                <th className="p-4 font-semibold">Nome do Produto</th>
                <th className="p-4 font-semibold">Estoque</th>
                <th className="p-4 font-semibold">Preço Base</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
              ) : produtos.length > 0 ? (
                produtos.map((produto) => (
                  <tr key={produto.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <img 
                        src={produto.imagem || 'https://placehold.co/100x100/EEE/31343C?text=Sem+Foto'}
                        alt={produto.nome}
                        className="h-16 w-16 object-cover rounded-md bg-gray-100"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/EEE/31343C?text=Erro' }}
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-800">{produto.nome}</td>
                    <td className="p-4 text-gray-600">{produto.estoque}</td>
                    <td className="p-4 text-gray-600">
                      {produto.preco_base ? `R$ ${produto.preco_base.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum produto encontrado. Sincronize para carregar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}