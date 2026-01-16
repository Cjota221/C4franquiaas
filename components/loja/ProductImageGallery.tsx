/**
 * Galeria de Imagens Moderna - OTIMIZADA PARA 960x1280
 * - Imagem principal grande em alta resolução
 * - Proporção 3:4 (960x1280) para máximo aproveitamento
 * - Dots de navegação
 * - Ícone de favoritar (coração) flutuante
 * - Suporte a swipe/touch
 * - Next/Image com quality=95 para máxima nitidez
 * - Vídeo flutuante no canto (se disponível)
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Heart, ChevronLeft, ChevronRight, Play, X, Volume2, VolumeX } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  onFavorite?: () => void;
  isFavorite?: boolean;
  videoUrl?: string | null;
}

export function ProductImageGallery({
  images,
  productName,
  onFavorite,
  isFavorite = false,
  videoUrl,
}: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Estados para o vídeo flutuante
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const floatingVideoRef = useRef<HTMLVideoElement>(null);
  
  // Auto-play do vídeo flutuante quando montado
  useEffect(() => {
    if (floatingVideoRef.current && videoUrl) {
      floatingVideoRef.current.play().catch(() => {
        // Autoplay bloqueado, ok
      });
    }
  }, [videoUrl]);

  const validImages = images.filter(Boolean);

  if (validImages.length === 0) {
    return (
      <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-400">Sem imagem</p>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    setIsLoading(true);
    setHasError(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    setIsLoading(true);
    setHasError(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative w-full">
      {/* Container da Imagem Principal - Proporção 3:4 (960x1280) */}
      <div
        className="relative w-full bg-white overflow-hidden rounded-lg"
        style={{ aspectRatio: '3 / 4' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-5">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-5">
            <p className="text-gray-500 text-sm">Erro ao carregar imagem</p>
          </div>
        )}

        <Image
          src={validImages[currentIndex]}
          alt={`${productName} - Imagem ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 95vw, (max-width: 1024px) 50vw, 600px"
          quality={95}
          priority={currentIndex === 0}
          unoptimized={false}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Botão Favoritar (Coração Flutuante) */}
        {onFavorite && (
          <button
            onClick={onFavorite}
            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all z-10"
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorite ? 'fill-pink-600 text-pink-600' : 'text-gray-700'
              }`}
            />
          </button>
        )}

        {/* 🎬 VÍDEO FLUTUANTE - Canto inferior esquerdo */}
        {videoUrl && !videoExpanded && (
          <div 
            className="absolute bottom-4 left-4 z-20 cursor-pointer group"
            onClick={() => setVideoExpanded(true)}
          >
            {/* Container do vídeo mini */}
            <div className="relative w-20 h-28 md:w-24 md:h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-white bg-black">
              <video
                ref={floatingVideoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                autoPlay
              />
              {/* Overlay com gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Badge "Vídeo do Produto" */}
              <div className="absolute top-1 left-1 right-1">
                <span className="text-[8px] md:text-[10px] font-bold text-white bg-pink-600/90 px-1.5 py-0.5 rounded-full">
                  📹 VÍDEO
                </span>
              </div>
              
              {/* Ícone de play no centro */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-4 h-4 text-pink-600 ml-0.5" />
                </div>
              </div>
              
              {/* Indicador de que está rodando */}
              <div className="absolute bottom-1 right-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🎬 VÍDEO EXPANDIDO - Tela cheia sobre a imagem */}
        {videoUrl && videoExpanded && (
          <div className="absolute inset-0 z-30 bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              loop
              muted={videoMuted}
              playsInline
              autoPlay
            />
            
            {/* Controles do vídeo expandido */}
            <div className="absolute top-4 right-4 flex gap-2">
              {/* Botão mudo/som */}
              <button
                onClick={() => setVideoMuted(!videoMuted)}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
              >
                {videoMuted ? (
                  <VolumeX className="w-5 h-5 text-gray-700" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-700" />
                )}
              </button>
              
              {/* Botão fechar */}
              <button
                onClick={() => setVideoExpanded(false)}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* Label */}
            <div className="absolute bottom-4 left-4">
              <span className="text-sm font-semibold text-white bg-pink-600/90 px-3 py-1.5 rounded-full">
                📹 Vídeo do Produto
              </span>
            </div>
          </div>
        )}

        {/* Botões de Navegação (Desktop) */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all hidden md:flex items-center justify-center"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all hidden md:flex items-center justify-center"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores (Dots) */}
      {validImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-black'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ver imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
