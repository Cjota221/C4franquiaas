"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import Image from 'next/image';

type ProdutoPendente = {
  id: string;
  nome: string;
  codigo_barras: string | null;
  preco_base: number;
  estoque: number;
  imagem: string | null;
  categorias: string[] | null;
  descricao: string | null;
  ultima_sincronizacao: string;
  created_at: string;
};

export default function ProdutosPendentesPage() {
  const [produtos, setProdutos] = useState<ProdutoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('produtos_pendentes_aprovacao')
        .select('*');

      if (error) throw error;

      setProdutos(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar produtos pendentes' });
    } finally {
      setLoading(false);
    }
  }

  function toggleSelecao(id: string) {
    const novoSet = new Set(selecionados);
    if (novoSet.has(id)) {
      novoSet.delete(id);
    } else {
      novoSet.add(id);
    }
    setSelecionados(novoSet);
  }

  function selecionarTodos() {
    if (selecionados.size === produtos.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(produtos.map(p => p.id)));
    }
  }

  async function aprovar() {
    if (selecionados.size === 0) {
      setMensagem({ tipo: 'error', texto: 'Selecione pelo menos um produto' });
      return;
    }

    if (!confirm(`Deseja aprovar ${selecionados.size} produto(s)? Eles serão vinculados às franqueadas.`)) {
      return;
    }

    try {
      setProcessando(true);
      const response = await fetch('/api/admin/produtos/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_ids: Array.from(selecionados),
          acao: 'aprovar'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar produtos');
      }

      setMensagem({ tipo: 'success', texto: data.message });
      setSelecionados(new Set());
      await carregarProdutos();
    } catch (err) {
      console.error('Erro:', err);
      setMensagem({ 
        tipo: 'error', 
        texto: err instanceof Error ? err.message : 'Erro ao aprovar produtos' 
      });
    } finally {
      setProcessando(false);
    }
  }

  async function rejeitar() {
    if (selecionados.size === 0) {
      setMensagem({ tipo: 'error', texto: 'Selecione pelo menos um produto' });
      return;
    }

    const motivoInput = prompt('Informe o motivo da rejeição:');
    if (!motivoInput) return;

    try {
      setProcessando(true);
      const response = await fetch('/api/admin/produtos/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_ids: Array.from(selecionados),
          acao: 'rejeitar',
          notas: motivoInput
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao rejeitar produtos');
      }

      setMensagem({ tipo: 'success', texto: data.message });
      setSelecionados(new Set());
      await carregarProdutos();
    } catch (err) {
      console.error('Erro:', err);
      setMensagem({ 
        tipo: 'error', 
        texto: err instanceof Error ? err.message : 'Erro ao rejeitar produtos' 
      });
    } finally {
      setProcessando(false);
    }
  }

  return (
    <PageWrapper title="Produtos Pendentes">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🆕 Produtos Pendentes de Aprovação
          </h1>
          <p className="text-gray-600 mt-2">
            Produtos vindos do FácilZap aguardando sua aprovação para irem às franqueadas
          </p>
        </div>

        {/* Mensagem */}
        {mensagem && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensagem.tipo === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {/* Ações */}
        {produtos.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-white p-4 rounded-lg border">
            <button
              onClick={selecionarTodos}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              disabled={processando}
            >
              {selecionados.size === produtos.length ? '❌ Desmarcar Todos' : '✅ Selecionar Todos'}
            </button>

            <div className="text-sm text-gray-600">
              {selecionados.size} produto(s) selecionado(s)
            </div>

            <div className="flex-1"></div>

            <button
              onClick={aprovar}
              disabled={selecionados.size === 0 || processando}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processando ? '⏳ Processando...' : '✅ Aprovar Selecionados'}
            </button>

            <button
              onClick={rejeitar}
              disabled={selecionados.size === 0 || processando}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚫 Rejeitar Selecionados
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando produtos...</p>
          </div>
        )}

        {/* Lista Vazia */}
        {!loading && produtos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-xl font-semibold text-gray-700">Nenhum produto pendente!</p>
            <p className="text-gray-600 mt-2">
              Todos os produtos foram aprovados ou rejeitados.
            </p>
          </div>
        )}

        {/* Grid de Produtos */}
        {!loading && produtos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition ${
                  selecionados.has(produto.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleSelecao(produto.id)}
              >
                {/* Checkbox */}
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={selecionados.has(produto.id)}
                    onChange={() => toggleSelecao(produto.id)}
                    className="mt-1 h-5 w-5"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">
                      {produto.nome}
                    </h3>
                  </div>
                </div>

                {/* Imagem */}
                {produto.imagem && (
                  <div className="mb-3 relative h-48 w-full">
                    <Image
                      src={produto.imagem}
                      alt={produto.nome}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}

                {/* Informações */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preço:</span>
                    <span className="font-semibold text-green-600">
                      R$ {produto.preco_base?.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Estoque:</span>
                    <span className="font-semibold">
                      {produto.estoque} un.
                    </span>
                  </div>

                  {produto.codigo_barras && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Código:</span>
                      <span className="text-xs font-mono">
                        {produto.codigo_barras}
                      </span>
                    </div>
                  )}

                  {produto.categorias && produto.categorias.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {produto.categorias.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t text-xs text-gray-500">
                    Sincronizado: {new Date(produto.ultima_sincronizacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
