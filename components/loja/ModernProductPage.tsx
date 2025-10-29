/**
 * PÁGINA DE PRODUTO REDESENHADA - VERSÃO MODERNA
 * Layout minimalista com hierarquia visual clara
 * Usando componentes modulares
 */

"use client";
import React, { useState } from 'react';
import { StickyLojaHeader } from '@/components/loja/StickyLojaHeader';
import { ProductImageGallery } from '@/components/loja/ProductImageGallery';
import { ProductTitle } from '@/components/loja/ProductTitle';
import { PriceBlock } from '@/components/loja/PriceBlock';
import { SizeSelector } from '@/components/loja/SizeSelector';
import { QuantitySelector } from '@/components/loja/QuantitySelector';
import { BuyButton } from '@/components/loja/BuyButton';
import { ShippingCalculator } from '@/components/loja/ShippingCalculator';
import MobileMenu from '@/components/loja/MobileMenu';

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  imagens: string[];
  preco_final: number;
  parcelamento?: {
    parcelas: number;
    valor: number;
    total?: number;
  };
  variacoes?: Array<{
    sku: string;
    tamanho: string;
    disponivel: boolean;
    estoque?: number;
  }>;
}

interface ModernProductPageProps {
  produto: Produto;
  dominio: string;
  favorito: boolean;
  skuSelecionado: string | null;
  quantidade: number;
  addingToCart: boolean;
  logoUrl?: string;
  nomeLoja?: string;
  corPrimaria?: string;
  onBack: () => void;
  onToggleFavorito: () => void;
  onSizeSelect: (sku: string) => void;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
}

export function ModernProductPage({
  produto,
  dominio,
  favorito,
  skuSelecionado,
  quantidade,
  addingToCart,
  logoUrl,
  nomeLoja,
  corPrimaria,
  onBack,
  onToggleFavorito,
  onSizeSelect,
  onQuantityChange,
  onAddToCart,
}: ModernProductPageProps) {
  const [menuAberto, setMenuAberto] = useState(false);

  // Preparar dados para componentes
  const imagensValidas = produto.imagens && produto.imagens.length > 0 
    ? produto.imagens 
    : ['https://placehold.co/800x800/e5e7eb/9ca3af?text=Sem+Imagem'];

  const sizes = produto.variacoes?.map(v => ({
    value: v.sku,
    label: v.tamanho,
    disponivel: v.disponivel,
    estoque: v.estoque
  })) || [];

  const variacaoSelecionada = produto.variacoes?.find(v => v.sku === skuSelecionado);
  const estoqueDisponivel = variacaoSelecionada?.estoque || 0;
  const isButtonDisabled = !skuSelecionado || addingToCart || estoqueDisponivel === 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Único com Sticky/Shrinking Effect */}
      <StickyLojaHeader
        dominio={dominio}
        logoUrl={logoUrl}
        nomeLoja={nomeLoja}
        corPrimaria={corPrimaria}
        showBackButton={true}
        onBackClick={onBack}
        onMenuClick={() => setMenuAberto(true)}
      />

      {/* Menu Mobile */}
      {menuAberto && (
        <MobileMenu
          isOpen={menuAberto}
          onClose={() => setMenuAberto(false)}
          dominio={dominio}
          lojaNome={nomeLoja || 'Loja'}
          corPrimaria="#000000"
        />
      )}

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* COLUNA 1: Galeria de Imagens */}
          <div>
            <ProductImageGallery
              images={imagensValidas}
              productName={produto.nome}
              onFavorite={onToggleFavorito}
              isFavorite={favorito}
            />
          </div>

          {/* COLUNA 2: Informações do Produto */}
          <div className="space-y-8">
            {/* 1º HIERARQUIA: Nome do Produto */}
            <ProductTitle nome={produto.nome} />

            {/* 2º HIERARQUIA: Preço */}
            <PriceBlock
              precoVista={produto.preco_final}
              parcelamento={produto.parcelamento}
            />

            {/* 3º HIERARQUIA: Seletor de Tamanho */}
            {sizes.length > 0 && (
              <SizeSelector
                sizes={sizes}
                selectedSize={skuSelecionado}
                onSizeSelect={onSizeSelect}
              />
            )}

            {/* Indicador de Estoque */}
            {skuSelecionado && (
              <div className="text-sm text-gray-600">
                {estoqueDisponivel > 0 ? (
                  <p className="text-green-600 font-medium">
                    ✓ {estoqueDisponivel} {estoqueDisponivel === 1 ? 'unidade disponível' : 'unidades disponíveis'}
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">
                    ✗ Sem estoque
                  </p>
                )}
              </div>
            )}

            {/* 4º HIERARQUIA: Quantidade + Botão de Compra */}
            <div className="space-y-4">
              {skuSelecionado && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">QUANTIDADE:</span>
                  <QuantitySelector
                    quantity={quantidade}
                    onQuantityChange={onQuantityChange}
                    max={estoqueDisponivel}
                  />
                </div>
              )}

              <BuyButton
                onClick={onAddToCart}
                disabled={isButtonDisabled}
                loading={addingToCart}
                text={!skuSelecionado ? 'SELECIONE UM TAMANHO' : 'ADICIONAR AO CARRINHO'}
              />
            </div>

            {/* 5º HIERARQUIA: Calculadora de Frete */}
            <ShippingCalculator
              produtoId={produto.id}
            />

            {/* Descrição do Produto */}
            {produto.descricao && (
              <div className="pt-8 border-t border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Descrição do Produto
                </h2>
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
