"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  id: string;
  nome: string;
  preco_final: number;
  preco_base?: number; // Preço "de" riscado
  imagens: string[]; // Array de URLs de imagens
  slug?: string;
  tag?: string; // Badge (ex: "PROMO", "BESTSELLER")
  parcelamento?: string; // Ex: "6x de R$ 41,65"
  dominio: string; // Para construir o link
}

export default function ProductCard({
  id,
  nome,
  preco_final,
  preco_base,
  imagens = [],
  slug,
  tag,
  parcelamento,
  dominio
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Garantir que temos pelo menos uma imagem
  const productImages = imagens.length > 0 ? imagens : ['/placeholder-product.jpg'];
  
  // URL do produto
  const productUrl = `/loja/${dominio}/produtos/${slug || id}`;

  // Calcular desconto se houver preço "de"
  const hasDiscount = preco_base && preco_base > preco_final;
  const discountPercentage = hasDiscount 
    ? Math.round(((preco_base - preco_final) / preco_base) * 100)
    : 0;

  // Trocar imagem no hover (desktop)
  const handleMouseEnter = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  // Navegar entre imagens (mobile - dots)
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div 
      className="group flex flex-col bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Container da Imagem - PROPORÇÃO 1:1 */}
      <Link href={productUrl} className="relative block">
        {/* Imagem Principal */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          <Image
            src={productImages[currentImageIndex]}
            alt={nome}
            fill
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            quality={85}
          />

          {/* Badge (Tag) */}
          {tag && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-[#DB1472] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {tag}
              </span>
            </div>
          )}

          {/* Badge de Desconto */}
          {hasDiscount && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                -{discountPercentage}%
              </span>
            </div>
          )}

          {/* Indicadores de Imagem (Dots) - Apenas Mobile e quando há múltiplas imagens */}
          {productImages.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 md:hidden z-10">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    goToImage(index);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentImageIndex === index
                      ? 'bg-white w-4'
                      : 'bg-white/60'
                  }`}
                  aria-label={`Ver imagem ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Informações do Produto */}
      <div className="flex flex-col flex-1 p-3 md:p-4">
        {/* Título */}
        <Link href={productUrl}>
          <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] hover:text-[#DB1472] transition-colors">
            {nome}
          </h3>
        </Link>

        {/* Preços */}
        <div className="mt-2 mb-3">
          {hasDiscount && (
            <div className="text-xs md:text-sm text-gray-500 line-through">
              R$ {preco_base!.toFixed(2).replace('.', ',')}
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-lg md:text-xl font-bold text-[#DB1472]">
              R$ {preco_final.toFixed(2).replace('.', ',')}
            </span>
          </div>
          {parcelamento && (
            <div className="text-xs text-gray-600 mt-1">
              {parcelamento}
            </div>
          )}
        </div>

        {/* Botão - Sempre no final do card (mt-auto) */}
        <Link 
          href={productUrl}
          className="mt-auto w-full bg-[#F8B81F] hover:bg-[#F8B81F]/90 text-gray-900 font-bold py-2.5 md:py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base shadow-md hover:shadow-lg"
        >
          <ShoppingCart size={18} />
          Ver Produto
        </Link>
      </div>
    </div>
  );
}
