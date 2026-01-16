'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, X, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';

// ============================================================================
// TIPOS
// ============================================================================
interface ProductStoryCircleProps {
  videoUrl: string;
  thumbnailUrl?: string;
  productName: string;
  storeName?: string;
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// COMPONENTE: Círculo Animado (Story)
// ============================================================================
export default function ProductStoryCircle({
  videoUrl,
  thumbnailUrl,
  productName,
  storeName,
  primaryColor = '#DB1472',
  size = 'md',
  className = '',
}: ProductStoryCircleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Tamanhos
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };
  
  const borderWidth = {
    sm: '2px',
    md: '3px',
    lg: '4px',
  };
  
  // Abrir modal e carregar vídeo
  const openModal = useCallback(() => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);
  
  // Fechar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsPlaying(false);
    setProgress(0);
    document.body.style.overflow = '';
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);
  
  // Controles do vídeo
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }, [isMuted]);
  
  // Atualizar progresso
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isModalOpen) return;
    
    const handleTimeUpdate = () => {
      const prog = (video.currentTime / video.duration) * 100;
      setProgress(prog);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      video.currentTime = 0;
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isModalOpen]);
  
  // Auto-play quando modal abre
  useEffect(() => {
    if (isModalOpen && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, [isModalOpen]);
  
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    
    if (isModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, closeModal]);
  
  return (
    <>
      {/* Círculo com borda animada */}
      <button
        onClick={openModal}
        className={`relative ${sizeClasses[size]} ${className} group`}
        aria-label={`Ver vídeo de ${productName}`}
      >
        {/* Borda animada (gradient rotating) */}
        <div 
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            padding: borderWidth[size],
            background: `conic-gradient(from 0deg, ${primaryColor}, #8B5CF6, ${primaryColor})`,
          }}
        >
          <div className="w-full h-full rounded-full bg-white" />
        </div>
        
        {/* Thumbnail */}
        <div className="absolute inset-1 rounded-full overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={productName}
              fill
              className="object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Play 
                className="w-1/2 h-1/2 ml-0.5"
                style={{ color: primaryColor }}
              />
            </div>
          )}
        </div>
        
        {/* Ícone de Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <Play className="w-4 h-4 text-white ml-0.5" />
          </div>
        </div>
      </button>
      
      {/* Modal Fullscreen */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={closeModal}
        >
          {/* Barra de progresso (estilo stories) */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            {/* Info da loja */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {storeName?.charAt(0).toUpperCase() || 'L'}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{storeName || 'Loja'}</p>
                <p className="text-white/70 text-xs">{productName}</p>
              </div>
            </div>
            
            {/* Botão fechar */}
            <button
              onClick={closeModal}
              className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Vídeo Container */}
          <div 
            className="relative w-full max-w-md h-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              muted={isMuted}
              playsInline
              onClick={togglePlay}
            />
            
            {/* Controle de som */}
            <button
              onClick={toggleMute}
              className="absolute bottom-24 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            {/* Play/Pause overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </button>
            )}
          </div>
          
          {/* Controles de navegação (se houver múltiplos vídeos) */}
          {/* <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
            <ChevronRight className="w-6 h-6" />
          </button> */}
        </div>
      )}
      
      {/* CSS para animação */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
}

// ============================================================================
// COMPONENTE: Múltiplos Stories (para múltiplos vídeos)
// ============================================================================
export function ProductStoriesRow({
  stories,
  primaryColor = '#DB1472',
  className = '',
}: {
  stories: Array<{
    videoUrl: string;
    thumbnailUrl?: string;
    productName: string;
    storeName?: string;
  }>;
  primaryColor?: string;
  className?: string;
}) {
  if (stories.length === 0) return null;
  
  return (
    <div className={`flex gap-3 overflow-x-auto pb-2 ${className}`}>
      {stories.map((story, index) => (
        <ProductStoryCircle
          key={index}
          {...story}
          primaryColor={primaryColor}
          size="md"
        />
      ))}
    </div>
  );
}
