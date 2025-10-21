"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useModalStore } from '@/lib/store/modalStore';
import { Produto } from '@/lib/store/produtoStore';

type Variacao = {
  id?: string | number;
  sku?: string | null;
  nome?: string | null;
  estoque?: number | null;
  preco?: number | null;
};

export default function ProductDetailsModal(): React.JSX.Element | null {
  // Separa os selectors para evitar criar novo objeto a cada render
  const modalOpen = useModalStore((s) => s.modalOpen);
  const modalProduto = useModalStore((s) => s.modalProduto as Produto | null);
  const modalVariacoes = useModalStore((s) => s.modalVariacoes as Variacao[] | null);
  const modalLoading = useModalStore((s) => s.modalLoading);
  const closeModal = useModalStore((s) => s.closeModal);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    if (modalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  console.log('🔍 [DEBUG] ProductDetailsModal render:', {
    modalOpen,
    modalProduto,
    modalVariacoes,
    modalLoading
  });

  if (!modalOpen || !modalProduto) {
    console.log('⏭️ Modal não renderizado (closed ou sem produto)');
    return null;
  }

  // Validação extra: garantir que modalProduto é um objeto válido
  if (typeof modalProduto !== 'object' || modalProduto === null) {
    console.error('❌ [ProductDetailsModal] modalProduto inválido:', {
      tipo: typeof modalProduto,
      valor: modalProduto
    });
    return null;
  }

  const product = modalProduto as Produto;
  
  console.log('📦 [DEBUG] Produto no modal:', {
    id: product.id,
    id_externo: product.id_externo,
    nome: product.nome,
    preco_base: product.preco_base,
    estoque: product.estoque,
    estoque_display: product.estoque_display,
    imagem: product.imagem,
    imagens: product.imagens,
    produto_completo: product
  });
  
  // Validação: garantir que product tem pelo menos um nome
  if (!product.nome && !product.id) {
    console.error('❌ [ProductDetailsModal] produto sem nome e sem ID:', product);
    return null;
  }
  
  const imagens: string[] = Array.isArray(product.imagens) ? product.imagens as string[] : (product.imagem ? [product.imagem] : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{product.nome}</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
            onClick={() => closeModal()}
          >
            ✕ Fechar
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Galeria de Imagens */}
            <div>
              <div className="space-y-4">
                {imagens.length === 0 && (
                  <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Sem imagens disponíveis
                  </div>
                )}
                {imagens.map((src, i) => (
                  <div key={i} className="w-full h-96 relative bg-gray-50 rounded-lg overflow-hidden">
                    <Image 
                      src={src} 
                      alt={`${product.nome} - imagem ${i + 1}`} 
                      fill 
                      className="object-contain p-4" 
                      unoptimized 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Informações e Variações */}
            <div className="space-y-6">
              {/* Informações do Produto */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Informações</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Código:</span>
                    <span className="text-gray-800">{product.id_externo ?? product.id ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Preço base:</span>
                    <span className="text-green-600 font-bold">R$ {typeof product.preco_base === 'number' ? product.preco_base.toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Estoque total:</span>
                    <span className="text-blue-600 font-bold">{(() => {
                // Tratar estoque_display
                if (typeof product.estoque_display === 'number') {
                  return String(product.estoque_display);
                }
                if (typeof product.estoque_display === 'string') {
                  return product.estoque_display;
                }
                if (typeof product.estoque_display === 'object' && product.estoque_display !== null) {
                  // Se for objeto, extrair o valor numérico
                  const estoqueObj = product.estoque_display as Record<string, unknown>;
                  if ('estoque' in estoqueObj) {
                    return String(estoqueObj.estoque ?? '—');
                  }
                }
                
                // Fallback para product.estoque
                if (typeof product.estoque === 'number') {
                  return String(product.estoque);
                }
                if (typeof product.estoque === 'object' && product.estoque !== null) {
                  // Se for objeto, extrair o valor numérico
                  const estoqueObj = product.estoque as Record<string, unknown>;
                  if ('estoque' in estoqueObj) {
                    return String(estoqueObj.estoque ?? '—');
                  }
                }
                
                return '—';
              })()}</span>
                  </div>
                </div>
              </div>

              {/* Variações */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">🔢 Variações</h3>
                {modalLoading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
                    <p className="mt-2 text-gray-500">Carregando variações...</p>
                  </div>
                )}
                {!modalLoading && (!modalVariacoes || modalVariacoes.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhuma variação disponível</p>
                  </div>
                )}
                {!modalLoading && modalVariacoes && modalVariacoes.length > 0 && (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {modalVariacoes.map((v: Variacao, idx: number) => {
                      // Normalizar estoque da variação
                      let estoqueVariacao = '—';
                      if (v.estoque !== null && v.estoque !== undefined) {
                        if (typeof v.estoque === 'number') {
                          estoqueVariacao = String(v.estoque);
                        } else if (typeof v.estoque === 'object') {
                          const estoqueObj = v.estoque as Record<string, unknown>;
                          if ('estoque' in estoqueObj) {
                            estoqueVariacao = String(estoqueObj.estoque ?? '—');
                          }
                        }
                      }
                      
                      return (
                        <div 
                          key={idx} 
                          className="bg-white border-2 border-gray-200 hover:border-indigo-300 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-base mb-1">
                                {v.nome ?? v.sku ?? `Variação ${idx + 1}`}
                              </div>
                              <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                                SKU: <span className="font-mono">{v.sku ?? '—'}</span>
                              </div>
                            </div>
                            <div className="text-right ml-4 space-y-1">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-gray-500">Estoque:</span>
                                <span className={`font-bold text-base px-2 py-1 rounded ${
                                  estoqueVariacao === '0' || estoqueVariacao === '—' 
                                    ? 'text-red-600 bg-red-50' 
                                    : 'text-blue-600 bg-blue-50'
                                }`}>
                                  {estoqueVariacao}
                                </span>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-gray-500">Preço:</span>
                                <span className="font-bold text-base text-green-600">
                                  R$ {v.preco != null ? Number(v.preco).toFixed(2) : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
