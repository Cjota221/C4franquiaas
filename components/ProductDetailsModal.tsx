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

  if (!modalOpen || !modalProduto) return null;

  // Validação extra: garantir que modalProduto é um objeto válido
  if (typeof modalProduto !== 'object' || modalProduto === null) {
    console.error('[ProductDetailsModal] modalProduto inválido:', modalProduto);
    return null;
  }

  const product = modalProduto as Produto;
  
  // Validação: garantir que product tem pelo menos um nome
  if (!product.nome && !product.id) {
    console.error('[ProductDetailsModal] produto sem nome e sem ID:', product);
    return null;
  }
  
  const imagens: string[] = Array.isArray(product.imagens) ? product.imagens as string[] : (product.imagem ? [product.imagem] : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-xl font-semibold">{product.nome}</h2>
          <button className="text-gray-600" onClick={() => closeModal()}>Fechar</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {/* simple gallery */}
            <div className="space-y-2">
              {imagens.length === 0 && <div className="w-full h-64 bg-gray-100 flex items-center justify-center">Sem imagens</div>}
              {imagens.map((src, i) => (
                <div key={i} className="w-full h-56 relative">
                  <Image src={src} alt={`imagem-${i}`} fill className="object-contain" unoptimized />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="font-semibold">Informações</h3>
              <p className="text-sm text-gray-600">Código: {product.id_externo ?? product.id ?? '—'}</p>
              <p className="text-sm text-gray-600">Preço base: R$ {typeof product.preco_base === 'number' ? product.preco_base.toFixed(2) : '0.00'}</p>
              <p className="text-sm text-gray-600">Estoque: {
                typeof product.estoque_display === 'number' ? String(product.estoque_display) :
                typeof product.estoque_display === 'string' ? product.estoque_display :
                typeof product.estoque === 'number' ? String(product.estoque) : '—'
              }</p>
            </div>

            <div>
              <h3 className="font-semibold">Variações</h3>
              {modalLoading && <div>Carregando variações...</div>}
              {!modalLoading && (!modalVariacoes || modalVariacoes.length === 0) && <div className="text-sm text-gray-500">Sem variações</div>}
              {!modalLoading && modalVariacoes && modalVariacoes.length > 0 && (
                <div className="space-y-2">
                  {modalVariacoes.map((v: Variacao, idx: number) => (
                    <div key={idx} className="p-2 border rounded flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{v.nome ?? v.sku ?? `Var ${idx + 1}`}</div>
                        <div className="text-xs text-gray-500">SKU: {v.sku ?? '—'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Est: {v.estoque ?? '—'}</div>
                        <div className="text-sm">R$ {v.preco != null ? Number(v.preco).toFixed(2) : '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
