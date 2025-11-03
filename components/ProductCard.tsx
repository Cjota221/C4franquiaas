"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  id: string;
  nome: string;
  preco_final: number;
  preco_base?: number; // Pre├ºo "de" riscado
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
  const [imageError, setImageError] = useState(false);

  // ­ƒöº FIX: Sempre usar URL direta do Facilzap (mais confi├ível)
  const extractRealUrl = (url: string) => {
    if (!url) return null;
    
    // Se for proxy do Netlify, extrair URL real do Facilzap
    if (url.includes('.netlify/functions/proxy-facilzap-image')) {
      try {
        const urlObj = new URL(url);
        const realUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('facilzap');
        if (realUrl) {
          const decoded = decodeURIComponent(realUrl);
          console.log('­ƒô© Extraindo URL real:', decoded);
          return decoded;
        }
      } catch {
        console.warn('ÔÜá´©Å Erro ao extrair URL do proxy, usando original:', url);
      }
    }
    
    // Se j├í for URL direta do Facilzap, usar direto
    if (url.includes('arquivos.facilzap.app.br') || url.includes('facilzap.app.br')) {
      return url;
    }
    
    return url;
  };

  // Processar imagens
  const processedImages = imagens
    .filter(img => img && img.trim() !== '') // Remover vazias/null
    .map(img => extractRealUrl(img))
    .filter(Boolean); // Remover null/undefined

  // Garantir que temos pelo menos uma imagem
  const productImages = processedImages.length > 0 && !imageError
    ? processedImages 
    : ['https://placehold.co/400x400/f3f4f6/9ca3af?text=Sem+Imagem'];
  
  // URL do produto
  const productUrl = `/loja/${dominio}/produtos/${slug || id}`;

  // Calcular desconto se houver pre├ºo "de"
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
      {/* Container da Imagem - PROPOR├ç├âO 1:1 */}
      <Link href={productUrl} className="relative block">
        {/* Imagem Principal */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          {imageError ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Imagem indispon├¡vel</p>
              </div>
            </div>
          ) : (
            <Image
              src={productImages[currentImageIndex]}
              alt={nome}
              fill
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              quality={85}
              onError={() => {
                console.error(`Erro ao carregar imagem: ${productImages[currentImageIndex]}`);
                setImageError(true);
              }}
              unoptimized={productImages[currentImageIndex].includes('placehold.co')}
            />
          )}

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

          {/* Indicadores de Imagem (Dots) - Apenas Mobile e quando h├í m├║ltiplas imagens */}
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

      {/* Informa├º├Áes do Produto */}
      <div className="flex flex-col flex-1 p-3 md:p-4">
        {/* T├¡tulo */}
        <Link href={productUrl}>
          <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] hover:text-[#DB1472] transition-colors">
            {nome}
          </h3>
        </Link>

        {/* Pre├ºos */}
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

        {/* Bot├úo - Sempre no final do card (mt-auto) */}
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
