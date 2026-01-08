"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import TabelaProdutosFranqueada, { type ProdutoFranqueada } from '@/components/franqueada/TabelaProdutosFranqueada';
import FiltrosProdutosFranqueada, { type FiltrosProdutos } from '@/components/franqueada/FiltrosProdutosFranqueada';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { Package, DollarSign, CheckCircle, TrendingUp, Loader2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

type SortField = 'nome' | 'preco_final' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function FranqueadaProdutosPage() {
  // Estados
  const [produtos, setProdutos] = useState<ProdutoFranqueada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Estados de ordenação
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosProdutos>({
    busca: '',
    statusAtivacao: 'todos',
    statusEstoque: 'todos',
    statusMargem: 'todos',
    produtosNovos: false,
    precoMin: '',
    precoMax: ''
  });

  // Estados de ações em massa
  const [showModalMargem, setShowModalMargem] = useState(false);
  const [margemMassa, setMargemMassa] = useState('');
  const [processando, setProcessando] = useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(filtros.busca, 500);

  // Carregar produtos
  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await createClient().auth.getUser();
      if (!user) {
        console.log('[produtos] Usuário não autenticado');
        setLoading(false);
        return;
      }

      // Buscar franqueada
      const { data: franqueada, error: franqueadaError } = await createClient()
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (franqueadaError || !franqueada) {
        console.error('[produtos] Erro ao buscar franqueada:', franqueadaError);
        setLoading(false);
        return;
      }

      // Construir query base
      const query = createClient()
        .from('produtos_franqueadas')
        .select(`
          id,
          produto_id,
          produtos:produto_id (
            id,
            nome,
            preco_base,
            estoque,
            ativo,
            imagem,
            imagens,
            created_at
          )
        `)
        .eq('franqueada_id', franqueada.id);

      const { data: vinculacoes, error: vinculacoesError } = await query;

      if (vinculacoesError) {
        console.error('[produtos] Erro ao buscar vinculações:', {
          message: vinculacoesError.message,
          details: vinculacoesError.details,
          hint: vinculacoesError.hint,
          code: vinculacoesError.code
        });
        setLoading(false);
        return;
      }

      if (!vinculacoes || vinculacoes.length === 0) {
        setProdutos([]);
        setLoading(false);
        return;
      }

      // Buscar preços personalizados
      const vinculacaoIds = vinculacoes.map(v => v.id);
      const { data: precos, error: precosError } = await createClient()
        .from('produtos_franqueadas_precos')
        .select('*')
        .in('produto_franqueada_id', vinculacaoIds);

      if (precosError) {
        console.error('[produtos] Erro ao buscar preços:', precosError);
      }

      // Formatar produtos - FILTRAR apenas ativos no admin e com estoque
      const produtosFormatados: ProdutoFranqueada[] = vinculacoes
        .map(v => {
          const produtoData = Array.isArray(v.produtos) ? v.produtos[0] : v.produtos;
          const produto = produtoData as unknown as { 
            id: number; 
            nome: string; 
            preco_base: number; 
            estoque: number; 
            ativo: boolean;
            imagem: string | null;
            imagens: string[] | null;
            created_at?: string;
          } | null;
          
          // ✅ CORREÇÃO: Mostrar TODOS os produtos, controlar na interface
          if (!produto) return null;

          const preco = precos?.find(p => p.produto_franqueada_id === v.id);

          // Processar imagens - garantir que seja sempre array
          let imagensArray: string[] = [];
          if (produto.imagens) {
            if (Array.isArray(produto.imagens)) {
              imagensArray = produto.imagens.filter(img => typeof img === 'string');
            } else if (typeof produto.imagens === 'string') {
              try {
                const parsed = JSON.parse(produto.imagens);
                if (Array.isArray(parsed)) {
                  imagensArray = parsed.filter(img => typeof img === 'string');
                }
              } catch {
                // Se falhar ao parsear, usar como string única
                imagensArray = [produto.imagens];
              }
            }
          }
          
          // Se não tem imagens no array, usar imagem única como fallback
          if (imagensArray.length === 0 && produto.imagem) {
            imagensArray = [produto.imagem];
          }

          // Calcular status de estoque
          const estoqueStatus = produto.estoque > 0 ? 'disponivel' : 'esgotado';

          // Calcular preço final
          let precoFinal = produto.preco_base;
          let margemPercentual = preco?.ajuste_valor || null;

          if (preco) {
            if (preco.ajuste_tipo === 'porcentagem' && preco.ajuste_valor) {
              margemPercentual = preco.ajuste_valor;
              precoFinal = produto.preco_base * (1 + preco.ajuste_valor / 100);
            } else if (preco.ajuste_tipo === 'fixo' && preco.ajuste_valor) {
              precoFinal = produto.preco_base + preco.ajuste_valor;
              // Converter ajuste fixo para percentual para exibição
              margemPercentual = ((preco.ajuste_valor / produto.preco_base) * 100);
            } else {
              precoFinal = preco.preco_final || produto.preco_base;
            }
          }

          return {
            id: String(produto.id),
            produto_franqueada_id: v.id,
            nome: produto.nome,
            preco_base: produto.preco_base || 0,
            margem_percentual: margemPercentual,
            preco_final: precoFinal,
            ativo_no_site: preco?.ativo_no_site || false,
            estoque: produto.estoque || 0,
            estoque_status: estoqueStatus as 'disponivel' | 'esgotado',
            imagem: produto.imagem,
            imagens: imagensArray,
            created_at: produto.created_at ?? new Date().toISOString(),
            produto_ativo: produto.ativo,
            // ✅ CORREÇÃO: Só pode ativar se tiver estoque E estiver ativo no admin
            pode_ativar: produto.ativo && produto.estoque > 0
          } as ProdutoFranqueada;
        })
        .filter((p): p is ProdutoFranqueada => p !== null && 'id' in p);

      setProdutos(produtosFormatados);
    } catch (err) {
      console.error('[produtos] Erro ao carregar dados:', {
        error: err,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        stack: err instanceof Error ? err.stack : undefined
      });
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar produtos no mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.error('[produtos] TIMEOUT: Forçando setLoading(false)');
      setLoading(false);
    }, 10000);

    carregarProdutos().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, [carregarProdutos]);

  // Filtrar e ordenar produtos
  const produtosFiltrados = useMemo(() => {
    let resultado = [...produtos];

    // Filtro de busca
    if (buscaDebounced) {
      const termo = buscaDebounced.toLowerCase();
      resultado = resultado.filter(p => 
        p.nome.toLowerCase().includes(termo) ||
        p.id.toLowerCase().includes(termo)
      );
    }

    // Filtro de status de ativação
    if (filtros.statusAtivacao !== 'todos') {
      resultado = resultado.filter(p => 
        filtros.statusAtivacao === 'ativo' 
          ? p.ativo_no_site 
          : !p.ativo_no_site
      );
    }

    // Filtro de estoque
    if (filtros.statusEstoque !== 'todos') {
      resultado = resultado.filter(p => p.estoque_status === filtros.statusEstoque);
    }

    // Filtro de margem
    if (filtros.statusMargem !== 'todos') {
      resultado = resultado.filter(p => 
        filtros.statusMargem === 'configurada'
          ? p.margem_percentual !== null && p.margem_percentual > 0
          : p.margem_percentual === null || p.margem_percentual === 0
      );
    }

    // Filtro de produtos novos (últimos 30 dias)
    if (filtros.produtosNovos) {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      resultado = resultado.filter(p => {
        if (!p.created_at) return false;
        return new Date(p.created_at) >= dataLimite;
      });
    }

    // Filtro de faixa de preço
    if (filtros.precoMin) {
      const min = parseFloat(filtros.precoMin);
      resultado = resultado.filter(p => p.preco_final >= min);
    }
    if (filtros.precoMax) {
      const max = parseFloat(filtros.precoMax);
      resultado = resultado.filter(p => p.preco_final <= max);
    }

    // Ordenação
    resultado.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'nome') {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortBy === 'preco_final') {
        comparison = a.preco_final - b.preco_final;
      } else if (sortBy === 'created_at') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return resultado;
  }, [produtos, buscaDebounced, filtros, sortBy, sortDirection]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === produtosFiltrados.length && produtosFiltrados.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(produtosFiltrados.map(p => p.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleToggleStatus = async (produto: ProdutoFranqueada) => {
    // Nao permitir ativar se o produto estiver desativado ou sem estoque
    if (!produto.ativo_no_site && !produto.pode_ativar) {
      toast.error('Este produto nao pode ser ativado', {
        description: !produto.produto_ativo ? 'Produto desativado pela C4' : 'Sem estoque disponivel'
      });
      return;
    }

    // Se for ativar, verificar se tem margem configurada
    if (!produto.ativo_no_site && (produto.margem_percentual === null || produto.margem_percentual === 0)) {
      toast.warning('Configure a margem de lucro antes de ativar o produto');
      return;
    }

    try {
      const novoStatus = !produto.ativo_no_site;

      // Atualizar ou criar registro de preco
      await createClient()
        .from('produtos_franqueadas_precos')
        .upsert({
          produto_franqueada_id: produto.produto_franqueada_id,
          preco_base: produto.preco_base,
          ajuste_tipo: produto.margem_percentual ? 'porcentagem' : null,
          ajuste_valor: produto.margem_percentual,
          preco_final: produto.preco_final,
          ativo_no_site: novoStatus,
          atualizado_em: new Date().toISOString()
        }, { onConflict: 'produto_franqueada_id' });

      // Recarregar produtos
      await carregarProdutos();
      toast.success(novoStatus ? 'Produto ativado' : 'Produto desativado');
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao alterar status do produto');
    }
  };

  const handleMargemChange = async (produtoId: string, margem: number | null) => {
    try {
      const produto = produtos.find(p => p.id === produtoId);
      if (!produto) return;

      // Calcular novo preco final
      const novoPrecoFinal = margem 
        ? produto.preco_base * (1 + margem / 100)
        : produto.preco_base;

      // Atualizar ou criar registro de preco
      await createClient()
        .from('produtos_franqueadas_precos')
        .upsert({
          produto_franqueada_id: produto.produto_franqueada_id,
          preco_base: produto.preco_base,
          ajuste_tipo: margem ? 'porcentagem' : null,
          ajuste_valor: margem,
          preco_final: novoPrecoFinal,
          ativo_no_site: produto.ativo_no_site,
          atualizado_em: new Date().toISOString()
        }, { onConflict: 'produto_franqueada_id' });

      // Recarregar produtos
      await carregarProdutos();
      toast.success('Margem atualizada com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar margem:', err);
      toast.error('Erro ao atualizar margem');
    }
  };

  const handleFiltrosChange = (novosFiltros: Partial<FiltrosProdutos>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  const handleLimparFiltros = () => {
    setFiltros({
      busca: '',
      statusAtivacao: 'todos',
      statusEstoque: 'todos',
      statusMargem: 'todos',
      produtosNovos: false,
      precoMin: '',
      precoMax: ''
    });
  };

  // Ações em massa
  const handleAtivarSelecionados = async () => {
    if (selectedIds.size === 0) {
      toast.warning('Selecione pelo menos um produto');
      return;
    }

    const produtosSelecionados = produtosFiltrados.filter(p => selectedIds.has(p.id));
    const semMargem = produtosSelecionados.filter(p => !p.margem_percentual || p.margem_percentual === 0);
    const naoDisponiveis = produtosSelecionados.filter(p => !p.pode_ativar);

    if (semMargem.length > 0) {
      toast.warning(`${semMargem.length} produto(s) sem margem configurada. Configure a margem antes de ativar.`);
      return;
    }

    if (naoDisponiveis.length > 0) {
      toast.warning(`${naoDisponiveis.length} produto(s) não podem ser ativados (desativados pela C4 ou sem estoque).`);
      return;
    }

    setProcessando(true);
    try {
      for (const produto of produtosSelecionados) {
        await createClient()
          .from('produtos_franqueadas_precos')
          .upsert({
            produto_franqueada_id: produto.produto_franqueada_id,
            preco_base: produto.preco_base,
            ajuste_tipo: 'porcentagem',
            ajuste_valor: produto.margem_percentual,
            preco_final: produto.preco_final,
            ativo_no_site: true,
            atualizado_em: new Date().toISOString()
          }, { onConflict: 'produto_franqueada_id' });
      }

      toast.success(`${produtosSelecionados.length} produto(s) ativado(s) com sucesso`);
      setSelectedIds(new Set());
      await carregarProdutos();
    } catch (err) {
      console.error('Erro ao ativar produtos:', err);
      toast.error('Erro ao ativar produtos');
    } finally {
      setProcessando(false);
    }
  };

  const handleDesativarSelecionados = async () => {
    if (selectedIds.size === 0) {
      toast.warning('Selecione pelo menos um produto');
      return;
    }

    const produtosSelecionados = produtosFiltrados.filter(p => selectedIds.has(p.id));

    setProcessando(true);
    try {
      for (const produto of produtosSelecionados) {
        await createClient()
          .from('produtos_franqueadas_precos')
          .update({ 
            ativo_no_site: false,
            atualizado_em: new Date().toISOString()
          })
          .eq('produto_franqueada_id', produto.produto_franqueada_id);
      }

      toast.success(`${produtosSelecionados.length} produto(s) desativado(s) com sucesso`);
      setSelectedIds(new Set());
      await carregarProdutos();
    } catch (err) {
      console.error('Erro ao desativar produtos:', err);
      toast.error('Erro ao desativar produtos');
    } finally {
      setProcessando(false);
    }
  };

  const handleAplicarMargemMassa = async () => {
    if (selectedIds.size === 0) {
      toast.warning('Selecione pelo menos um produto');
      return;
    }

    const margem = parseFloat(margemMassa);
    if (isNaN(margem) || margem < 0 || margem > 1000) {
      toast.warning('Digite uma margem válida (0 a 1000%)');
      return;
    }

    const produtosSelecionados = produtosFiltrados.filter(p => selectedIds.has(p.id));

    setProcessando(true);
    try {
      for (const produto of produtosSelecionados) {
        const novoPrecoFinal = produto.preco_base * (1 + margem / 100);

        await createClient()
          .from('produtos_franqueadas_precos')
          .upsert({
            produto_franqueada_id: produto.produto_franqueada_id,
            preco_base: produto.preco_base,
            ajuste_tipo: 'porcentagem',
            ajuste_valor: margem,
            preco_final: novoPrecoFinal,
            ativo_no_site: produto.ativo_no_site,
            atualizado_em: new Date().toISOString()
          }, { onConflict: 'produto_franqueada_id' });
      }

      toast.success(`Margem de ${margem}% aplicada a ${produtosSelecionados.length} produto(s)`);
      setShowModalMargem(false);
      setMargemMassa('');
      setSelectedIds(new Set());
      await carregarProdutos();
    } catch (err) {
      console.error('Erro ao aplicar margem:', err);
      toast.error('Erro ao aplicar margem');
    } finally {
      setProcessando(false);
    }
  };

  // Estatísticas
  const stats = useMemo(() => ({
    total: produtos.length,
    semMargem: produtos.filter(p => !p.margem_percentual || p.margem_percentual === 0).length,
    prontosAtivar: produtos.filter(p => !p.ativo_no_site && p.pode_ativar && p.margem_percentual && p.margem_percentual > 0).length,
    ativos: produtos.filter(p => p.ativo_no_site).length
  }), [produtos]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabecalho */}
      <PageHeader
        title="Produtos"
        subtitle="Gerencie margens de lucro e disponibilidade dos produtos na sua loja"
        icon={Package}
      />

      {/* Estatisticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Produtos"
          value={stats.total}
          icon={Package}
          iconColor="blue"
        />
        <StatCard
          title="Sem Margem"
          value={stats.semMargem}
          subtitle="Precisam de configuracao"
          icon={AlertCircle}
          iconColor="yellow"
        />
        <StatCard
          title="Prontos para Ativar"
          value={stats.prontosAtivar}
          icon={TrendingUp}
          iconColor="purple"
        />
        <StatCard
          title="Ativos no Site"
          value={stats.ativos}
          icon={CheckCircle}
          iconColor="green"
        />
      </div>

      {/* Ações em Massa */}
      {selectedIds.size > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-pink-900">
              {selectedIds.size} produto(s) selecionado(s)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAtivarSelecionados}
                disabled={processando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Ativar
                  </>
                )}
              </button>

              <button
                onClick={handleDesativarSelecionados}
                disabled={processando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Desativar
              </button>

              <button
                onClick={() => setShowModalMargem(true)}
                disabled={processando}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Aplicar Margem
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <FiltrosProdutosFranqueada
        filtros={filtros}
        onFiltrosChange={handleFiltrosChange}
        onLimparFiltros={handleLimparFiltros}
        totalProdutos={produtos.length}
        produtosFiltrados={produtosFiltrados.length}
        buscando={loading}
      />

      {/* Tabela */}
      <TabelaProdutosFranqueada
        produtos={produtosFiltrados}
        loading={loading}
        selectedIds={selectedIds}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onToggleStatus={handleToggleStatus}
        onMargemChange={handleMargemChange}
      />

      {/* Modal Aplicar Margem em Massa */}
      {showModalMargem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Aplicar Margem em Massa
            </h3>
            <p className="text-gray-600 mb-4">
              Esta margem será aplicada a todos os {selectedIds.size} produto(s) selecionado(s).
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem de Lucro (%)
              </label>
              <input
                type="number"
                value={margemMassa}
                onChange={(e) => setMargemMassa(e.target.value)}
                placeholder="Ex: 50"
                min="0"
                max="1000"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite um valor entre 0 e 1000%
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAplicarMargemMassa}
                disabled={processando}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processando ? 'Aplicando...' : 'Aplicar'}
              </button>
              <button
                onClick={() => {
                  setShowModalMargem(false);
                  setMargemMassa('');
                }}
                disabled={processando}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
