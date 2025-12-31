"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

type ProdutoNovo = {
  produto_id: string;
  produto_nome: string;
  preco_base: number;
  estoque: number;
  imagem: string | null;
  categorias: string[] | null;
  custom_price: number;
  margin_percent: number;
  data_vinculo: string;
};

export default function ProdutosNovosPage() {
  const [produtos, setProdutos] = useState<ProdutoNovo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<Set<string>>(new Set());
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [margens, setMargens] = useState<Record<string, number>>({});

  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Buscar reseller_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: resellerData, error: resellerError } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (resellerError) throw resellerError;

      // Buscar produtos novos
      const { data, error } = await supabase
        .from('produtos_novos_franqueada')
        .select('*')
        .eq('reseller_id', resellerData.id);

      if (error) throw error;

      setProdutos(data || []);
      
      // Inicializar margens com valores atuais
      const margensIniciais: Record<string, number> = {};
      data?.forEach(p => {
        margensIniciais[p.produto_id] = p.margin_percent;
      });
      setMargens(margensIniciais);

    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar produtos novos' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  function calcularPrecoFinal(precoBase: number, margem: number): number {
    return precoBase * (1 + margem / 100);
  }

  function alterarMargem(produtoId: string, novaMargem: number) {
    setMargens(prev => ({
      ...prev,
      [produtoId]: novaMargem
    }));
  }

  async function ativarProduto(produto: ProdutoNovo) {
    const margem = margens[produto.produto_id];
    if (!margem || margem < 0) {
      setMensagem({ tipo: 'error', texto: 'Informe uma margem válida' });
      return;
    }

    try {
      setProcessando(prev => new Set(prev).add(produto.produto_id));
      
      const response = await fetch('/api/revendedora/produtos/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: produto.produto_id,
          margem_percent: margem
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ativar produto');
      }

      setMensagem({ 
        tipo: 'success', 
        texto: `${produto.produto_nome} ativado com sucesso!` 
      });
      
      // Recarregar lista
      await carregarProdutos();
      
    } catch (err) {
      console.error('Erro:', err);
      setMensagem({ 
        tipo: 'error', 
        texto: err instanceof Error ? err.message : 'Erro ao ativar produto' 
      });
    } finally {
      setProcessando(prev => {
        const novoSet = new Set(prev);
        novoSet.delete(produto.produto_id);
        return novoSet;
      });
    }
  }

  async function ativarTodos() {
    if (produtos.length === 0) return;
    
    if (!confirm(`Deseja ativar TODOS os ${produtos.length} produtos com as margens definidas?`)) {
      return;
    }

    let sucesso = 0;
    let falhas = 0;

    for (const produto of produtos) {
      try {
        await ativarProduto(produto);
        sucesso++;
      } catch {
        falhas++;
      }
    }

    setMensagem({
      tipo: sucesso > 0 ? 'success' : 'error',
      texto: `✅ ${sucesso} ativados, ❌ ${falhas} falharam`
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🆕 Produtos Novos Disponíveis
          </h1>
          <p className="text-gray-600 mt-2">
            Produtos aprovados pelo administrador aguardando sua ativação
          </p>
        </div>

        {/* Mensagem */}
        {mensagem && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensagem.tipo === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <button
              onClick={() => setMensagem(null)}
              className="float-right text-lg font-bold"
            >
              ×
            </button>
            {mensagem.texto}
          </div>
        )}

        {/* Ações */}
        {produtos.length > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">
              {produtos.length} produto(s) novo(s)
            </div>
            <div className="flex-1"></div>
            <button
              onClick={ativarTodos}
              disabled={processando.size > 0}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Ativar Todos
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
            <p className="text-xl font-semibold text-gray-700">Nenhum produto novo!</p>
            <p className="text-gray-600 mt-2">
              Todos os produtos foram ativados no seu catálogo.
            </p>
          </div>
        )}

        {/* Grid de Produtos */}
        {!loading && produtos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtos.map((produto) => {
              const margem = margens[produto.produto_id] || produto.margin_percent;
              const precoFinal = calcularPrecoFinal(produto.preco_base, margem);
              const isProcessando = processando.has(produto.produto_id);

              return (
                <div
                  key={produto.produto_id}
                  className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition"
                >
                  {/* Badge NOVO */}
                  <div className="flex items-start gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                      NOVO
                    </span>
                    <h3 className="flex-1 font-semibold text-gray-800 line-clamp-2">
                      {produto.produto_nome}
                    </h3>
                  </div>

                  {/* Imagem */}
                  {produto.imagem && (
                    <div className="mb-3 relative h-48 w-full">
                      <Image
                        src={produto.imagem}
                        alt={produto.produto_nome}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}

                  {/* Informações */}
                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço Base:</span>
                      <span className="font-semibold">
                        R$ {produto.preco_base.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Estoque:</span>
                      <span className="font-semibold text-green-600">
                        {produto.estoque} un.
                      </span>
                    </div>

                    {/* Margem */}
                    <div className="border-t pt-3">
                      <label className="block text-gray-700 font-medium mb-2">
                        Sua Margem de Lucro:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={margem}
                          onChange={(e) => alterarMargem(produto.produto_id, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isProcessando}
                        />
                        <span className="text-gray-600 font-medium">%</span>
                      </div>
                    </div>

                    {/* Preço Final */}
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Seu Preço:</span>
                        <span className="text-xl font-bold text-blue-600">
                          R$ {precoFinal.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Lucro: R$ {(precoFinal - produto.preco_base).toFixed(2)}
                      </p>
                    </div>

                    {produto.categorias && produto.categorias.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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
                  </div>

                  {/* Botão Ativar */}
                  <button
                    onClick={() => ativarProduto(produto)}
                    disabled={isProcessando || margem <= 0}
                    className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessando ? '⏳ Ativando...' : '✅ Ativar no Meu Site'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
