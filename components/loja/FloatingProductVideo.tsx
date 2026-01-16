/**
 * VÍDEO FLUTUANTE DO PRODUTO - Estilo Story Circle
 * Fica fixo na tela (position: fixed) enquanto o usuário navega
 * Formato circular como stories do Instagram
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react';

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
        // Autoplay bloqueado, ok
      });
    }
  }, []);

  // Controlar play/pause do vídeo expandido
  useEffect(() => {
    if (isExpanded && fullVideoRef.current) {
      fullVideoRef.current.play().catch(() => {});
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
      {/* 🎬 VÍDEO MINI FLUTUANTE - Circular, fixo na tela no canto superior esquerdo */}
      {!isExpanded && (
        <div 
          className="fixed top-28 left-4 z-50 cursor-pointer group"
          onClick={() => setIsExpanded(true)}
        >
          {/* Anel de gradiente animado (estilo story) */}
          <div 
            className="relative p-1 rounded-full animate-pulse"
            style={{ 
              background: `linear-gradient(45deg, ${corPrimaria}, #ff6b9d, ${corPrimaria})`,
            }}
          >
            {/* Container circular do vídeo */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-black border-2 border-white">
              <video
                ref={miniVideoRef}
                src={videoUrl}
                className="w-full h-full object-cover scale-150"
                loop
                muted
                playsInline
                autoPlay
              />
              
              {/* Overlay escuro sutil */}
              <div className="absolute inset-0 bg-black/10" />
              
              {/* Ícone de play no hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          {/* Label "Vídeo" abaixo do círculo */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-lg"
              style={{ backgroundColor: corPrimaria }}
            >
              📹 Vídeo
            </span>
          </div>
        </div>
      )}

      {/* 🎬 VÍDEO EXPANDIDO - Modal fullscreen */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          {/* Vídeo centralizado */}
          <div className="relative w-full max-w-md mx-4 aspect-[9/16] bg-black rounded-2xl overflow-hidden">
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
            
            {/* Overlay de controles */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Gradiente superior */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
              
              {/* Gradiente inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            
            {/* Indicador de pause no centro */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            )}
            
            {/* Header com botões */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
              {/* Nome do produto */}
              <h3 className="text-white font-semibold text-sm truncate max-w-[60%] drop-shadow-lg">
                {productName}
              </h3>
              
              {/* Botões */}
              <div className="flex gap-2">
                {/* Botão mudo/som */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-2.5 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all"
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
                  className="p-2.5 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Footer com label */}
            <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: corPrimaria }}
                >
                  📹 Vídeo do Produto
                </span>
                <span className="text-white/70 text-xs">
                  Toque para pausar
                </span>
              </div>
            </div>
            
            {/* Barra de progresso animada no topo (estilo story) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30">
              <div 
                className="h-full animate-progress"
                style={{ 
                  backgroundColor: corPrimaria,
                  animation: 'progress 15s linear infinite'
                }}
              />
            </div>
          </div>
          
          {/* Área clicável para fechar (fora do vídeo) */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={() => setIsExpanded(false)}
          />
        </div>
      )}

      {/* CSS para animação da barra de progresso */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 15s linear infinite;
        }
      `}</style>
    </>
  );
}
