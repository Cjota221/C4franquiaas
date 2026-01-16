/**
 * 🚀 SMART VIDEO PLAYER - Otimizado para 10.000+ produtos
 * 
 * ESTRATÉGIA DE PERFORMANCE:
 * 1. Lazy Loading: Só carrega o vídeo quando visível na tela
 * 2. Delay Inteligente: Só dá play após 1s parado no viewport
 * 3. Poster First: Mostra imagem de capa até o vídeo estar pronto
 * 4. Preload None: Não baixa nada até ser necessário
 * 5. Cleanup automático: Pausa e limpa quando sai da tela
 * 
 * USO:
 * <SmartVideoPlayer 
 *   src="https://..." 
 *   poster="https://..." 
 *   onView={() => trackAnalytics()}
 * />
 */

"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Play, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface SmartVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  autoPlayOnView?: boolean;
  viewDelayMs?: number; // Delay antes de dar play (default: 1000ms)
  muted?: boolean;
  loop?: boolean;
  onView?: () => void; // Callback quando vídeo entra na tela
  onPlay?: () => void; // Callback quando vídeo começa a tocar
  onError?: (error: Error) => void;
}

// Configurações de performance
const INTERSECTION_THRESHOLD = 0.5; // 50% visível para considerar "em view"
const ROOT_MARGIN = '100px'; // Pré-carregar 100px antes de entrar na tela
const DEFAULT_VIEW_DELAY = 1000; // 1 segundo parado para dar play

function SmartVideoPlayerComponent({
  src,
  poster,
  className = '',
  aspectRatio = '9:16',
  autoPlayOnView = true,
  viewDelayMs = DEFAULT_VIEW_DELAY,
  muted = true,
  loop = true,
  onView,
  onPlay,
  onError,
}: SmartVideoPlayerProps) {
  // ============================================
  // ESTADOS
  // ============================================
  const [isInView, setIsInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showPoster, setShowPoster] = useState(true);

  // ============================================
  // REFS
  // ============================================
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedRef = useRef(false);

  // ============================================
  // ASPECT RATIO CLASSES
  // ============================================
  const aspectClasses = {
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
  };

  // ============================================
  // INTERSECTION OBSERVER - Detecta visibilidade
  // ============================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const visible = entry.isIntersecting;
        
        setIsInView(visible);

        if (visible) {
          // Vídeo entrou na tela
          onView?.();
          
          // Iniciar timer para carregar após delay
          if (autoPlayOnView && !hasPlayedRef.current) {
            viewTimerRef.current = setTimeout(() => {
              setShouldLoad(true);
            }, viewDelayMs);
          }
        } else {
          // Vídeo saiu da tela - limpar timer e pausar
          if (viewTimerRef.current) {
            clearTimeout(viewTimerRef.current);
            viewTimerRef.current = null;
          }
          
          // Pausar vídeo quando sair da tela (economia de recursos)
          if (videoRef.current && isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      {
        threshold: INTERSECTION_THRESHOLD,
        rootMargin: ROOT_MARGIN,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [autoPlayOnView, viewDelayMs, onView, isPlaying]);

  // ============================================
  // AUTO-PLAY quando shouldLoad muda
  // ============================================
  useEffect(() => {
    if (shouldLoad && videoRef.current && isInView) {
      setIsLoading(true);
      
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          setShowPoster(false);
          hasPlayedRef.current = true;
          onPlay?.();
        })
        .catch((err) => {
          console.warn('Autoplay bloqueado:', err);
          setIsLoading(false);
          // Autoplay bloqueado é ok, usuário pode clicar
        });
    }
  }, [shouldLoad, isInView, onPlay]);

  // ============================================
  // HANDLERS
  // ============================================
  const handlePlayClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setShouldLoad(true);

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      video.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          setShowPoster(false);
          hasPlayedRef.current = true;
          onPlay?.();
        })
        .catch((err) => {
          setIsLoading(false);
          setHasError(true);
          onError?.(err);
        });
    }
  }, [isPlaying, onPlay, onError]);

  const handleVideoError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error('Erro ao carregar vídeo'));
  }, [onError]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-900 ${aspectClasses[aspectRatio]} ${className}`}
      onClick={handlePlayClick}
    >
      {/* POSTER - Mostrado até o vídeo começar */}
      {poster && showPoster && (
        <img 
          src={poster} 
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* VIDEO - Só carrega a tag quando shouldLoad=true */}
      {shouldLoad && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPoster ? 'opacity-0' : 'opacity-100'}`}
          muted={isMuted}
          loop={loop}
          playsInline
          preload="none" // CRÍTICO: Não baixa nada até dar play
          onError={handleVideoError}
          onCanPlay={handleCanPlay}
          onEnded={() => !loop && setIsPlaying(false)}
        />
      )}

      {/* OVERLAY DE CONTROLES */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* BOTÃO PLAY/PAUSE CENTRAL */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all pointer-events-auto">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* LOADING SPINNER */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* BOTÃO MUTE (canto inferior direito) */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all pointer-events-auto"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}

      {/* INDICADOR DE ERRO */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <p className="text-white text-sm">Erro ao carregar vídeo</p>
        </div>
      )}

      {/* DEBUG INFO (remover em produção) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 text-[10px] text-white/70 bg-black/50 px-1 rounded">
          {isInView ? '👁️ View' : '🚫 Out'} | {shouldLoad ? '✅ Loaded' : '⏳ Wait'} | {isPlaying ? '▶️' : '⏸️'}
        </div>
      )}
    </div>
  );
}

// MEMO para evitar re-renders desnecessários
export const SmartVideoPlayer = memo(SmartVideoPlayerComponent);
export default SmartVideoPlayer;
