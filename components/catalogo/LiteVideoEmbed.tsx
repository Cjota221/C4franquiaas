'use client';

/**
 * 🎬 LITE VIDEO EMBED - Carregamento Otimizado de Vídeo
 * 
 * Padrão "Lite Embed" para performance:
 * - Carrega apenas thumbnail inicialmente
 * - Player de vídeo só é injetado após clique
 * - Reduz drasticamente o tempo de carregamento da página
 * 
 * @author C4 Franquias
 */

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface LiteVideoEmbedProps {
  videoUrl: string;
  thumbnailUrl?: string;
  productName: string;
  aspectRatio?: '16/9' | '9/16' | '1/1' | '3/4' | '4/3';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  autoPlay?: boolean;
  className?: string;
}

export default function LiteVideoEmbed({
  videoUrl,
  thumbnailUrl,
  productName,
  aspectRatio = '9/16',
  borderRadius = 'medium',
  autoPlay = true,
  className = '',
}: LiteVideoEmbedProps) {
  const [isActivated, setIsActivated] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Border radius baseado na config
  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'none': return '0px';
      case 'small': return '8px';
      case 'large': return '24px';
      default: return '16px';
    }
  };

  // Ativar vídeo ao clicar
  const handleActivate = useCallback(() => {
    setIsActivated(true);
  }, []);

  // Controlar mute
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Gerar thumbnail padrão se não fornecido
  const defaultThumbnail = thumbnailUrl || '/placeholder-video.png';

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={{ 
        aspectRatio,
        borderRadius: getBorderRadius()
      }}
    >
      {/* Estado inicial: Apenas thumbnail + botão play */}
      {!isActivated ? (
        <button
          onClick={handleActivate}
          className="absolute inset-0 w-full h-full group cursor-pointer"
          aria-label={`Assistir vídeo de ${productName}`}
        >
          {/* Thumbnail */}
          {thumbnailUrl ? (
            <Image
              src={defaultThumbnail}
              alt={`Vídeo de ${productName}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
          )}

          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

          {/* Botão Play central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/90 shadow-2xl flex items-center justify-center transform transition-all group-hover:scale-110 group-hover:bg-white">
              <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Badge "Vídeo" */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
            <Play className="w-3 h-3" fill="currentColor" />
            Vídeo
          </div>
        </button>
      ) : (
        /* Estado ativado: Player de vídeo real */
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            className="w-full h-full object-cover"
            autoPlay={autoPlay}
            loop
            muted={isMuted}
            playsInline
            controls={false}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Controles customizados */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {/* Botão Mute/Unmute */}
            <button
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Overlay para play/pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
