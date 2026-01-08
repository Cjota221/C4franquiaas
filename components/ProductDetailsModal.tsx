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

  if (!modalOpen || !modalProduto) {
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
  
  // Processar imagens para garantir que usem o proxy
  const processarImagens = (rawImagens: unknown): string[] => {
    let imagensArray: string[] = [];
    
    if (Array.isArray(rawImagens)) {
      imagensArray = rawImagens.filter(img => typeof img === 'string' && img.length > 0);
    } else if (product.imagem && typeof product.imagem === 'string') {
      imagensArray = [product.imagem];
    }
    
    // Se as imagens já têm o proxy, retornar como estão
    // Caso contrário, processar para adicionar o proxy
    return imagensArray.map(img => {
      if (img.includes('proxy-facilzap-image')) {
        return img; // Já tem proxy
      }
      
      // Decodificar URL se necessário
      let decodedImagem = img;
      try {
        decodedImagem = decodeURIComponent(img);
        if (/%25/.test(decodedImagem) || (/%3A/i.test(decodedImagem) && /%2F/i.test(decodedImagem))) {
          try { 
            decodedImagem = decodeURIComponent(decodedImagem); 
          } catch {}
        }
      } catch {
        decodedImagem = img;
      }
      
      // Construir URL do proxy
      return `https://c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image?facilzap=${encodeURIComponent(decodedImagem)}`;
    });
  };
  
  const imagens: string[] = processarImagens(product.imagens);
  
  console.log('🖼️ [DEBUG] Imagens processadas:', {
    raw: product.imagens,
    processed: imagens
  });

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
                  <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-lg font-medium">Sem imagens disponíveis</span>
                  </div>
                )}
                {imagens.map((src, i) => (
                  <div key={i} className="w-full h-96 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg group">
                    <Image 
                      src={src} 
                      alt={`${product.nome} - imagem ${i + 1}`} 
                      fill 
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-4 transition-transform duration-300 group-hover:scale-105" 
                      loading={i === 0 ? 'eager' : 'lazy'}
                      priority={i === 0}
                      quality={90}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.error-placeholder')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'error-placeholder flex flex-col items-center justify-center h-full text-gray-400';
                          errorDiv.innerHTML = `
                            <svg class="w-20 h-20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-base font-medium">Erro ao carregar imagem ${i + 1}</span>
                            <span class="text-sm mt-1">Tente recarregar a página</span>
                          `;
                          parent.appendChild(errorDiv);
                        }
                      }}
                    />
                    {/* Badge com número da imagem */}
                    {imagens.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {i + 1} / {imagens.length}
                      </div>
                    )}
                    {/* Loading overlay */}
                    <div className="absolute inset-0 bg-gray-200 animate-pulse pointer-events-none" style={{zIndex: -1}}></div>
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
                // Função auxiliar para extrair estoque de qualquer formato
                const extrairEstoque = (valor: unknown): string => {
                  if (valor === null || valor === undefined) return '—';
                  if (typeof valor === 'number') return String(valor);
                  if (typeof valor === 'string') return valor;
                  if (typeof valor === 'object') {
                    const obj = valor as Record<string, unknown>;
                    // Tentar extrair 'estoque' do objeto
                    if ('estoque' in obj && obj.estoque !== undefined) {
                      return extrairEstoque(obj.estoque);
                    }
                    // Tentar outras chaves comuns
                    if ('quantidade' in obj) return extrairEstoque(obj.quantidade);
                    if ('qty' in obj) return extrairEstoque(obj.qty);
                    if ('total' in obj) return extrairEstoque(obj.total);
                  }
                  return '—';
                };
                
                // Tentar estoque_display primeiro
                const estoqueDisplay = extrairEstoque(product.estoque_display);
                if (estoqueDisplay !== '—') return estoqueDisplay;
                
                // Fallback para product.estoque
                return extrairEstoque(product.estoque);
              })()}</span>
                  </div>
                </div>
              </div>

              {/* Variações */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">🔢 Variações ({modalVariacoes?.length ?? 0})</h3>
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
                      // Função auxiliar para extrair estoque de qualquer formato
                      const extrairEstoque = (valor: unknown): string => {
                        if (valor === null || valor === undefined) return '—';
                        if (typeof valor === 'number') return String(valor);
                        if (typeof valor === 'string') return valor;
                        if (typeof valor === 'object') {
                          const obj = valor as Record<string, unknown>;
                          if ('estoque' in obj && obj.estoque !== undefined) {
                            return extrairEstoque(obj.estoque);
                          }
                          if ('quantidade' in obj) return extrairEstoque(obj.quantidade);
                          if ('qty' in obj) return extrairEstoque(obj.qty);
                        }
                        return '—';
                      };
                      
                      const estoqueVariacao = extrairEstoque(v.estoque);
                      
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
