/**
 * 🎬 REELS PREVIEW - Grid de 4 vídeos para Home
 * 
 * Exibe um preview dos vídeos disponíveis em formato grid 2x2
 * Com área "Ver Reels" que cobre parcialmente os vídeos
 * Clique abre o modo imersivo estilo TikTok/Instagram (/reels)
 */

"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, ChevronRight, Sparkles } from 'lucide-react';
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
  onHover: (index: number | null) => void;
  isHovered: boolean;
  showOverlay?: boolean;
}

const MiniVideoCard = memo(function MiniVideoCard({
  product,
  index,
  corPrimaria,
  onHover,
  isHovered,
  showOverlay = false,
}: MiniVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause on hover
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered && !showOverlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered, showOverlay]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div
      className="relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer"
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

      {/* Play Icon (só aparece quando não tem overlay) */}
      {!showOverlay && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${corPrimaria}dd` }}
          >
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}

      {/* Ring animado no hover */}
      <div 
        className={`absolute inset-0 rounded-xl border-2 transition-all ${isHovered && !showOverlay ? 'border-opacity-100' : 'border-opacity-0'}`}
        style={{ borderColor: corPrimaria }}
      />

      {/* Info do Produto - apenas nos 2 primeiros */}
      {!showOverlay && (
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-[10px] font-medium line-clamp-1 drop-shadow-lg">
            {product.nome}
          </p>
          {product.preco && (
            <p className="text-white font-bold text-xs drop-shadow-lg">
              {formatPrice(product.preco)}
            </p>
          )}
        </div>
      )}
    </div>
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

  // Calcular quantos vídeos extras existem
  const extraCount = products.length > maxItems ? products.length - maxItems : 0;

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
        </div>
      </div>

      {/* Grid de Vídeos com área "Ver Reels" */}
      <div className="px-4">
        <Link 
          href={`/loja/${dominio}/reels`}
          className="block relative"
        >
          {/* Grid 2x2 de vídeos */}
          <div className="grid grid-cols-2 gap-2">
            {displayProducts.map((product, index) => (
              <MiniVideoCard
                key={product.id}
                product={product}
                index={index}
                corPrimaria={corPrimaria}
                onHover={setHoveredIndex}
                isHovered={hoveredIndex === index}
                showOverlay={index >= 2} // Os 2 últimos ficam com overlay
              />
            ))}
          </div>

          {/* Overlay "Ver Reels" cobrindo os 2 últimos vídeos */}
          <div 
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center rounded-b-xl transition-all hover:opacity-95"
            style={{ 
              background: `linear-gradient(to top, ${corPrimaria}f0 0%, ${corPrimaria}dd 50%, ${corPrimaria}00 100%)`,
              height: '55%',
            }}
          >
            <div className="text-center text-white pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="text-xl font-bold tracking-tight">Ver Reels</span>
                <ChevronRight className="w-5 h-5" />
              </div>
              <p className="text-white/90 text-sm font-medium">
                {products.length} vídeos disponíveis
                {extraCount > 0 && ` (+${extraCount})`}
              </p>
              <p className="text-white/70 text-xs mt-1">
                Arraste para cima e descubra mais
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* CSS */}
      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}

export default ReelsPreview;
