"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Package, DollarSign, CheckCircle, TrendingUp, Loader2, 
  Search, Filter, X, MoreVertical, Eye, 
  EyeOff, Percent 
} from 'lucide-react';
import Image from 'next/image';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (revendedoraError) throw revendedoraError;
      if (!revendedora) throw new Error('Revendedora não encontrada');

      setRevendedoraId(revendedora.id);

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

      // 3. Buscar detalhes dos produtos - APENAS produtos ATIVOS no admin
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, preco_base, imagem, categorias, ativo, estoque')
        .in('id', produtoIds)
        .eq('ativo', true) // Só mostrar produtos ativos no admin
        .gt('estoque', 0)  // Só mostrar produtos com estoque
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

  // Filtrar produtos
  const categorias = ['todas', ...new Set(produtos.map(p => p.categorias))];

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
    comEstoque: produtos.filter(p => p.estoque > 0).length
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Meus Produtos</h1>
        <p className="text-gray-600">Gerencie seus produtos, margens e preços</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inativos}</p>
            </div>
            <X className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Com Estoque</p>
              <p className="text-2xl font-bold text-blue-600">{stats.comEstoque}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Ações em Massa */}
      {selectedIds.size > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
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

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Ações
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
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
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
    </div>
  );
}
