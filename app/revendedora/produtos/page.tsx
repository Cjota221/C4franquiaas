"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Package, DollarSign, CheckCircle, TrendingUp, Loader2, 
  Search, Filter, X, Eye, 
  EyeOff, Percent, ChevronDown, ChevronUp, Link2, Check, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import VideoTutorialButton from '@/components/VideoTutorialButton';

interface Produto {
  id: string;
  nome: string;
  preco_base: number;
  imagem: string | null;
  categorias: string;
  ativo: boolean;
  estoque: number;
}

interface ProdutoComMargem extends Produto {
  margin_percent: number;
  is_active: boolean;
  preco_final: number;
}

type SortField = 'nome' | 'preco_final' | 'margin_percent';
type SortDirection = 'asc' | 'desc';

export default function ProdutosRevendedoraPage() {
  const supabase = createClient();
  
  // Estados principais
  const [produtos, setProdutos] = useState<ProdutoComMargem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revendedoraId, setRevendedoraId] = useState<string | null>(null);
  const [revendedoraSlug, setRevendedoraSlug] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  
  // Estados de filtros
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [estoqueFiltro, setEstoqueFiltro] = useState<'todos' | 'disponivel' | 'esgotado'>('todos');
  
  // Estados de ordenação
  const [sortBy] = useState<SortField>('nome');
  const [sortDirection] = useState<SortDirection>('asc');
  
  // Estados de modal e ações em massa
  const [showModalMargem, setShowModalMargem] = useState(false);
  const [margemTipo, setMargemTipo] = useState<'porcentagem' | 'reais'>('porcentagem');
  const [margemValor, setMargemValor] = useState('');
  const [processando, setProcessando] = useState(false);
  
  // Estado para filtros colapsáveis no mobile
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  
  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Carregar produtos
  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Obter ID da revendedora
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: revendedora, error: revendedoraError } = await supabase
        .from('resellers')
        .select('id, slug, store_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (revendedoraError) throw revendedoraError;
      if (!revendedora) throw new Error('Revendedora não encontrada');

      setRevendedoraId(revendedora.id);
      setRevendedoraSlug(revendedora.slug);

      // 🆕 Atualizar título da página para Google Analytics
      document.title = `Produtos - ${revendedora.store_name} | C4 Franquias`;

      // 2. Buscar produtos vinculados
      const { data: vinculacoes, error: vinculacoesError } = await supabase
        .from('reseller_products')
        .select('product_id, margin_percent, is_active')
        .eq('reseller_id', revendedora.id);

      if (vinculacoesError) throw vinculacoesError;

      const produtoIds = vinculacoes?.map(v => v.product_id) || [];
      
      if (produtoIds.length === 0) {
        setProdutos([]);
        return;
      }

      // 3. Buscar detalhes dos produtos - TODOS produtos vinculados
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, preco_base, imagem, categorias, ativo, estoque')
        .in('id', produtoIds)
        .eq('ativo', true) // Só mostrar produtos ativos no ADMIN (aprovados)
        .order('nome');

      if (produtosError) throw produtosError;

      // 4. Combinar dados
      const produtosComMargem: ProdutoComMargem[] = (produtosData || []).map(produto => {
        const vinculacao = vinculacoes?.find(v => v.product_id === produto.id);
        const marginPercent = vinculacao?.margin_percent ?? 0;
        const precoBase = produto.preco_base ?? 0;
        const precoFinal = precoBase * (1 + marginPercent / 100);

        return {
          ...produto,
          preco_base: precoBase,
          margin_percent: marginPercent,
          is_active: vinculacao?.is_active ?? false,
          preco_final: precoFinal,
          estoque: produto.estoque ?? 0
        };
      });

      setProdutos(produtosComMargem);
    } catch (error: unknown) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar produtos. Verifique o console.');
    } finally {
      setLoading(false);
    }
  }

  // Alternar ativação individual
  async function toggleAtivacao(produtoId: string) {
    if (!revendedoraId) return;

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    try {
      const { error } = await supabase
        .from('reseller_products')
        .update({ is_active: !produto.is_active })
        .eq('reseller_id', revendedoraId)
        .eq('product_id', produtoId);

      if (error) throw error;

      setProdutos(produtos.map(p => 
        p.id === produtoId ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (error) {
      console.error('Erro ao alternar ativação:', error);
      alert('Erro ao alternar ativação do produto');
    }
  }

  // Aplicar margem em massa
  async function aplicarMargemEmMassa() {
    if (!revendedoraId || selectedIds.size === 0 || !margemValor) return;

    const valor = parseFloat(margemValor);
    if (isNaN(valor)) {
      alert('Valor inválido');
      return;
    }

    setProcessando(true);
    try {
      // Calcular margem percentual
      let marginPercent = valor;
      
      if (margemTipo === 'reais') {
        // Converter reais para percentual baseado no preço médio
        const produtosSelecionados = produtos.filter(p => selectedIds.has(p.id));
        const precoMedio = produtosSelecionados.reduce((acc, p) => acc + p.preco_base, 0) / produtosSelecionados.length;
        marginPercent = (valor / precoMedio) * 100;
      }

      // Atualizar cada produto selecionado
      const updates = Array.from(selectedIds).map(productId => 
        supabase
          .from('reseller_products')
          .update({ margin_percent: marginPercent })
          .eq('reseller_id', revendedoraId)
          .eq('product_id', productId)
      );

      await Promise.all(updates);

      // Recarregar dados
      await carregarDados();
      
      setShowModalMargem(false);
      setMargemValor('');
      setSelectedIds(new Set());
      
      alert(`Margem aplicada com sucesso em ${selectedIds.size} produtos!`);
    } catch (error) {
      console.error('Erro ao aplicar margem:', error);
      alert('Erro ao aplicar margem');
    } finally {
      setProcessando(false);
    }
  }

  // Ativar/desativar em massa
  async function toggleAtivacaoEmMassa(ativar: boolean) {
    if (!revendedoraId || selectedIds.size === 0) return;

    setProcessando(true);
    try {
      const updates = Array.from(selectedIds).map(productId => 
        supabase
          .from('reseller_products')
          .update({ is_active: ativar })
          .eq('reseller_id', revendedoraId)
          .eq('product_id', productId)
      );

      await Promise.all(updates);
      await carregarDados();
      setSelectedIds(new Set());
      
      alert(`${selectedIds.size} produtos ${ativar ? 'ativados' : 'desativados'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status dos produtos');
    } finally {
      setProcessando(false);
    }
  }

  // Copiar link do produto
  function copiarLinkProduto(produtoId: string) {
    if (!revendedoraSlug) {
      alert('Configure seu catálogo primeiro!');
      return;
    }

    const url = `${window.location.origin}/catalogo/${revendedoraSlug}/produto/${produtoId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedProductId(produtoId);
      setTimeout(() => setCopiedProductId(null), 2000);
    }).catch(() => {
      alert('Erro ao copiar link');
    });
  }

  // Filtrar produtos
  const categorias = ['todas', ...new Set(produtos.map(p => p.categorias))];

  // 🆕 Identificar produtos novos (desativados + sem margem ou margem zero)
  const produtosNovos = produtos.filter(p => 
    !p.is_active && (p.margin_percent === 0 || p.margin_percent === null || p.margin_percent === undefined)
  );

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(buscaDebounced.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || p.categorias === categoriaFiltro;
    const matchStatus = statusFiltro === 'todos' || 
      (statusFiltro === 'ativo' && p.is_active) ||
      (statusFiltro === 'inativo' && !p.is_active);
    const matchEstoque = estoqueFiltro === 'todos' ||
      (estoqueFiltro === 'disponivel' && p.estoque > 0) ||
      (estoqueFiltro === 'esgotado' && p.estoque === 0);
    
    return matchBusca && matchCategoria && matchStatus && matchEstoque;
  });

  // Ordenar produtos
  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'nome') {
      comparison = a.nome.localeCompare(b.nome);
    } else if (sortBy === 'preco_final') {
      comparison = a.preco_final - b.preco_final;
    } else if (sortBy === 'margin_percent') {
      comparison = a.margin_percent - b.margin_percent;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Estatísticas
  const stats = {
    total: produtos.length,
    ativos: produtos.filter(p => p.is_active).length,
    inativos: produtos.filter(p => !p.is_active).length,
    comEstoque: produtos.filter(p => p.estoque > 0).length,
    novos: produtosNovos.length
  };

  // Selecionar/desselecionar todos
  const toggleSelectAll = () => {
    if (selectedIds.size === produtosOrdenados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(produtosOrdenados.map(p => p.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">Meus Produtos</h1>
        <p className="text-sm md:text-base text-gray-600">Gerencie seus produtos, margens e preços</p>
      </div>

      {/* Cards de Estatísticas - 2x2 no mobile, 4 colunas no desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Ativos</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{stats.ativos}</p>
            </div>
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Inativos</p>
              <p className="text-xl md:text-2xl font-bold text-gray-600">{stats.inativos}</p>
            </div>
            <X className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Com Estoque</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.comEstoque}</p>
            </div>
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* 🆕 Card de Produtos Novos (se houver) */}
      {stats.novos > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-lg md:text-xl font-bold">Produtos Novos Chegaram!</h2>
              </div>
              <p className="text-sm md:text-base text-purple-100 mb-4">
                {stats.novos} {stats.novos === 1 ? 'produto novo precisa' : 'produtos novos precisam'} da sua atenção. 
                {stats.novos === 1 ? 'Ele está' : 'Eles estão'} desativado{stats.novos > 1 ? 's' : ''} e aguardando que você defina sua margem de lucro!
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setStatusFiltro('inativo');
                    setFiltrosAbertos(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Produtos Novos</span>
                </button>
                <button
                  onClick={() => {
                    // Selecionar todos os produtos novos
                    const novoIds = new Set(produtosNovos.map(p => p.id));
                    setSelectedIds(novoIds);
                    setShowModalMargem(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Definir Margem em Massa</span>
                </button>
              </div>
            </div>
            <div className="ml-4 bg-white/20 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
              <span className="text-3xl md:text-4xl font-black">{stats.novos}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros - Colapsável no Mobile */}
      <div className="bg-white rounded-lg shadow mb-4 md:mb-6">
        {/* Header dos filtros - clicável no mobile */}
        <button
          onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          className="w-full flex items-center justify-between p-4 md:cursor-default"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            {/* Indicador de filtros ativos */}
            {(busca || categoriaFiltro !== 'todas' || statusFiltro !== 'todos' || estoqueFiltro !== 'todos') && (
              <span className="bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">
                Ativos
              </span>
            )}
          </div>
          <div className="md:hidden">
            {filtrosAbertos ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </button>

        {/* Conteúdo dos filtros - sempre visível no desktop, colapsável no mobile */}
        <div className={`${filtrosAbertos ? 'block' : 'hidden'} md:block px-4 pb-4`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {/* Busca */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome do produto..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {categorias.map((cat, index) => (
                  <option key={cat || `cat-${index}`} value={cat}>{cat || 'Sem categoria'}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value as 'todos' | 'ativo' | 'inativo')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>

            {/* Estoque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque
              </label>
              <select
                value={estoqueFiltro}
                onChange={(e) => setEstoqueFiltro(e.target.value as 'todos' | 'disponivel' | 'esgotado')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="todos">Todos</option>
                <option value="disponivel">Disponível</option>
                <option value="esgotado">Esgotado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ações em Massa - Desktop */}
      {selectedIds.size > 0 && (
        <div className="hidden md:block bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="font-medium text-gray-900">
                {selectedIds.size} produto{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Limpar seleção
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleAtivacaoEmMassa(true)}
                disabled={processando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ativar
              </button>

              <button
                onClick={() => toggleAtivacaoEmMassa(false)}
                disabled={processando}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Desativar
              </button>

              <button
                onClick={() => setShowModalMargem(true)}
                disabled={processando}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Percent className="w-4 h-4" />
                Aplicar Margem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Produtos - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === produtosOrdenados.length && produtosOrdenados.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Preço Base
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Margem
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Preço Final
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estoque
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Compartilhar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {produtosOrdenados.map(produto => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(produto.id)}
                      onChange={() => {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(produto.id)) {
                          newSet.delete(produto.id);
                        } else {
                          newSet.add(produto.id);
                        }
                        setSelectedIds(newSet);
                      }}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {produto.imagem ? (
                        <Image
                          src={produto.imagem}
                          alt={produto.nome}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{produto.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {produto.categorias}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    R$ {(produto.preco_base ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {(produto.margin_percent ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    R$ {(produto.preco_final ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (produto.estoque ?? 0) > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {produto.estoque ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleAtivacao(produto.id)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        produto.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {produto.is_active ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => copiarLinkProduto(produto.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
                      title="Copiar link do produto"
                    >
                      {copiedProductId === produto.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {produtosOrdenados.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Lista de Produtos - Mobile (Cards) */}
      <div className="md:hidden space-y-3">
        {/* Header com Selecionar Todos */}
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={selectedIds.size === produtosOrdenados.length && produtosOrdenados.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            Selecionar todos
          </label>
          <p className="text-sm text-gray-500">{produtosOrdenados.length} produtos</p>
        </div>

        {/* Cards de Produtos */}
        {produtosOrdenados.map(produto => (
          <div 
            key={produto.id} 
            className={`bg-white rounded-lg shadow p-4 border-2 transition-colors ${
              selectedIds.has(produto.id) ? 'border-pink-500' : 'border-transparent'
            }`}
          >
            {/* Header do Card: Checkbox + Imagem + Nome + Status */}
            <div className="flex items-start gap-3 mb-3">
              <input
                type="checkbox"
                checked={selectedIds.has(produto.id)}
                onChange={() => {
                  const newSet = new Set(selectedIds);
                  if (newSet.has(produto.id)) {
                    newSet.delete(produto.id);
                  } else {
                    newSet.add(produto.id);
                  }
                  setSelectedIds(newSet);
                }}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 mt-1"
              />
              {produto.imagem ? (
                <Image
                  src={produto.imagem}
                  alt={produto.nome}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                  {produto.nome}
                </h3>
                <p className="text-xs text-gray-500 mt-1 truncate">{produto.categorias}</p>
              </div>
            </div>

            {/* Informações de Preço e Estoque */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-gray-50 rounded-lg py-2 px-1">
                <p className="text-[10px] text-gray-500 uppercase">Base</p>
                <p className="text-sm font-medium text-gray-700">R$ {(produto.preco_base ?? 0).toFixed(2)}</p>
              </div>
              <div className="bg-pink-50 rounded-lg py-2 px-1">
                <p className="text-[10px] text-gray-500 uppercase">Margem</p>
                <p className="text-sm font-bold text-pink-600">{(produto.margin_percent ?? 0).toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 rounded-lg py-2 px-1">
                <p className="text-[10px] text-gray-500 uppercase">Final</p>
                <p className="text-sm font-bold text-green-600">R$ {(produto.preco_final ?? 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Footer: Estoque + Status + Ação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Estoque Badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    (produto.estoque ?? 0) > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(produto.estoque ?? 0) > 0 ? `${produto.estoque} un` : 'Esgotado'}
                  </span>
                </div>

                {/* Botão de Status */}
                <button
                  onClick={() => toggleAtivacao(produto.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                    produto.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {produto.is_active ? (
                    <>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 mr-1" />
                      Inativo
                    </>
                  )}
                </button>
              </div>

              {/* Botão Copiar Link - Full Width */}
              <button 
                onClick={() => copiarLinkProduto(produto.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
              >
                {copiedProductId === produto.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Copiar Link do Produto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {produtosOrdenados.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Barra de Ações em Massa - Mobile (Fixa no Bottom) */}
      {selectedIds.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">
              {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-pink-600 font-medium"
            >
              Limpar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => toggleAtivacaoEmMassa(true)}
              disabled={processando}
              className="flex flex-col items-center justify-center py-2 bg-green-100 text-green-700 rounded-lg disabled:opacity-50"
            >
              <Eye className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Ativar</span>
            </button>
            <button
              onClick={() => toggleAtivacaoEmMassa(false)}
              disabled={processando}
              className="flex flex-col items-center justify-center py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
            >
              <EyeOff className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Desativar</span>
            </button>
            <button
              onClick={() => setShowModalMargem(true)}
              disabled={processando}
              className="flex flex-col items-center justify-center py-2 bg-pink-100 text-pink-700 rounded-lg disabled:opacity-50"
            >
              <Percent className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Margem</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Aplicar Margem */}
      {showModalMargem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Aplicar Margem em Massa
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Aplicar margem em {selectedIds.size} produto{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
              </p>

              {/* Tipo de Margem */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Margem
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMargemTipo('porcentagem')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                      margemTipo === 'porcentagem'
                        ? 'border-pink-600 bg-pink-50 text-pink-600'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    <Percent className="w-5 h-5 mx-auto mb-1" />
                    Porcentagem
                  </button>
                  <button
                    onClick={() => setMargemTipo('reais')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                      margemTipo === 'reais'
                        ? 'border-pink-600 bg-pink-50 text-pink-600'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mx-auto mb-1" />
                    Reais
                  </button>
                </div>
              </div>

              {/* Valor */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Margem
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={margemValor}
                    onChange={(e) => setMargemValor(e.target.value)}
                    placeholder={margemTipo === 'porcentagem' ? 'Ex: 20' : 'Ex: 10.00'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {margemTipo === 'porcentagem' ? '%' : 'R$'}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModalMargem(false);
                    setMargemValor('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={aplicarMargemEmMassa}
                  disabled={processando || !margemValor}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    'Aplicar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Vídeo Tutorial */}
      <VideoTutorialButton pagina="produtos" />
    </div>
  );
}
