"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

import { useProdutoStore, Produto as ProdutoType } from '@/lib/store/produtoStore';
import { useCategoriaStore } from '@/lib/store/categoriaStore';
import { useStatusStore } from '@/lib/store/statusStore';
import { useModalStore } from '@/lib/store/modalStore';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import ModalCategorias from '@/components/ModalCategorias';
import ModalVincularCategoria from '@/components/ModalVincularCategoria';
import ModalAtualizarPrecos from '@/components/ModalAtualizarPrecos';
import { supabase } from '@/lib/supabaseClient';
import PageWrapper from '@/components/PageWrapper';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 30;

type ProdutoRow = {
  id: number | string;
  id_externo: string | null;
  nome: string | null;
  estoque: number | null;
  preco_base: number | null;
  ativo: boolean | null;
  imagem: string | null;
  imagens: string[] | null;
  categorias: { id: number; nome: string }[] | null;
  variacoes_meta?: { sku?: string; codigo_barras?: string }[] | null;
};

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

  // Local states
  const [produtosFiltrados, setProdutosFiltrados] = useState<ProdutoType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [modalVincularOpen, setModalVincularOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
  const [modalAtualizarPrecosOpen, setModalAtualizarPrecosOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Carregar categorias disponíveis
  const carregarCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro do Supabase ao carregar categorias:', error);
        throw error;
      }
      setCategorias(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      // Silencioso - categorias são opcionais
    }
  }, []);

  // Carregar produtos - SEM PAGINAÇÃO quando há busca
  const carregarProdutos = useCallback(async (pag: number, termo: string) => {
    try {
      setLoading(true);
      
      // Se tem busca ativa, carregar TODOS os resultados
      const temBusca = termo.trim().length > 0;
      const from = temBusca ? 0 : (pag - 1) * PAGE_SIZE;
      const to = temBusca ? 9999 : from + PAGE_SIZE - 1; // Carregar muitos quando busca

      let query = supabase
        .from('produtos')
        .select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens', { count: 'exact' })
        .order('nome', { ascending: true });

      // Aplicar filtro de busca no servidor
      if (temBusca) {
        query = query.or(`nome.ilike.%${termo}%,id_externo.ilike.%${termo}%`);
      }

      // TODO: Aplicar filtro de categoria quando a tabela existir
      // if (filtroCategoria) {
      //   query = query.contains('categorias', [{ id: filtroCategoria }]);
      // }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const mapped: ProdutoType[] = (data || []).map((r: ProdutoRow) => {
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
          categorias: null, // Será carregado depois da migração
        };
      });

      setProdutosFiltrados(mapped);
      setTotalProdutos(count || 0);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      
      // Mensagens específicas para erros comuns
      let errorMessage = 'Erro ao carregar produtos';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const errMsg = String((err as Error).message || '');
        
        if (errMsg.includes('relation') && errMsg.includes('does not exist')) {
          errorMessage = 'Tabela de categorias não encontrada. Execute a migração do banco de dados.';
        } else if (errMsg.includes('permission denied')) {
          errorMessage = 'Sem permissão para acessar os dados. Verifique as configurações de RLS.';
        } else if (errMsg) {
          errorMessage = `Erro: ${errMsg}`;
        }
      }
      
      setStatusMsg({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [setStatusMsg]);

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

  // Carregar na montagem e ao mudar filtros
  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  useEffect(() => {
    carregarProdutos(pagina, debouncedSearchTerm);
  }, [pagina, debouncedSearchTerm, filtroCategoria, carregarProdutos]);

  // Indicador de busca
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Reset página ao buscar
  useEffect(() => {
    if (debouncedSearchTerm) {
      setPagina(1);
    }
  }, [debouncedSearchTerm]);

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
      
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: novoStatus })
        .in('id', selected);

      if (error) throw error;

      setStatusMsg({ type: 'success', text: `${selected.length} produto(s) ${novoStatus ? 'ativado(s)' : 'desativado(s)'}` });
      setTimeout(() => setStatusMsg(null), 3000);
      
      // Atualizar localmente
      setProdutosFiltrados(prev => prev.map(p => 
        selected.includes(p.id) ? { ...p, ativo: novoStatus } : p
      ));
      
      clearSelected();
      setShowActions(false);
    } catch (err) {
      console.error('Erro em ação em massa:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao processar ação' });
    }
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(totalProdutos / PAGE_SIZE));
  
  // Desabilitar navegação se tem busca ativa (mostra tudo)
  const temBusca = debouncedSearchTerm.trim().length > 0;

  // Função para selecionar todos os produtos exibidos
  const selecionarTodos = () => {
    const ids = produtosFiltrados.map(p => p.id);
    selectAll(ids);
    setStatusMsg({ 
      type: 'success', 
      text: `${produtosFiltrados.length} produto(s) selecionado(s)` 
    });
    setTimeout(() => setStatusMsg(null), 2000);
  };

  return (
    <PageWrapper title="Produtos">
      <h1 className="text-3xl font-bold mb-6 text-[#333]">Gerenciar Produtos</h1>

      {/* Barra de Ferramentas */}
      <div className="mb-6 space-y-3">
        {/* Linha 1: Busca */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou ID (mostra todos os resultados)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#DB1472] focus:ring-2 focus:ring-[#DB1472]/20 transition-all pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#DB1472] border-t-transparent"></div>
              </div>
            )}
          </div>
          
          {/* Filtro por categoria */}
          <select
            value={filtroCategoria || ''}
            onChange={(e) => setFiltroCategoria(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#DB1472] focus:ring-2 focus:ring-[#DB1472]/20 transition-all"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>

        {/* Linha 2: Ações */}
        <div className="flex gap-3 items-center flex-wrap">
          <button 
            onClick={() => setCategoryPanelOpen(true)} 
            className="px-4 py-2 bg-[#DB1472] text-white rounded-lg hover:bg-[#DB1472]/90 transition-all shadow-md font-medium"
          >
            Gerenciar Categorias
          </button>

          <button
            onClick={selecionarTodos}
            disabled={produtosFiltrados.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium"
          >
            Selecionar Todos ({produtosFiltrados.length})
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

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && produtosFiltrados.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="bg-gray-200 h-48 rounded mb-3"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          ))
        ) : produtosFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl font-medium">Nenhum produto encontrado</p>
            {debouncedSearchTerm && (
              <p className="text-sm mt-2">Tente ajustar sua busca</p>
            )}
          </div>
        ) : (
          produtosFiltrados.map((p) => {
            const produtoId = p.id;
            const isToggling = toggling[produtoId] ?? false;
            const isSelected = selectedIds[produtoId] ?? false;
            const produtoAtivo = p.ativo ?? false;

            return (
              <div
                key={produtoId}
                className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all ${
                  isSelected ? 'ring-4 ring-[#DB1472]' : ''
                } ${!produtoAtivo ? 'opacity-60' : ''}`}
              >
                <div className="p-4">
                  {/* Checkbox + Imagem */}
                  <div className="flex gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => setSelectedId(produtoId, !isSelected)}
                      className="w-5 h-5 mt-1 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden group">
                      {p.imagem ? (
                        <>
                          <Image
                            src={p.imagem}
                            alt={p.nome}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            quality={85}
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400"><svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-sm">Imagem indisponível</span></div>`;
                              }
                            }}
                          />
                          {/* Loading overlay */}
                          <div className="absolute inset-0 bg-gray-200 animate-pulse" style={{zIndex: -1}}></div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-sm">Sem imagem</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="font-bold text-[#333] mb-2 line-clamp-2">{p.nome}</h3>
                  
                  <div className="space-y-1 text-sm mb-3">
                    <p className="text-gray-600">
                      <span className="font-medium">Estoque:</span>{' '}
                      <span className={p.estoque === 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                        {p.estoque === 0 ? 'Esgotado' : 'Disponível'}
                      </span>
                    </p>
                    {p.preco_base && (
                      <p className="text-gray-600">
                        <span className="font-medium">Preço:</span> R$ {p.preco_base.toFixed(2)}
                      </p>
                    )}
                    {p.categorias && p.categorias.length > 0 && (
                      <p className="text-gray-600">
                        <span className="font-medium">Categorias:</span>{' '}
                        <span className="text-xs bg-[#F8B81F]/20 text-[#333] px-2 py-1 rounded font-medium">
                          {p.categorias.map(c => c.nome).join(', ')}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          setModalLoading(true);
                          const id = p.id_externo ?? produtoId;
                          const res = await fetch(`/api/produtos/${encodeURIComponent(String(id))}`);
                          const json = await res.json();
                          
                          if (!json || !json.produto) {
                            alert(`Erro: Produto ID ${id} não encontrado.`);
                            setModalLoading(false);
                            return;
                          }
                          
                          openModal(json.produto as ProdutoType);
                          setModalVariacoes((json.facilzap && json.facilzap.variacoes) ? json.facilzap.variacoes : null);
                        } catch (err) {
                          console.error(err);
                          alert('Erro ao carregar detalhes');
                        } finally {
                          setModalLoading(false);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-[#DB1472] text-white rounded hover:bg-[#DB1472]/90 transition-colors text-sm font-medium"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      disabled={isToggling}
                      onClick={async () => {
                        try {
                          setToggling(produtoId, true);
                          const payload = { ids: [produtoId], ativo: !produtoAtivo };
                          
                          const res = await fetch('/api/produtos/batch', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          });
                          
                          if (!res.ok) throw new Error(`HTTP ${res.status}`);
                          
                          const json = await res.json();
                          
                          if (json.ok) {
                            setProdutosFiltrados(prev => prev.map(prod =>
                              prod.id === produtoId ? { ...prod, ativo: !produtoAtivo } : prod
                            ));
                            setStatusMsg({ type: 'success', text: `Produto ${!produtoAtivo ? 'ativado' : 'desativado'}` });
                          }
                        } catch (err) {
                          console.error(err);
                          setStatusMsg({ type: 'error', text: 'Erro ao atualizar produto' });
                        } finally {
                          clearToggling(produtoId);
                        }
                      }}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        produtoAtivo 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-gray-400 text-white hover:bg-gray-500'
                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isToggling ? 'Atualizando...' : produtoAtivo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginação - Só mostra se NÃO tem busca ativa */}
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
    </PageWrapper>
  );
}
