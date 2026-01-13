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
import { ProdutoDetailsPanel } from './components';

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
  // 🔧 IMPORTANTE: Padrão é 'ativo' para não mostrar produtos excluídos do FácilZap
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('ativo');
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
  
  // State para Modal de Descrição e Guia de Tamanhos
  const [modalDescricaoGuiaOpen, setModalDescricaoGuiaOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<ProdutoType | null>(null);
  
  // State para Modal de Edição em Massa
  const [modalMassaOpen, setModalMassaOpen] = useState(false);

  // State para Drawer de Detalhes do Produto
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoType | null>(null);

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
  ].filter(Boolean).length;

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
  }, [carregarCategorias]);

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
    setPrecoMin('');
    setPrecoMax('');
    setPagina(1);
  };

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
        setStatusMsg({ type: 'info', text: `${selected.length} produto(s) ativado(s). Vinculando às franqueadas...` });
        
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
              text: `${selected.length} produto(s) ativado(s)` 
            });
          } else {
            setStatusMsg({ 
              type: 'success', 
              text: `${selected.length} produto(s) ativado(s) e vinculados` 
            });
          }
        } catch (vinculacaoError) {
          console.warn('Erro ao vincular:', vinculacaoError);
          setStatusMsg({ 
            type: 'success', 
            text: `${selected.length} produto(s) ativado(s)` 
          });
        }
      } else {
        setStatusMsg({ type: 'success', text: `${selected.length} produto(s) desativado(s)` });
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

  // Excluir produtos em massa
  const handleExcluirProdutos = async () => {
    try {
      const selected = Object.keys(selectedIds)
        .filter(k => selectedIds[Number(k)] || selectedIds[k])
        .map(k => isNaN(Number(k)) ? k : Number(k));
      
      if (selected.length === 0) {
        setStatusMsg({ type: 'error', text: 'Nenhum produto selecionado' });
        setTimeout(() => setStatusMsg(null), 3000);
        return;
      }

      // ⚠️ LIMITE DE 50 PRODUTOS POR VEZ (evita timeout)
      const LIMITE_EXCLUSAO = 50;
      if (selected.length > LIMITE_EXCLUSAO) {
        setStatusMsg({ 
          type: 'error', 
          text: `⚠️ Selecione no máximo ${LIMITE_EXCLUSAO} produtos por vez` 
        });
        setTimeout(() => setStatusMsg(null), 4000);
        return;
      }

      // Confirmação
      const confirmar = window.confirm(
        `⚠️ ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE ${selected.length} produto(s).\n\n` +
        `Esta ação NÃO pode ser desfeita!\n\n` +
        `Os produtos serão removidos do painel e de todas as lojas das revendedoras.\n\n` +
        `Deseja continuar?`
      );

      if (!confirmar) return;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🗑️ [CLIENTE] INICIANDO EXCLUSÃO DE PRODUTOS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Total de produtos a excluir: ${selected.length}`);
      console.log(`🔑 IDs selecionados:`, selected);

      setStatusMsg({ type: 'info', text: `Excluindo ${selected.length} produto(s)...` });

      console.log('📡 Enviando requisição para API...');
      const response = await fetch('/api/admin/produtos/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_ids: selected }),
      });

      console.log(`📥 Resposta recebida - Status: ${response.status}`);
      const data = await response.json();
      console.log('📦 Dados retornados:', data);

      if (!response.ok || !data.success) {
        console.error('❌ [CLIENTE] Erro na exclusão:', data.error);
        throw new Error(data.error || 'Erro ao excluir');
      }

      console.log(`✅ [CLIENTE] ${data.total} produto(s) excluído(s)`);
      
      if (data.debug) {
        console.log('🔍 Debug adicional:', data.debug);
        if (data.debug.produtos_ainda_existem > 0) {
          console.warn('⚠️ ATENÇÃO: Alguns produtos ainda existem no banco!');
          console.warn('   IDs não excluídos:', data.debug.ids_nao_excluidos);
        }
      }

      setStatusMsg({ type: 'success', text: `${data.total} produto(s) excluído(s) com sucesso` });
      setTimeout(() => setStatusMsg(null), 5000);

      // Remover produtos da lista local
      console.log('🔄 Atualizando lista local...');
      setProdutosFiltrados(prev => prev.filter(p => !selected.includes(p.id)));
      setTotalProdutos(prev => prev - data.total);
      
      clearSelected();
      setShowActions(false);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏁 [CLIENTE] FIM DO PROCESSO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (err) {
      console.error('Erro ao excluir produtos:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao excluir produtos' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Sincronizar produtos do FacilZap
  const sincronizarProdutos = async () => {
    try {
      setSincronizando(true);
      setStatusMsg({ type: 'info', text: 'Sincronizando produtos do FacilZap...' });

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
        text: `${data.imported} produto(s) sincronizado(s) com sucesso` 
      });

      setTimeout(() => {
        carregarProdutos(pagina, debouncedSearchTerm);
        setStatusMsg(null);
      }, 2000);

    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setStatusMsg({ 
        type: 'error', 
        text: `Erro ao sincronizar: ${errorMessage}` 
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setSincronizando(false);
    }
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(totalProdutos / PAGE_SIZE));
  const temBusca = debouncedSearchTerm.trim().length > 0;

  // State para dropdown de vinculação
  const [showVinculacaoMenu, setShowVinculacaoMenu] = useState(false);
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  return (
    <PageWrapper title="Produtos">
      {/* ============================================================ */}
      {/* HEADER - Linha 1: Título + Ações Principais */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        {/* Título e Subtítulo */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalProdutos} produto{totalProdutos !== 1 ? 's' : ''} no catálogo
          </p>
        </div>

        {/* Toolbar de Ações - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {/* Ação Principal: Sincronizar */}
          <button 
            onClick={sincronizarProdutos}
            disabled={sincronizando}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sincronizando ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
          {/* Dropdown: Ações Secundárias */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowSecondaryMenu(!showSecondaryMenu);
                setShowVinculacaoMenu(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              Mais
            </button>
            {showSecondaryMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button 
                  onClick={() => { setCategoryPanelOpen(true); setShowSecondaryMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Gerenciar Categorias
                </button>
                <button 
                  onClick={() => { setModalMassaOpen(true); setShowSecondaryMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Guia de Tamanhos
                </button>
                <button 
                  onClick={() => { setModalAtualizarPrecosOpen(true); setShowSecondaryMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Atualizar Precos
                </button>
              </div>
            )}
          </div>

          {/* Ações em Lote (quando há seleção) */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300">
              <span className="text-sm text-gray-500">{selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}</span>
              <div className="relative">
                <button 
                  onClick={() => setShowActions(!showActions)}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Ações
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showActions && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button 
                      onClick={() => { handleBatchAction('activate'); setShowActions(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                    >
                      ✅ Ativar Selecionados
                    </button>
                    <button 
                      onClick={() => { handleBatchAction('deactivate'); setShowActions(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                    >
                      ⏸️ Desativar Selecionados
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => { setModalMassaOpen(true); setShowActions(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                    >
                      ✏️ Editar Descricao/Guia
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => { handleExcluirProdutos(); setShowActions(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                    >
                      🗑️ Excluir Selecionados
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => clearSelected()}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Toolbar Mobile - Menu Compacto */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            onClick={sincronizarProdutos}
            disabled={sincronizando}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {sincronizando ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Sincronizar
          </button>
          <div className="relative">
            <button 
              onClick={() => {
                setShowVinculacaoMenu(!showVinculacaoMenu);
                setShowSecondaryMenu(false);
              }}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
            {showVinculacaoMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button 
                  onClick={() => { setCategoryPanelOpen(true); setShowVinculacaoMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Gerenciar Categorias
                </button>
                <button 
                  onClick={() => { setModalMassaOpen(true); setShowVinculacaoMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Guia de Tamanhos
                </button>
                {selectedCount > 0 && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase">
                      {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
                    </div>
                    <button 
                      onClick={() => { handleBatchAction('activate'); setShowVinculacaoMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                    >
                      Ativar Selecionados
                    </button>
                    <button 
                      onClick={() => { handleBatchAction('deactivate'); setShowVinculacaoMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Desativar Selecionados
                    </button>
                    <button 
                      onClick={() => { clearSelected(); setShowVinculacaoMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                    >
                      Limpar Selecao
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
          ) : temBusca ? (
            `${produtosFiltrados.length} resultado(s) encontrado(s)`
          ) : (
            `Mostrando ${produtosFiltrados.length} de ${totalProdutos} produto(s)`
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
        produtos={produtosFiltrados}
        loading={loading}
        selectedIds={selectedIds}
        onSelectOne={setSelectedId}
        onSelectAll={handleSelectAll}
        allSelected={allSelected}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        onVerDetalhes={handleVerDetalhes}
        onOpenDrawer={(produto) => {
          setProdutoSelecionado(produto as ProdutoType);
          setDrawerOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
        toggling={toggling}
        onEditDescricaoGuia={(produto) => {
          setProdutoParaEditar(produto as ProdutoType);
          setModalDescricaoGuiaOpen(true);
        }}
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

      {/* Drawer de Detalhes do Produto */}
      <ProdutoDetailsPanel
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setProdutoSelecionado(null);
        }}
        produto={produtoSelecionado}
        onToggleStatus={async (id, novoStatus) => {
          await handleToggleStatus(id, novoStatus);
          // Atualizar o produto selecionado no drawer
          if (produtoSelecionado && produtoSelecionado.id === id) {
            setProdutoSelecionado({ ...produtoSelecionado, ativo: novoStatus });
          }
        }}
        onEditDescricaoGuia={(produto) => {
          setProdutoParaEditar(produto as ProdutoType);
          setModalDescricaoGuiaOpen(true);
        }}
        loadingToggle={produtoSelecionado ? toggling[produtoSelecionado.id] : false}
      />
    </PageWrapper>
  );
}
