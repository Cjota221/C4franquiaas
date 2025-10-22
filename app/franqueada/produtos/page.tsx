"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { Search, Package, DollarSign, TrendingUp } from 'lucide-react';

type Produto = {
  id: string;
  produto_franqueada_id: string;
  nome: string;
  preco_base: number;
  ajuste_tipo: 'fixo' | 'porcentagem' | null;
  ajuste_valor: number | null;
  preco_final: number;
  ativo_no_site: boolean;
  estoque: number;
  imagem: string | null;
};

export default function FranqueadaProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteTipo, setAjusteTipo] = useState<'fixo' | 'porcentagem'>('porcentagem');
  const [ajusteValor, setAjusteValor] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const carregarProdutos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) return;

      // Buscar produtos vinculados com preços
      const { data: vinculacoes } = await supabase
        .from('produtos_franqueadas')
        .select(`
          id,
          produto_id,
          produtos:produto_id (
            id,
            nome,
            preco_base,
            estoque,
            imagem
          )
        `)
        .eq('franqueada_id', franqueada.id)
        .eq('ativo', true);

      if (!vinculacoes || vinculacoes.length === 0) {
        setProdutos([]);
        setLoading(false);
        return;
      }

      // Buscar preços personalizados
      const vinculacaoIds = vinculacoes.map(v => v.id);
      const { data: precos } = await supabase
        .from('produtos_franqueadas_precos')
        .select('*')
        .in('produto_franqueada_id', vinculacaoIds);

      // Combinar dados
      const produtosFormatados: Produto[] = vinculacoes.map(v => {
        const produtoData = Array.isArray(v.produtos) ? v.produtos[0] : v.produtos;
        const produto = produtoData as unknown as { id: number; nome: string; preco_base: number; estoque: number; imagem: string | null } | null;
        const preco = precos?.find(p => p.produto_franqueada_id === v.id);

        if (!produto) return null;

        return {
          id: String(produto.id),
          produto_franqueada_id: v.id,
          nome: produto.nome,
          preco_base: produto.preco_base || 0,
          ajuste_tipo: preco?.ajuste_tipo || null,
          ajuste_valor: preco?.ajuste_valor || null,
          preco_final: preco?.preco_final || produto.preco_base || 0,
          ativo_no_site: preco?.ativo_no_site || false,
          estoque: produto.estoque || 0,
          imagem: produto.imagem
        };
      }).filter((p): p is Produto => p !== null);

      setProdutos(produtosFormatados);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  function selectAll() {
    if (selectedIds.size === produtos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(produtos.map(p => p.produto_franqueada_id)));
    }
  }

  async function aplicarAjuste() {
    if (!ajusteValor || selectedIds.size === 0) {
      alert('Selecione produtos e informe o valor do ajuste');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) return;

      // Para cada produto selecionado
      for (const produtoFranqueadaId of selectedIds) {
        const produto = produtos.find(p => p.produto_franqueada_id === produtoFranqueadaId);
        if (!produto) continue;

        const precoBase = produto.preco_base;
        let precoFinal = precoBase;

        // Calcular preço final
        if (ajusteTipo === 'porcentagem') {
          precoFinal = precoBase * (1 + parseFloat(ajusteValor) / 100);
        } else {
          precoFinal = precoBase + parseFloat(ajusteValor);
        }

        // Inserir ou atualizar preço
        await supabase
          .from('produtos_franqueadas_precos')
          .upsert({
            produto_franqueada_id: produtoFranqueadaId,
            preco_base: precoBase,
            ajuste_tipo: ajusteTipo,
            ajuste_valor: parseFloat(ajusteValor),
            preco_final: precoFinal,
            atualizado_em: new Date().toISOString()
          }, { onConflict: 'produto_franqueada_id' });
      }

      alert('✅ Preços ajustados com sucesso!');
      setShowAjusteModal(false);
      setAjusteValor('');
      setSelectedIds(new Set());
      carregarProdutos();
    } catch (err) {
      console.error('Erro ao ajustar preços:', err);
      alert('❌ Erro ao ajustar preços');
    }
  }

  async function toggleAtivo(produtoFranqueadaId: string, ativo: boolean) {
    try {
      // Buscar ou criar registro de preço
      const { data: precoExistente } = await supabase
        .from('produtos_franqueadas_precos')
        .select('*')
        .eq('produto_franqueada_id', produtoFranqueadaId)
        .single();

      const produto = produtos.find(p => p.produto_franqueada_id === produtoFranqueadaId);
      if (!produto) return;

      if (precoExistente) {
        // Atualizar status
        await supabase
          .from('produtos_franqueadas_precos')
          .update({ ativo_no_site: ativo })
          .eq('produto_franqueada_id', produtoFranqueadaId);
      } else {
        // Criar registro inicial
        await supabase
          .from('produtos_franqueadas_precos')
          .insert({
            produto_franqueada_id: produtoFranqueadaId,
            preco_base: produto.preco_base,
            preco_final: produto.preco_base,
            ativo_no_site: ativo
          });
      }

      carregarProdutos();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('❌ Erro ao atualizar status');
    }
  }

  async function toggleAtivoEmMassa(ativo: boolean) {
    for (const id of selectedIds) {
      await toggleAtivo(id, ativo);
    }
    setSelectedIds(new Set());
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">💎 Meus Produtos</h1>
        <p className="text-gray-600">Gerencie preços e disponibilidade dos produtos</p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Ações em Massa */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={selectAll}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          {selectedIds.size === produtos.length ? '☐ Desselecionar Todos' : '☑️ Selecionar Todos'}
        </button>

        {selectedIds.size > 0 && (
          <>
            <button
              onClick={() => setShowAjusteModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ajustar Preços ({selectedIds.size})
              </span>
            </button>

            <button
              onClick={() => toggleAtivoEmMassa(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              ✓ Ativar ({selectedIds.size})
            </button>

            <button
              onClick={() => toggleAtivoEmMassa(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              ✕ Desativar ({selectedIds.size})
            </button>
          </>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total de Produtos</div>
          <div className="text-2xl font-bold text-gray-800">{produtos.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Ativos no Site</div>
          <div className="text-2xl font-bold text-green-600">
            {produtos.filter(p => p.ativo_no_site).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Com Preço Ajustado</div>
          <div className="text-2xl font-bold text-indigo-600">
            {produtos.filter(p => p.ajuste_tipo !== null).length}
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto vinculado ainda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {produtosFiltrados.map((produto) => (
            <div key={produto.produto_franqueada_id} className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(produto.produto_franqueada_id)}
                  onChange={() => toggleSelect(produto.produto_franqueada_id)}
                  className="mt-1 w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />

                {/* Imagem */}
                {produto.imagem ? (
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={produto.imagem}
                      alt={produto.nome}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}

                {/* Informações */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">{produto.nome}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Preço Base:</span>
                      <p className="font-medium text-gray-800">R$ {produto.preco_base.toFixed(2)}</p>
                    </div>
                    
                    {produto.ajuste_tipo && (
                      <div>
                        <span className="text-gray-600">Ajuste:</span>
                        <p className="font-medium text-indigo-600">
                          {produto.ajuste_tipo === 'porcentagem' 
                            ? `+${produto.ajuste_valor}%`
                            : `+R$ ${produto.ajuste_valor?.toFixed(2)}`
                          }
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-gray-600">Meu Preço:</span>
                      <p className="font-medium text-green-600">R$ {produto.preco_final.toFixed(2)}</p>
                    </div>

                    <div>
                      <span className="text-gray-600">Estoque:</span>
                      <p className="font-medium text-gray-800">{produto.estoque}</p>
                    </div>
                  </div>
                </div>

                {/* Status e Ações */}
                <div className="flex flex-col gap-2">
                  {produto.ativo_no_site ? (
                    <button
                      onClick={() => toggleAtivo(produto.produto_franqueada_id, false)}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                    >
                      ✓ Ativo no Site
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleAtivo(produto.produto_franqueada_id, true)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      ✕ Inativo
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Ajuste de Preços */}
      {showAjusteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Ajustar Preços em Massa
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ajuste:
                </label>
                <select
                  value={ajusteTipo}
                  onChange={(e) => setAjusteTipo(e.target.value as 'fixo' | 'porcentagem')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="porcentagem">Porcentagem (%)</option>
                  <option value="fixo">Valor Fixo (R$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ajusteTipo === 'porcentagem' ? 'Porcentagem de Aumento (%)' : 'Valor a Adicionar (R$)'}:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ajusteValor}
                  onChange={(e) => setAjusteValor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={ajusteTipo === 'porcentagem' ? 'Ex: 20' : 'Ex: 10.00'}
                />
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg text-sm">
                <p className="text-gray-700"><strong>Produtos selecionados:</strong> {selectedIds.size}</p>
                <p className="mt-1 text-gray-600">
                  {ajusteTipo === 'porcentagem' 
                    ? `Os preços serão aumentados em ${ajusteValor || '0'}%`
                    : `Será adicionado R$ ${ajusteValor || '0.00'} ao preço base`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAjusteModal(false);
                  setAjusteValor('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarAjuste}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
