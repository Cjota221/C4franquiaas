/**
 * FLOATING VIDEO BUBBLE - Estilo Widde
 * Widget flutuante que fica fixo na tela durante toda a navegação
 * 
 * COMPORTAMENTO:
 * - Position: fixed no canto inferior direito
 * - Fica "pregado" na tela, não se move com o scroll
 * - Círculo pequeno (70px) como preview
 * - Clique abre modal fullscreen com som
 * - Carrega o vídeo específico de cada produto
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX, Play } from 'lucide-react';

interface FloatingProductVideoProps {
  videoUrl: string;
  productName?: string;
  corPrimaria?: string;
}

export function FloatingProductVideo({ 
  videoUrl, 
  productName = 'Produto',
  corPrimaria = '#DB1472'
}: FloatingProductVideoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const fullVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-play do vídeo mini quando montado
  useEffect(() => {
    if (miniVideoRef.current) {
      miniVideoRef.current.play().catch(() => {
        // Autoplay bloqueado pelo browser, ok
      });
    }
  }, []);

  // Controlar vídeo expandido
  useEffect(() => {
    if (isExpanded && fullVideoRef.current) {
      fullVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isExpanded]);

  const togglePlay = () => {
    if (fullVideoRef.current) {
      if (isPlaying) {
        fullVideoRef.current.pause();
      } else {
        fullVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      {/* ============================================ */}
      {/* 🎬 FLOATING VIDEO BUBBLE - Preview Circular */}
      {/* ============================================ */}
      {/* 
        - position: fixed = fica "pregado" na viewport
        - bottom-6 right-6 = canto inferior direito
        - z-50 = fica POR CIMA de todo o conteúdo
        - Não se move quando o usuário faz scroll
      */}
      {!isExpanded && (
        <div 
          className="fixed top-36 left-4 z-50 cursor-pointer group"
          onClick={() => setIsExpanded(true)}
          style={{ 
            // Garantir que fica acima de tudo
            zIndex: 9999 
          }}
        >
          {/* Anel gradiente estático */}
          <div 
            className="relative p-[3px] rounded-full"
            style={{ 
              background: `linear-gradient(135deg, ${corPrimaria}, #ff6b9d, ${corPrimaria})`,
            }}
          >
            {/* Container circular do vídeo - 70x70px */}
            <div 
              className="relative rounded-full overflow-hidden bg-black"
              style={{
                width: '70px',
                height: '70px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 0 2px white'
              }}
            >
              {/* Vídeo preview - mudo e autoplay */}
              <video
                ref={miniVideoRef}
                src={videoUrl}
                className="w-full h-full object-cover scale-[1.5]"
                loop
                muted
                playsInline
                autoPlay
              />
              
              {/* Overlay de hover com ícone play */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-6 h-6 text-white drop-shadow-lg" fill="white" />
              </div>
            </div>
          </div>
          
          {/* Label "Vídeo" */}
          <div 
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-lg"
              style={{ backgroundColor: corPrimaria }}
            >
              ▶ Vídeo
            </span>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 🎬 MODAL FULLSCREEN - Vídeo expandido */}
      {/* ============================================ */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center"
          onClick={() => setIsExpanded(false)}
        >
          {/* Container do vídeo - aspect ratio 9:16 */}
          <div 
            className="relative w-full max-w-sm mx-4 aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Vídeo principal */}
            <video
              ref={fullVideoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              autoPlay
              onClick={togglePlay}
            />
            
            {/* Gradientes de overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
            
            {/* Indicador de pause */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
            
            {/* Header - Nome e botões */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm truncate max-w-[60%] drop-shadow-lg">
                {productName}
              </h3>
              
              <div className="flex gap-2">
                {/* Botão som */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-2.5 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                
                {/* Botão fechar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="p-2.5 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: corPrimaria }}
                >
                  ▶ Vídeo do Produto
                </span>
                <span className="text-white/60 text-xs">
                  Toque para pausar
                </span>
              </div>
            </div>
            
            {/* Barra de progresso estilo story */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t-2xl overflow-hidden">
              <div 
                className="h-full rounded-full"
                style={{ 
                  backgroundColor: corPrimaria,
                  animation: 'progressBar 10s linear infinite'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Animação CSS */}
      <style jsx>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </>
  );
}

