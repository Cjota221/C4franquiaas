/**
 * 🎬 VIDEO FEED PREVIEW - Carrossel horizontal de vídeos para a Home
 * 
 * LAYOUT:
 * - Carrossel horizontal com scroll
 * - 4 vídeos visíveis, scroll para ver mais
 * - Botão "Ver Completo" no final
 * 
 * @author C4 Franquias
 */

"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, ChevronRight, Film } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TIPOS
// ============================================================================
export interface VideoPreviewProduct {
  id: string;
  nome: string;
  videoUrl: string;
  posterUrl?: string;
  preco?: number;
}

interface VideoFeedPreviewProps {
  products: VideoPreviewProduct[];
  dominio: string;
  corPrimaria?: string;
  title?: string;
  maxItems?: number;
  basePath?: string; // '/site' ou '/loja' - default: '/site'
}

// ============================================================================
// COMPONENTE: Video Thumbnail Card (Memoizado)
// ============================================================================
interface VideoThumbnailProps {
  product: VideoPreviewProduct;
  index: number;
  corPrimaria: string;
  dominio: string;
  basePath: string;
  onHover: (index: number | null) => void;
  isHovered: boolean;
}

const VideoThumbnail = memo(function VideoThumbnail({
  product,
  index,
  corPrimaria,
  dominio,
  basePath,
  onHover,
  isHovered,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause no hover (mudo para preview)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
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
      href={`${basePath}/${dominio}/reels?produto=${product.id}`}
      className="relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer block"
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
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loop
        muted
        playsInline
        preload="metadata"
      />

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Ícone de Play (aparece quando não está em hover) */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: `${corPrimaria}cc` }}
        >
          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
        </div>
      </div>

      {/* Ring animado no hover */}
      {isHovered && (
        <div 
          className="absolute inset-0 rounded-xl ring-2 ring-offset-2 transition-all duration-300"
          style={{ 
            // @ts-expect-error - ring color via CSS custom properties
            '--tw-ring-color': corPrimaria,
          }}
        />
      )}

      {/* Info do produto */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-xs font-medium line-clamp-2 mb-1 drop-shadow-lg">
          {product.nome}
        </p>
        {product.preco && (
          <p 
            className="font-bold text-sm drop-shadow-lg"
            style={{ color: 'white' }}
          >
            {formatPrice(product.preco)}
          </p>
        )}
      </div>

      {/* Badge de número */}
      <div 
        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: corPrimaria }}
      >
        #{index + 1}
      </div>
    </Link>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL: VideoFeedPreview
// ============================================================================
export function VideoFeedPreview({
  products,
  dominio,
  corPrimaria = '#DB1472',
  title = 'Reels',
  maxItems = 4,
  basePath = '/site',
}: VideoFeedPreviewProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Pegar apenas os X mais recentes
  const displayProducts = products.slice(0, maxItems);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${corPrimaria}15` }}
          >
            <Film 
              className="w-4 h-4" 
              style={{ color: corPrimaria }}
            />
          </div>
          <h2 className="font-bold text-base text-gray-900">{title}</h2>
        </div>
        
        {/* Botão Ver Completo no header */}
        <Link
          href={`${basePath}/${dominio}/reels`}
          className="flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: corPrimaria }}
        >
          Ver Completo
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Carrossel Horizontal */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
          {displayProducts.map((product, index) => (
            <div key={product.id} className="flex-shrink-0 w-32 snap-start">
              <VideoThumbnail
                product={product}
                index={index}
                corPrimaria={corPrimaria}
                dominio={dominio}
                basePath={basePath}
                onHover={setHoveredIndex}
                isHovered={hoveredIndex === index}
              />
            </div>
          ))}
        </div>
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

export default VideoFeedPreview;
