"use client";

import React, { useEffect, useState, useCallback } from 'react';

import { useProdutoStore, Produto as ProdutoType } from '@/lib/store/produtoStore';
import { useCategoriaStore } from '@/lib/store/categoriaStore';
import { useStatusStore } from '@/lib/store/statusStore';
import { useModalStore } from '@/lib/store/modalStore';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import ModalCategorias from '@/components/ModalCategorias';
import ModalVincularCategoria from '@/components/ModalVincularCategoria';
import ModalAtualizarPrecos from '@/components/ModalAtualizarPrecos';
import ModalDescricaoGuia from '@/components/admin/ModalDescricaoGuia';
import ModalDescricaoGuiaMassa from '@/components/admin/ModalDescricaoGuiaMassa';
import TabelaProdutos from '@/components/admin/TabelaProdutos';
import FiltrosProdutos from '@/components/admin/FiltrosProdutos';
import { createClient } from '@/lib/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 30;

export default function ProdutosPage(): React.JSX.Element {
  // Store states
  const selectedIds = useProdutoStore((s) => s.selectedIds);
  const setSelectedId = useProdutoStore((s) => s.setSelectedId);
  const clearSelected = useProdutoStore((s) => s.clearSelected);
  const selectAll = useProdutoStore((s) => s.selectAll);
  const setCategoryPanelOpen = useCategoriaStore((s) => s.setCategoryPanelOpen);
  const statusMsg = useStatusStore((s) => s.statusMsg);
  const setStatusMsg = useStatusStore((s) => s.setStatusMsg);
  const toggling = useStatusStore((s) => s.toggling);
  const setToggling = useStatusStore((s) => s.setToggling);
  const clearToggling = useStatusStore((s) => s.clearToggling);
  const openModal = useModalStore((s) => s.openModal);
  const setModalLoading = useModalStore((s) => s.setModalLoading);
  const setModalVariacoes = useModalStore((s) => s.setModalVariacoes);

  // Local states - Produtos
  const [produtosFiltrados, setProdutosFiltrados] = useState<ProdutoType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalProdutos, setTotalProdutos] = useState(0);

  // States - Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [filtroEstoque, setFiltroEstoque] = useState<'todos' | 'disponivel' | 'esgotado'>('todos');
  const [filtroNovos, setFiltroNovos] = useState(false);
  const [precoMin, setPrecoMin] = useState<string>('');
  const [precoMax, setPrecoMax] = useState<string>('');

  // States - Ordenação
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // States - Modais e Ações
  const [showActions, setShowActions] = useState(false);
  const [modalVincularOpen, setModalVincularOpen] = useState(false);
  const [modalAtualizarPrecosOpen, setModalAtualizarPrecosOpen] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [vinculandoFranqueadas, setVinculandoFranqueadas] = useState(false);
  const [vinculandoRevendedoras, setVinculandoRevendedoras] = useState(false);
  
  // State para Modal de Descrição e Guia de Tamanhos
  const [modalDescricaoGuiaOpen, setModalDescricaoGuiaOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<ProdutoType | null>(null);
  
  // State para Modal de Edição em Massa
  const [modalMassaOpen, setModalMassaOpen] = useState(false);

  // State para filtro de produtos não vinculados
  const [filtroNaoVinculados, setFiltroNaoVinculados] = useState(false);
  const [produtosNaoVinculadosIds, setProdutosNaoVinculadosIds] = useState<Set<number | string>>(new Set());
  const [statsVinculacao, setStatsVinculacao] = useState<{
    total_produtos_ativos: number;
    produtos_vinculados: number;
    produtos_nao_vinculados: number;
    total_revendedoras: number;
  } | null>(null);
  const [loadingNaoVinculados, setLoadingNaoVinculados] = useState(false);

  // Outros states
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Calcular filtros ativos
  const filtrosAtivos = [
    searchTerm.trim().length > 0,
    filtroCategoria !== null,
    filtroStatus !== 'todos',
    filtroEstoque !== 'todos',
    filtroNovos,
    precoMin.trim().length > 0,
    precoMax.trim().length > 0,
    filtroNaoVinculados,
  ].filter(Boolean).length;

  // Carregar produtos não vinculados às revendedoras
  const carregarProdutosNaoVinculados = useCallback(async () => {
    try {
      setLoadingNaoVinculados(true);
      const res = await fetch('/api/admin/produtos/nao-vinculados');
      const data = await res.json();
      
      if (data.success) {
        const ids = new Set<number | string>(data.produtos.map((p: { id: number | string }) => p.id));
        setProdutosNaoVinculadosIds(ids);
        setStatsVinculacao(data.stats);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos não vinculados:', err);
    } finally {
      setLoadingNaoVinculados(false);
    }
  }, []);

  // Carregar categorias disponíveis
  const carregarCategorias = useCallback(async () => {
    try {
      const { data, error } = await createClient()
        .from('categorias')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        throw error;
      }
      setCategorias(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);

  // Carregar produtos
  const carregarProdutos = useCallback(async (pag: number, termo: string) => {
    try {
      setLoading(true);
      
      const temBusca = termo.trim().length > 0;
      const from = temBusca ? 0 : (pag - 1) * PAGE_SIZE;
      const to = temBusca ? 9999 : from + PAGE_SIZE - 1;

      let query = createClient()
        .from('produtos')
        .select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens,created_at,description,size_guide', { count: 'exact' });

      // Aplicar filtro de busca
      if (temBusca) {
        query = query.or(`nome.ilike.%${termo}%,id_externo.ilike.%${termo}%`);
      }

      // Aplicar filtro de categoria
      if (filtroCategoria) {
        // Nota: Requer migration para produtos_categorias
        console.log('Filtro de categoria será implementado após migration');
      }

      // Aplicar filtro de status
      if (filtroStatus === 'ativo') {
        query = query.eq('ativo', true);
      } else if (filtroStatus === 'inativo') {
        query = query.eq('ativo', false);
      }

      // Aplicar filtro de estoque
      if (filtroEstoque === 'disponivel') {
        query = query.gt('estoque', 0);
      } else if (filtroEstoque === 'esgotado') {
        query = query.eq('estoque', 0);
      }

      // Aplicar filtro de preço
      if (precoMin) {
        const minValue = parseFloat(precoMin);
        if (!isNaN(minValue)) {
          query = query.gte('preco_base', minValue);
        }
      }
      if (precoMax) {
        const maxValue = parseFloat(precoMax);
        if (!isNaN(maxValue)) {
          query = query.lte('preco_base', maxValue);
        }
      }

      // Aplicar filtro de novos (últimos 7 dias)
      if (filtroNovos && sortBy === 'created_at') {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 7);
        query = query.gte('created_at', dataLimite.toISOString());
      }

      // Aplicar ordenação
      if (sortBy === 'nome') {
        query = query.order('nome', { ascending: sortDirection === 'asc' });
      } else if (sortBy === 'preco_base') {
        query = query.order('preco_base', { ascending: sortDirection === 'asc', nullsFirst: false });
      } else if (sortBy === 'estoque') {
        query = query.order('estoque', { ascending: sortDirection === 'asc' });
      } else if (sortBy === 'ativo') {
        query = query.order('ativo', { ascending: sortDirection === 'asc' });
      } else if (sortBy === 'created_at') {
        query = query.order('created_at', { ascending: sortDirection === 'asc', nullsFirst: false });
      } else if (sortBy === 'id') {
        query = query.order('id', { ascending: sortDirection === 'asc' });
      } else {
        // Fallback: ordenar por created_at desc
        query = query.order('created_at', { ascending: false, nullsFirst: false });
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      // Buscar preços personalizados para identificar produtos novos
      const produtoIds = (data || []).map((r) => r.id);
      let produtosComMargem = new Set<number | string>();
      
      if (produtoIds.length > 0) {
        const { data: precosPersonalizados } = await createClient()
          .from('produtos_franqueadas')
          .select('produto_id')
          .in('produto_id', produtoIds);
        
        produtosComMargem = new Set(precosPersonalizados?.map(p => p.produto_id) || []);
      }

      const mapped: ProdutoType[] = (data || []).map((r) => {
        const id = r.id;
        const id_externo = r.id_externo ?? undefined;
        const nome = r.nome ?? '';
        
        let estoque = 0;
        if (r.estoque !== null && r.estoque !== undefined) {
          if (typeof r.estoque === 'number') {
            estoque = r.estoque;
          } else if (typeof r.estoque === 'object' && r.estoque !== null) {
            const estoqueObj = r.estoque as Record<string, unknown>;
            if ('estoque' in estoqueObj && typeof estoqueObj.estoque === 'number') {
              estoque = estoqueObj.estoque;
            }
          } else if (typeof r.estoque === 'string') {
            const parsed = parseFloat(r.estoque);
            estoque = isNaN(parsed) ? 0 : parsed;
          }
        }
        
        const preco_base = r.preco_base ?? null;
        const ativo = r.ativo ?? false;
        const rawImagem = r.imagem;
        const created_at = r.created_at ?? undefined;
        
        const decodedImagem = rawImagem ? safeDecodeUrl(rawImagem) : null;
        const imagem = decodedImagem
          ? `https://c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image?facilzap=${encodeURIComponent(decodedImagem)}`
          : null;
      
        return {
          id,
          id_externo,
          nome,
          estoque,
          preco_base,
          ativo,
          imagem,
          imagens: r.imagens || undefined,
          estoque_display: estoque,
          created_at,
          categorias: null,
          temMargem: produtosComMargem.has(id),
        };
      });

      setProdutosFiltrados(mapped);
      setTotalProdutos(count || 0);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      
      let errorMessage = 'Erro ao carregar produtos';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const errMsg = String((err as Error).message || '');
        
        if (errMsg.includes('relation') && errMsg.includes('does not exist')) {
          errorMessage = 'Tabela não encontrada. Execute a migração do banco de dados.';
        } else if (errMsg.includes('permission denied')) {
          errorMessage = 'Sem permissão para acessar os dados.';
        } else if (errMsg) {
          errorMessage = `Erro: ${errMsg}`;
        }
      }
      
      setStatusMsg({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria, filtroStatus, filtroEstoque, filtroNovos, precoMin, precoMax, sortBy, sortDirection, setStatusMsg]);

  function safeDecodeUrl(v?: unknown) {
    if (!v) return null;
    const s = String(v);
    try {
      let d = decodeURIComponent(s);
      if (/%25/.test(d) || /%3A/i.test(d) && /%2F/i.test(d)) {
        try { d = decodeURIComponent(d); } catch {}
      }
      return d;
    } catch {
      return s;
    }
  }

  // Carregar na montagem
  useEffect(() => {
    carregarCategorias();
    carregarProdutosNaoVinculados();
  }, [carregarCategorias, carregarProdutosNaoVinculados]);

  useEffect(() => {
    carregarProdutos(pagina, debouncedSearchTerm);
  }, [pagina, debouncedSearchTerm, carregarProdutos]);

  // Indicador de busca
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Reset página ao buscar ou filtrar
  useEffect(() => {
    if (debouncedSearchTerm || filtrosAtivos > 0) {
      setPagina(1);
    }
  }, [debouncedSearchTerm, filtrosAtivos]);

  // Handler de ordenação
  const handleSort = (campo: string) => {
    if (sortBy === campo) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(campo);
      setSortDirection('asc');
    }
  };

  // Handler de seleção em massa
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = produtosFiltrados.map(p => p.id);
      selectAll(ids);
    } else {
      clearSelected();
    }
  };

  // Verificar se todos estão selecionados
  const allSelected = produtosFiltrados.length > 0 && 
    produtosFiltrados.every(p => selectedIds[p.id]);

  // Limpar todos os filtros
  const handleLimparFiltros = () => {
    setSearchTerm('');
    setFiltroCategoria(null);
    setFiltroStatus('todos');
    setFiltroEstoque('todos');
    setFiltroNovos(false);
    setFiltroNaoVinculados(false);
    setPrecoMin('');
    setPrecoMax('');
    setPagina(1);
  };

  // Produtos filtrados com filtro de não vinculados aplicado
  const produtosExibidos = filtroNaoVinculados 
    ? produtosFiltrados.filter(p => produtosNaoVinculadosIds.has(p.id))
    : produtosFiltrados;

  // Adicionar marcador de não vinculado nos produtos
  const produtosComMarcador = produtosExibidos.map(p => ({
    ...p,
    naoVinculado: produtosNaoVinculadosIds.has(p.id),
  }));

  // Ver detalhes do produto
  const handleVerDetalhes = async (produto: ProdutoType) => {
    try {
      setModalLoading(true);
      const id = produto.id_externo ?? produto.id;
      const res = await fetch(`/api/produtos/${encodeURIComponent(String(id))}`);
      const json = await res.json();
      
      if (!json || !json.produto) {
        alert(`Erro: Produto ID ${id} não encontrado.`);
        setModalLoading(false);
        return;
      }
      
      openModal(json.produto as ProdutoType);
      
      // Prioridade: 1) FácilZap API, 2) variacoes_meta do banco
      const variacoes = (json.facilzap?.variacoes) 
        || (json.produto?.variacoes_meta) 
        || null;
      setModalVariacoes(variacoes);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar detalhes');
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle status do produto
  const handleToggleStatus = async (id: number | string, novoStatus: boolean) => {
    try {
      setToggling(id, true);
      const payload = { ids: [id], ativo: novoStatus };
      
      const res = await fetch('/api/produtos/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      
      if (json.ok) {
        setProdutosFiltrados(prev => prev.map(prod =>
          prod.id === id ? { ...prod, ativo: novoStatus } : prod
        ));
        setStatusMsg({ type: 'success', text: `Produto ${novoStatus ? 'ativado' : 'desativado'}` });
        setTimeout(() => setStatusMsg(null), 2000);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Erro ao atualizar produto' });
      setTimeout(() => setStatusMsg(null), 3000);
    } finally {
      clearToggling(id);
    }
  };

  // Ações em massa
  const handleBatchAction = async (action: 'activate' | 'deactivate') => {
    try {
      const selected = Object.keys(selectedIds)
        .filter(k => selectedIds[Number(k)] || selectedIds[k])
        .map(k => isNaN(Number(k)) ? k : Number(k));
      
      if (selected.length === 0) {
        setStatusMsg({ type: 'error', text: 'Nenhum produto selecionado' });
        setTimeout(() => setStatusMsg(null), 3000);
        return;
      }

      const novoStatus = action === 'activate';
      
      // 🆕 Quando desativar manualmente, marca desativado_manual = true
      // Quando ativar, remove a marca de desativado_manual
      const updateData = novoStatus 
        ? { ativo: true, desativado_manual: false }  // Ativar: remove flag manual
        : { ativo: false, desativado_manual: true }; // Desativar: marca como manual
      
      const { error } = await createClient()
        .from('produtos')
        .update(updateData)
        .in('id', selected);

      if (error) throw error;

      if (novoStatus) {
        setStatusMsg({ type: 'info', text: `✅ ${selected.length} produto(s) ativado(s). Vinculando às franqueadas...` });
        
        try {
          const response = await fetch('/api/admin/produtos/vincular-todas-franqueadas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produto_ids: selected }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.warn('Aviso ao vincular:', data.error);
            setStatusMsg({ 
              type: 'success', 
              text: `✅ ${selected.length} produto(s) ativado(s)` 
            });
          } else {
            setStatusMsg({ 
              type: 'success', 
              text: `✅ ${selected.length} produto(s) ativado(s) e vinculados!` 
            });
          }
        } catch (vinculacaoError) {
          console.warn('Erro ao vincular:', vinculacaoError);
          setStatusMsg({ 
            type: 'success', 
            text: `✅ ${selected.length} produto(s) ativado(s)` 
          });
        }
      } else {
        setStatusMsg({ type: 'success', text: `✅ ${selected.length} produto(s) desativado(s)` });
      }

      setTimeout(() => setStatusMsg(null), 5000);
      
      setProdutosFiltrados(prev => prev.map(p => 
        selected.includes(p.id) ? { ...p, ativo: novoStatus } : p
      ));
      
      clearSelected();
      setShowActions(false);
    } catch (err) {
      console.error('Erro em ação em massa:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao processar ação' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Sincronizar produtos do FacilZap
  const sincronizarProdutos = async () => {
    try {
      setSincronizando(true);
      setStatusMsg({ type: 'info', text: '🔄 Sincronizando produtos do FacilZap...' });

      const response = await fetch('/api/sync-produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || data.message || 'Erro ao sincronizar produtos');
      }

      setStatusMsg({ 
        type: 'success', 
        text: `✅ ${data.imported} produto(s) sincronizado(s) com sucesso!` 
      });

      setTimeout(() => {
        carregarProdutos(pagina, debouncedSearchTerm);
        setStatusMsg(null);
      }, 2000);

    } catch (err) {
      console.error('❌ Erro ao sincronizar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setStatusMsg({ 
        type: 'error', 
        text: `❌ Erro ao sincronizar: ${errorMessage}` 
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setSincronizando(false);
    }
  };

  // Vincular produtos às franqueadas
  const vincularTodasFranqueadas = async () => {
    try {
      setVinculandoFranqueadas(true);
      setStatusMsg({ type: 'info', text: '🔗 Vinculando produtos às franqueadas...' });

      const response = await fetch('/api/admin/produtos/vincular-todas-franqueadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Erro ao vincular produtos');
      }

      setStatusMsg({ 
        type: 'success', 
        text: `✅ ${data.detalhes.vinculacoes} vinculações criadas!` 
      });

      setTimeout(() => setStatusMsg(null), 5000);

    } catch (err) {
      console.error('❌ Erro ao vincular:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setStatusMsg({ 
        type: 'error', 
        text: `❌ Erro ao vincular: ${errorMessage}` 
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setVinculandoFranqueadas(false);
    }
  };

  // Vincular produtos às revendedoras
  const vincularRevendedoras = async () => {
    try {
      setVinculandoRevendedoras(true);
      setStatusMsg({ type: 'info', text: '🔗 Vinculando produtos às revendedoras...' });

      const selected = Object.keys(selectedIds).filter(id => selectedIds[id]);

      const response = await fetch('/api/admin/produtos/vincular-revendedoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          produto_ids: selected.length > 0 ? selected : undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Erro ao vincular produtos');
      }

      setStatusMsg({ 
        type: 'success', 
        text: `✅ ${data.detalhes.vinculacoes} vinculações criadas às revendedoras!` 
      });

      setTimeout(() => setStatusMsg(null), 5000);

    } catch (err) {
      console.error('❌ Erro ao vincular:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setStatusMsg({ 
        type: 'error', 
        text: `❌ Erro ao vincular: ${errorMessage}` 
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setVinculandoRevendedoras(false);
    }
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(totalProdutos / PAGE_SIZE));
  const temBusca = debouncedSearchTerm.trim().length > 0;

  return (
    <PageWrapper title="Produtos">
      <h1 className="text-3xl font-bold mb-6 text-[#333]">Gerenciar Produtos</h1>

      {/* Barra de Ações Principais */}
      <div className="mb-6 flex gap-3 items-center flex-wrap">
        <button 
          onClick={sincronizarProdutos}
          disabled={sincronizando}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium flex items-center gap-2"
        >
          {sincronizando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Sincronizando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar FacilZap
            </>
          )}
        </button>

        <button 
          onClick={vincularTodasFranqueadas}
          disabled={vinculandoFranqueadas}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium flex items-center gap-2"
        >
          {vinculandoFranqueadas ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Vinculando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Vincular às Franqueadas
            </>
          )}
        </button>

        <button 
          onClick={vincularRevendedoras}
          disabled={vinculandoRevendedoras}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium flex items-center gap-2"
        >
          {vinculandoRevendedoras ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Vinculando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Vincular às Revendedoras
            </>
          )}
        </button>

        <button 
          onClick={() => setCategoryPanelOpen(true)} 
          className="px-4 py-2 bg-[#DB1472] text-white rounded-lg hover:bg-[#DB1472]/90 transition-all shadow-md font-medium"
        >
          Gerenciar Categorias
        </button>

        <button 
          onClick={() => setModalMassaOpen(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md font-medium flex items-center gap-2"
        >
          📏 Guia de Tamanhos
        </button>

        <button
          onClick={() => setModalVincularOpen(true)}
          disabled={selectedCount === 0}
          className="px-4 py-2 bg-[#F8B81F] text-[#333] rounded-lg hover:bg-[#F8B81F]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium"
        >
          Vincular/Desvincular ({selectedCount})
        </button>

        <div className="relative">
          <button 
            disabled={selectedCount === 0}
            onClick={() => setShowActions(!showActions)}
            className="px-4 py-2 bg-[#333] text-white rounded-lg disabled:opacity-50 hover:bg-[#333]/90 transition-all shadow-md flex items-center gap-2 font-medium"
          >
            Ações ({selectedCount}) <span className="text-xs">▼</span>
          </button>
          {showActions && selectedCount > 0 && (
            <div className="absolute z-10 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200">
              <button 
                onClick={() => handleBatchAction('activate')} 
                className="block w-full text-left px-4 py-3 text-sm text-[#333] hover:bg-[#F8B81F]/20 font-medium transition-colors"
              >
                Ativar Selecionados
              </button>
              <button 
                onClick={() => handleBatchAction('deactivate')} 
                className="block w-full text-left px-4 py-3 text-sm text-[#333] hover:bg-red-50 hover:text-red-700 font-medium transition-colors"
              >
                Desativar Selecionados
              </button>
              <button 
                onClick={() => setModalAtualizarPrecosOpen(true)} 
                className="block w-full text-left px-4 py-3 text-sm text-[#333] hover:bg-green-50 hover:text-green-700 font-medium transition-colors border-t-2 border-gray-100"
              >
                Atualizar Preços
              </button>
              <button 
                onClick={() => setModalMassaOpen(true)} 
                className="block w-full text-left px-4 py-3 text-sm text-[#333] hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors"
              >
                📝 Descrição/Guia em Massa
              </button>
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <button
            onClick={() => clearSelected()}
            className="px-4 py-2 bg-gray-200 text-[#333] rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Limpar Seleção
          </button>
        )}
      </div>

      {/* Alerta de Produtos Não Vinculados */}
      {statsVinculacao && statsVinculacao.produtos_nao_vinculados > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-orange-800">
                  ⚠️ {statsVinculacao.produtos_nao_vinculados} produto(s) não vinculado(s) às revendedoras
                </h3>
                <p className="text-sm text-orange-700">
                  Esses produtos estão ativos mas não aparecem para nenhuma revendedora. 
                  {statsVinculacao.total_revendedoras > 0 && ` (${statsVinculacao.total_revendedoras} revendedora(s) ativa(s))`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroNaoVinculados(!filtroNaoVinculados)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  filtroNaoVinculados 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-white text-orange-700 border-2 border-orange-300 hover:bg-orange-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {filtroNaoVinculados ? 'Mostrando Não Vinculados' : 'Ver Não Vinculados'}
              </button>
              <button
                onClick={async () => {
                  // Selecionar todos os não vinculados visíveis
                  produtosExibidos.forEach(p => {
                    if (produtosNaoVinculadosIds.has(p.id)) {
                      setSelectedId(p.id, true);
                    }
                  });
                  setFiltroNaoVinculados(true);
                }}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium flex items-center gap-2 transition-all border border-orange-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Selecionar Todos
              </button>
              <button
                onClick={async () => {
                  // Vincular diretamente os não vinculados
                  setVinculandoRevendedoras(true);
                  setStatusMsg({ type: 'info', text: '🔗 Vinculando produtos não vinculados às revendedoras...' });
                  try {
                    const idsNaoVinculados = Array.from(produtosNaoVinculadosIds);
                    const response = await fetch('/api/admin/produtos/vincular-revendedoras', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ produto_ids: idsNaoVinculados }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      setStatusMsg({ type: 'success', text: `✅ ${data.detalhes.vinculacoes} vinculações criadas!` });
                      // Recarregar lista de não vinculados
                      carregarProdutosNaoVinculados();
                    } else {
                      throw new Error(data.error);
                    }
                  } catch (err) {
                    setStatusMsg({ type: 'error', text: `❌ Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}` });
                  } finally {
                    setVinculandoRevendedoras(false);
                    setTimeout(() => setStatusMsg(null), 5000);
                  }
                }}
                disabled={vinculandoRevendedoras || loadingNaoVinculados}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2 transition-all"
              >
                {vinculandoRevendedoras ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Vinculando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Vincular Todos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMsg && (
        <div className={`p-4 mb-6 rounded-lg font-medium ${
          statusMsg.type === 'success' ? 'bg-green-100 text-green-800 border-2 border-green-300' : 
          statusMsg.type === 'error' ? 'bg-red-100 text-red-800 border-2 border-red-300' : 
          'bg-blue-100 text-blue-800 border-2 border-blue-300'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Filtros Avançados */}
      <FiltrosProdutos
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isSearching={isSearching}
        categorias={categorias}
        categoriaId={filtroCategoria}
        onCategoriaChange={setFiltroCategoria}
        status={filtroStatus}
        onStatusChange={setFiltroStatus}
        estoque={filtroEstoque}
        onEstoqueChange={setFiltroEstoque}
        apenasNovos={filtroNovos}
        onApenasNovosChange={setFiltroNovos}
        precoMin={precoMin}
        precoMax={precoMax}
        onPrecoMinChange={setPrecoMin}
        onPrecoMaxChange={setPrecoMax}
        onLimparFiltros={handleLimparFiltros}
        filtrosAtivos={filtrosAtivos}
      />

      {/* Info de resultados */}
      <div className="mb-4 flex justify-between items-center px-2">
        <span className="text-sm font-medium text-gray-600">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#DB1472] border-t-transparent"></div>
              Carregando...
            </span>
          ) : filtroNaoVinculados ? (
            <span className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                Filtro: Não Vinculados
              </span>
              {`${produtosExibidos.length} produto(s) não vinculado(s)`}
            </span>
          ) : temBusca ? (
            `${produtosExibidos.length} resultado(s) encontrado(s)`
          ) : (
            `Mostrando ${produtosExibidos.length} de ${totalProdutos} produto(s)`
          )}
        </span>
        {selectedCount > 0 && (
          <span className="text-sm font-medium text-[#DB1472] bg-[#DB1472]/10 px-3 py-1 rounded-full">
            {selectedCount} selecionado(s)
          </span>
        )}
      </div>

      {/* Tabela de Produtos */}
      <TabelaProdutos
        produtos={produtosComMarcador}
        loading={loading}
        selectedIds={selectedIds}
        onSelectOne={setSelectedId}
        onSelectAll={handleSelectAll}
        allSelected={allSelected}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        onVerDetalhes={handleVerDetalhes}
        onToggleStatus={handleToggleStatus}
        toggling={toggling}
        onEditDescricaoGuia={(produto) => {
          setProdutoParaEditar(produto as ProdutoType);
          setModalDescricaoGuiaOpen(true);
        }}
        produtosNaoVinculadosIds={produtosNaoVinculadosIds}
      />

      {/* Paginação */}
      {!temBusca && totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button 
            onClick={() => setPagina(Math.max(1, pagina - 1))} 
            disabled={loading || pagina === 1}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700"
          >
            ← Anterior
          </button>
          
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            Página {pagina} de {totalPages}
          </span>
          
          <button 
            onClick={() => setPagina(Math.min(totalPages, pagina + 1))} 
            disabled={loading || pagina >= totalPages}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Modais */}
      <ProductDetailsModal />
      <ModalCategorias />
      <ModalVincularCategoria
        isOpen={modalVincularOpen}
        onClose={() => setModalVincularOpen(false)}
        produtoIds={Object.keys(selectedIds).filter(k => selectedIds[k]).map(k => isNaN(Number(k)) ? k : Number(k))}
        onSuccess={() => {
          carregarProdutos(pagina, debouncedSearchTerm);
          clearSelected();
        }}
      />
      <ModalAtualizarPrecos
        isOpen={modalAtualizarPrecosOpen}
        onClose={() => setModalAtualizarPrecosOpen(false)}
        produtoIds={Object.keys(selectedIds).filter(k => selectedIds[k]).map(k => isNaN(Number(k)) ? k : Number(k))}
        onSuccess={() => {
          carregarProdutos(pagina, debouncedSearchTerm);
          clearSelected();
        }}
      />
      
      {/* Modal de Descrição e Guia de Tamanhos */}
      {produtoParaEditar && (
        <ModalDescricaoGuia
          isOpen={modalDescricaoGuiaOpen}
          onClose={() => {
            setModalDescricaoGuiaOpen(false);
            setProdutoParaEditar(null);
          }}
          productId={String(produtoParaEditar.id)}
          productName={produtoParaEditar.nome}
          initialDescription={produtoParaEditar.description || ''}
          initialSizeGuide={produtoParaEditar.size_guide as { image_url?: string; measurements?: { size: string }[] } | null}
          onSave={() => {
            carregarProdutos(pagina, debouncedSearchTerm);
          }}
        />
      )}

      {/* Modal de Edição em Massa - Descrição e Guia de Tamanhos */}
      <ModalDescricaoGuiaMassa
        isOpen={modalMassaOpen}
        onClose={() => setModalMassaOpen(false)}
        onSave={() => {
          carregarProdutos(pagina, debouncedSearchTerm);
        }}
      />
    </PageWrapper>
  );
}
