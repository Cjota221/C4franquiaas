/**
 * 🎬 REELS PREVIEW - Carrossel de 4 vídeos para Home
 * 
 * Exibe um preview dos vídeos disponíveis
 * Clique em "Ver Todos" abre o modo imersivo (/reels)
 */

"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TIPOS
// ============================================================================
interface ReelPreviewProduct {
  id: string;
  nome: string;
  videoUrl: string;
  posterUrl?: string;
  preco?: number;
}

interface ReelsPreviewProps {
  products: ReelPreviewProduct[];
  dominio: string;
  corPrimaria?: string;
  title?: string;
  maxItems?: number;
}

// ============================================================================
// COMPONENTE: Mini Video Card (Memoizado)
// ============================================================================
interface MiniVideoCardProps {
  product: ReelPreviewProduct;
  index: number;
  corPrimaria: string;
  dominio: string;
  onHover: (index: number | null) => void;
  isHovered: boolean;
}

const MiniVideoCard = memo(function MiniVideoCard({
  product,
  index,
  corPrimaria,
  dominio,
  onHover,
  isHovered,
}: MiniVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause on hover
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Link
      href={`/loja/${dominio}/reels?produto=${product.id}`}
      className="relative flex-shrink-0 w-36 h-64 rounded-xl overflow-hidden group cursor-pointer"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(index)}
      onTouchEnd={() => onHover(null)}
    >
      {/* Video/Poster */}
      <video
        ref={videoRef}
        src={product.videoUrl}
        poster={product.posterUrl}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="none"
      />

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Play Icon */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${corPrimaria}dd` }}
        >
          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
        </div>
      </div>

      {/* Ring animado no hover */}
      <div 
        className={`absolute inset-0 rounded-xl border-2 transition-all ${isHovered ? 'border-opacity-100' : 'border-opacity-0'}`}
        style={{ borderColor: corPrimaria }}
      />

      {/* Info do Produto */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-xs font-medium line-clamp-2 mb-1 drop-shadow-lg">
          {product.nome}
        </p>
        {product.preco && (
          <p className="text-white font-bold text-sm drop-shadow-lg">
            {formatPrice(product.preco)}
          </p>
        )}
      </div>

      {/* Número do Reel */}
      <div className="absolute top-2 left-2">
        <span 
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: corPrimaria }}
        >
          #{index + 1}
        </span>
      </div>
    </Link>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL: ReelsPreview
// ============================================================================
export function ReelsPreview({
  products,
  dominio,
  corPrimaria = '#DB1472',
  title = 'Reels',
  maxItems = 4,
}: ReelsPreviewProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Filtrar produtos com vídeo e limitar
  const displayProducts = products.slice(0, maxItems);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${corPrimaria}20` }}
          >
            <Play 
              className="w-4 h-4 ml-0.5" 
              style={{ color: corPrimaria }}
              fill={corPrimaria}
            />
          </div>
          <h2 className="font-bold text-lg text-gray-900">{title}</h2>
          {products.length > maxItems && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              +{products.length - maxItems}
            </span>
          )}
        </div>

        {/* Ver Todos */}
        {products.length > maxItems && (
          <Link
            href={`/loja/${dominio}/reels`}
            className="flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: corPrimaria }}
          >
            Ver Todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Carrossel de Vídeos */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {displayProducts.map((product, index) => (
          <MiniVideoCard
            key={product.id}
            product={product}
            index={index}
            corPrimaria={corPrimaria}
            dominio={dominio}
            onHover={setHoveredIndex}
            isHovered={hoveredIndex === index}
          />
        ))}

        {/* Card "Ver Mais" se houver mais produtos */}
        {products.length > maxItems && (
          <Link
            href={`/loja/${dominio}/reels`}
            className="relative flex-shrink-0 w-36 h-64 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: `${corPrimaria}15` }}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: corPrimaria }}
              >
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
              <p 
                className="font-bold text-sm"
                style={{ color: corPrimaria }}
              >
                Ver Todos
              </p>
              <p className="text-gray-500 text-xs">
                +{products.length - maxItems} vídeos
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* CSS */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}

export default ReelsPreview;
