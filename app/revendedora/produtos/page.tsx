"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Search, DollarSign, Check, X, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface Produto {
  id: string;
  nome: string;
  preco_base: number;
  imagem_principal: string;
  categoria: string;
  ativo: boolean;
}

interface ProdutoRevendedora {
  product_id: string;
  margin_percent: number;
  is_active: boolean;
}

export default function ProdutosRevendedoraPage() {
  const supabase = createClient();
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosVinculados, setProdutosVinculados] = useState<Map<string, ProdutoRevendedora>>(new Map());
  const [loading, setLoading] = useState(true);
  const [revendedoraId, setRevendedoraId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [apenasAtivos, setApenasAtivos] = useState(false);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Obter ID da revendedora
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 Buscando revendedora para user_id:', user.id);

      const { data: reseller, error: resellerError } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (resellerError) {
        console.error('❌ Erro ao buscar revendedora:', {
          message: resellerError.message,
          details: resellerError.details,
          hint: resellerError.hint,
          code: resellerError.code
        });
        throw new Error(`Erro ao buscar revendedora: ${resellerError.message}`);
      }

      if (!reseller) {
        console.error('❌ Revendedora não encontrada para user_id:', user.id);
        throw new Error('Revendedora não encontrada. Verifique se seu cadastro foi aprovado.');
      }

      console.log('✅ Revendedora encontrada:', reseller.id);
      setRevendedoraId(reseller.id);

      // 2. Buscar produtos vinculados à revendedora
      console.log('🔍 Buscando produtos vinculados para reseller_id:', reseller.id);
      
      const { data: produtosVinculados, error: vinculacaoError } = await supabase
        .from('reseller_products')
        .select('product_id, margin_percent, is_active')
        .eq('reseller_id', reseller.id);

      if (vinculacaoError) {
        console.error('❌ Erro ao buscar produtos vinculados:', {
          message: vinculacaoError.message,
          details: vinculacaoError.details,
          hint: vinculacaoError.hint,
          code: vinculacaoError.code
        });
        
        // Se for erro de permissão RLS
        if (vinculacaoError.code === 'PGRST301' || vinculacaoError.message.includes('permission')) {
          throw new Error('Sem permissão para acessar produtos. Verifique se seu cadastro foi aprovado.');
        }
        
        throw new Error(`Erro ao buscar produtos vinculados: ${vinculacaoError.message}`);
      }

      console.log('📊 Produtos vinculados encontrados:', produtosVinculados?.length || 0);
      
      const produtoIds = produtosVinculados?.map(p => p.product_id) || [];
      
      if (produtoIds.length > 0) {
        console.log('🔑 Primeiros IDs:', produtoIds.slice(0, 5));
      }

      if (produtoIds.length === 0) {
        setProdutos([]);
        setProdutosVinculados(new Map());
        console.log('⚠️ Nenhum produto vinculado encontrado para esta revendedora');
        console.log('💡 Dica: Vincule produtos pelo painel admin em /admin/produtos');
        return;
      }

      // 3. Buscar detalhes dos produtos vinculados
      console.log(`🔍 Buscando detalhes de ${produtoIds.length} produtos...`);
      
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, preco_base, imagem_principal, categoria, ativo')
        .in('id', produtoIds)
        .order('nome');

      if (produtosError) {
        console.error('❌ Erro ao buscar produtos:', {
          message: produtosError.message,
          details: produtosError.details,
          hint: produtosError.hint,
          code: produtosError.code,
          totalIds: produtoIds.length,
          primeirosIds: produtoIds.slice(0, 3)
        });
        throw produtosError;
      }
      
      console.log('✅ Produtos carregados:', produtosData?.length || 0);
      setProdutos(produtosData || []);

      // 4. Criar mapa de produtos vinculados
      const map = new Map<string, ProdutoRevendedora>();
      produtosVinculados?.forEach(v => map.set(v.product_id, v));
      setProdutosVinculados(map);

      console.log('✅ Dados carregados:', {
        produtos: produtosData?.length,
        vinculados: produtosVinculados?.length
      });
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', {
        error: err,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      let mensagem = 'Erro ao carregar produtos';
      let detalhe = 'Recarregue a página ou entre em contato com o suporte.';
      
      if (err instanceof Error) {
        mensagem = err.message;
        
        // Mensagens específicas baseadas no erro
        if (err.message.includes('permission') || err.message.includes('permissão')) {
          detalhe = 'Verifique se seu cadastro de revendedora foi aprovado pelo administrador.';
        } else if (err.message.includes('não encontrada')) {
          detalhe = 'Entre em contato com o administrador para verificar seu cadastro.';
        } else if (err.message.includes('Nenhum produto')) {
          detalhe = 'Aguarde o administrador vincular produtos à sua conta.';
        }
      }
      
      alert(`${mensagem}\n\n${detalhe}`);
    } finally {
      setLoading(false);
    }
  }

  async function toggleProduto(produtoId: string) {
    if (!revendedoraId) return;

    const vinculado = produtosVinculados.get(produtoId);
    
    try {
      if (vinculado) {
        // Atualizar status ativo/inativo
        const { error } = await supabase
          .from('reseller_products')
          .update({ is_active: !vinculado.is_active })
          .eq('reseller_id', revendedoraId)
          .eq('product_id', produtoId);

        if (error) throw error;

        // Atualizar localmente
        const novoMap = new Map(produtosVinculados);
        novoMap.set(produtoId, { ...vinculado, is_active: !vinculado.is_active });
        setProdutosVinculados(novoMap);
      } else {
        // Criar novo vínculo com margem padrão de 20%
        const { error } = await supabase
          .from('reseller_products')
          .insert({
            reseller_id: revendedoraId,
            product_id: produtoId,
            margin_percent: 20,
            is_active: true
          });

        if (error) throw error;

        // Atualizar localmente
        const novoMap = new Map(produtosVinculados);
        novoMap.set(produtoId, { product_id: produtoId, margin_percent: 20, is_active: true });
        setProdutosVinculados(novoMap);
      }

      // Atualizar contador de produtos da revendedora
      await atualizarContador();
    } catch (err) {
      console.error('Erro ao vincular/desvincular produto:', err);
      alert('Erro ao atualizar produto');
    }
  }

  async function atualizarMargem(produtoId: string, novaMargem: number) {
    if (!revendedoraId) return;
    if (novaMargem < 0 || novaMargem > 200) {
      alert('Margem deve estar entre 0% e 200%');
      return;
    }

    try {
      const { error } = await supabase
        .from('reseller_products')
        .update({ margin_percent: novaMargem })
        .eq('reseller_id', revendedoraId)
        .eq('product_id', produtoId);

      if (error) throw error;

      // Atualizar localmente
      const vinculado = produtosVinculados.get(produtoId);
      if (vinculado) {
        const novoMap = new Map(produtosVinculados);
        novoMap.set(produtoId, { ...vinculado, margin_percent: novaMargem });
        setProdutosVinculados(novoMap);
      }
    } catch (err) {
      console.error('Erro ao atualizar margem:', err);
      alert('Erro ao atualizar margem de lucro');
    }
  }

  async function atualizarContador() {
    if (!revendedoraId) return;

    const { count } = await supabase
      .from('reseller_products')
      .select('*', { count: 'exact', head: true })
      .eq('reseller_id', revendedoraId)
      .eq('ativo', true);

    await supabase
      .from('resellers')
      .update({ total_products: count || 0 })
      .eq('id', revendedoraId);
  }

  const categorias = ['todas', ...new Set(produtos.map(p => p.categoria))];

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
    const matchAtivo = !apenasAtivos || produtosVinculados.get(p.id)?.is_active;
    return matchBusca && matchCategoria && matchAtivo;
  });

  const stats = {
    disponiveis: produtos.length,
    vinculados: Array.from(produtosVinculados.values()).length,
    ativos: Array.from(produtosVinculados.values()).filter(v => v.is_active).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
           Meus Produtos
        </h1>
        <p className="text-gray-600">
          Selecione os produtos que deseja revender e defina sua margem de lucro
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Disponíveis</p>
              <p className="text-2xl font-bold text-blue-900">{stats.disponiveis}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Vinculados</p>
              <p className="text-2xl font-bold text-purple-900">{stats.vinculados}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Ativos</p>
              <p className="text-2xl font-bold text-green-900">{stats.ativos}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Categoria */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'todas' ? 'Todas Categorias' : cat}
              </option>
            ))}
          </select>

          {/* Filtro Ativos */}
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <input
              type="checkbox"
              checked={apenasAtivos}
              onChange={(e) => setApenasAtivos(e.target.checked)}
              className="w-4 h-4 text-pink-600 rounded"
            />
            <span className="text-sm text-gray-700">Apenas Ativos</span>
          </label>
        </div>
      </div>

      {/* Lista de Produtos */}
      {produtos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum produto vinculado</h3>
          <p className="text-gray-600 mb-4">
            Você ainda não possui produtos vinculados à sua conta.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>💡 O que fazer?</strong><br/>
              Entre em contato com o administrador para que ele vincule produtos à sua conta de revendedora.
            </p>
          </div>
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Nenhum produto encontrado</p>
          <p className="text-gray-400 text-sm mt-2">Tente ajustar os filtros acima</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtosFiltrados.map(produto => {
            const vinculado = produtosVinculados.get(produto.id);
            const isAtivo = vinculado?.is_active || false;
            const margem = vinculado?.margin_percent || 20;
            const precoBase = produto.preco_base;
            const precoFinal = precoBase * (1 + margem / 100);

            return (
              <div
                key={produto.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-all border-2 ${
                  isAtivo ? 'border-green-500' : 'border-gray-200'
                }`}
              >
                {/* Imagem */}
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  {produto.imagem_principal ? (
                    <Image
                      src={produto.imagem_principal}
                      alt={produto.nome}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Badge Status */}
                  {isAtivo && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Ativo
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {produto.nome}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{produto.categoria}</p>

                  {/* Preços */}
                  <div className="mb-4 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Preço base:</span>
                      <span className="font-medium">R$ {precoBase.toFixed(2)}</span>
                    </div>
                    {vinculado && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Margem:</span>
                          <span className="font-medium text-purple-600">+{margem}%</span>
                        </div>
                        <div className="flex items-center justify-between text-base font-bold">
                          <span className="text-gray-900">Seu preço:</span>
                          <span className="text-green-600">R$ {precoFinal.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Margem de Lucro */}
                  {vinculado && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-600 mb-1">
                        Margem de Lucro (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={margem}
                          onChange={(e) => atualizarMargem(produto.id, Number(e.target.value))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Botão Toggle */}
                  <button
                    onClick={() => toggleProduto(produto.id)}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      isAtivo
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {isAtivo ? (
                      <span className="flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        Desativar
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        {vinculado ? 'Ativar' : 'Adicionar ao Catálogo'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
