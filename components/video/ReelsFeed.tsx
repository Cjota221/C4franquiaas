/**
 * 🎬 REELS FEED - Feed Imersivo estilo TikTok
 * 
 * FEATURES:
 * - Scroll Snap CSS puro (snap-y snap-mandatory)
 * - 100% da viewport (h-[100dvh])
 * - IntersectionObserver para play/pause automático
 * - Overlay de produtos com informações e botões
 * - Botões de interação (Like, Compartilhar)
 * - playsInline para mobile
 * 
 * @author C4 Franquias
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Heart, 
  ShoppingBag, 
  Share2, 
  Volume2, 
  VolumeX,
  Play,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================================================
// TIPOS
// ============================================================================
export interface ReelItem {
  id: string;
  nome: string;
  preco: number;
  precoOriginal?: number;
  videoUrl: string;
  posterUrl?: string;
  descricao?: string;
  loja?: {
    nome: string;
    logo?: string;
    slug: string;
  };
}

interface ReelsFeedProps {
  reels: ReelItem[];
  initialIndex?: number;
  onClose: () => void;
  onFavorite?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  onShare?: (reel: ReelItem) => void;
  corPrimaria?: string;
  dominio: string;
  isFavorite?: (id: string) => boolean;
}

// ============================================================================
// COMPONENTE: Single Reel Card
// ============================================================================
interface ReelCardProps {
  reel: ReelItem;
  isActive: boolean;
  shouldLoad: boolean; // Novo: controla se deve carregar o vídeo
  isMuted: boolean;
  onToggleMute: () => void;
  onFavorite: () => void;
  onAddToCart: () => void;
  onShare: () => void;
  onViewProduct: () => void;
  isFavorited: boolean;
  corPrimaria: string;
  dominio: string;
}

function ReelCard({
  reel,
  isActive,
  shouldLoad,
  isMuted,
  onToggleMute,
  onFavorite,
  onAddToCart: _onAddToCart,
  onShare,
  onViewProduct: _onViewProduct,
  isFavorited,
  corPrimaria,
  dominio,
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showMuteHint, setShowMuteHint] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const maxRetries = 3;

  // Esconder dica de som após 5 segundos
  useEffect(() => {
    if (isActive && isMuted && showMuteHint) {
      const timer = setTimeout(() => {
        setShowMuteHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, isMuted, showMuteHint]);

  // Esconder dica quando usuário ativa o som
  useEffect(() => {
    if (!isMuted) {
      setShowMuteHint(false);
    }
  }, [isMuted]);

  // Limpar blob URL quando componente desmontar
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Play/Pause baseado em isActive (controlado pelo pai)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (isActive) {
      // Tentar dar play
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setShowPlayButton(false);
          })
          .catch(() => {
            // Autoplay bloqueado - mostrar botão de play
            setShowPlayButton(true);
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, shouldLoad]);

  // Handlers de eventos do vídeo
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsBuffering(false);
    setIsLoading(false);
    setHasError(false); // Resetar erro quando começar a tocar
    setRetryCount(0); // Resetar contador de tentativas
  }, []);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const error = video.error;
    
    // Ignorar erros de carregamento se o vídeo ainda não foi carregado
    if (error?.code === MediaError.MEDIA_ERR_ABORTED) {
      // Usuário ou browser abortou o carregamento - não é erro real
      return;
    }
    
    // Códigos de erro: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
    const isRetryableError = error?.code === MediaError.MEDIA_ERR_NETWORK || 
                              error?.code === MediaError.MEDIA_ERR_DECODE ||
                              error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
    
    // Tentar recarregar em caso de erro (até maxRetries vezes)
    if (isRetryableError && retryCount < maxRetries) {
      console.warn(`Erro no vídeo código ${error?.code} (tentativa ${retryCount + 1}/${maxRetries}), recarregando...`);
      setRetryCount(prev => prev + 1);
      
      // Usar blob URL como fallback na segunda tentativa em diante
      if (retryCount >= 1) {
        // Tentar carregar via fetch como blob
        fetch(reel.videoUrl, { mode: 'cors' })
          .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.blob();
          })
          .then(blob => {
            const newBlobUrl = URL.createObjectURL(blob);
            setBlobUrl(newBlobUrl);
            video.src = newBlobUrl;
            video.load();
          })
          .catch(() => {
            setHasError(true);
            setIsLoading(false);
          });
        return;
      }
      
      // Primeira tentativa: cache buster
      const separator = reel.videoUrl.includes('?') ? '&' : '?';
      video.src = `${reel.videoUrl}${separator}retry=${Date.now()}`;
      video.load();
      return;
    }
    
    setIsLoading(false);
    setHasError(true);
    console.error('Erro ao carregar vídeo:', reel.videoUrl, error?.message || 'Erro desconhecido');
  }, [reel.videoUrl, retryCount, maxRetries]);

  // Controle de mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Toggle play/pause ao clicar no vídeo
  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
      setShowPlayButton(false);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowPlayButton(true);
    }
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const hasDiscount = reel.precoOriginal && reel.precoOriginal > reel.preco;
  const discountPercent = hasDiscount 
    ? Math.round((1 - reel.preco / reel.precoOriginal!) * 100) 
    : 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] snap-start snap-always flex-shrink-0 bg-black lg:bg-gray-900"
    >
      {/* ============================================ */}
      {/* LAYOUT DESKTOP: Vídeo formato stories + Card lateral */}
      {/* ============================================ */}
      <div className="hidden lg:flex h-full items-center justify-center gap-8 px-8">
        {/* Container do Vídeo - formato stories (9:16) */}
        <div className="relative h-[90vh] aspect-[9/16] max-h-[800px] rounded-3xl overflow-hidden shadow-2xl bg-black">
          {/* Poster como background */}
          {reel.posterUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${reel.posterUrl})` }}
            />
          )}

          {/* Loading/Buffering */}
          {(isLoading || isBuffering) && !hasError && shouldLoad && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Erro */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
              <p className="text-white text-sm">Não foi possível carregar o vídeo</p>
            </div>
          )}

          {/* Vídeo */}
          {shouldLoad && (
            <video
              ref={videoRef}
              src={reel.videoUrl}
              poster={reel.posterUrl}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              onClick={handleVideoClick}
              onLoadStart={handleLoadStart}
              onCanPlay={handleCanPlay}
              onWaiting={handleWaiting}
              onPlaying={handlePlaying}
              onError={handleError}
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

          {/* Dica de som */}
          {isMuted && isPlaying && showMuteHint && (
            <button
              onClick={onToggleMute}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-30"
            >
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full animate-pulse">
                <VolumeX className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-medium">Toque para ativar o som</span>
              </div>
            </button>
          )}

          {/* Botão Play central */}
          {showPlayButton && !isPlaying && (
            <button
              onClick={handleVideoClick}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>
          )}

          {/* Botões laterais no vídeo (desktop) */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
            <button onClick={onFavorite} className="flex flex-col items-center group">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isFavorited ? 'scale-110' : 'bg-black/40 backdrop-blur-sm group-hover:bg-black/60'
                }`}
                style={{ backgroundColor: isFavorited ? corPrimaria : undefined }}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'text-white fill-white' : 'text-white'}`} />
              </div>
            </button>
            <button onClick={onShare} className="flex flex-col items-center group">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-all">
                <Share2 className="w-5 h-5 text-white" />
              </div>
            </button>
            <button onClick={onToggleMute} className="flex flex-col items-center group">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-all">
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </div>
            </button>
          </div>
        </div>

        {/* Card do Produto - Desktop */}
        <div className="w-[380px] flex-shrink-0">
          {/* Info da Loja */}
          {reel.loja && (
            <div className="flex items-center gap-3 mb-6">
              {reel.loja.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={reel.loja.logo} 
                  alt={reel.loja.nome}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: corPrimaria }}
                >
                  {reel.loja.nome.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-white font-semibold text-lg block">{reel.loja.nome}</span>
                <span className="text-gray-400 text-sm">@{reel.loja.slug}</span>
              </div>
            </div>
          )}

          {/* Card Principal */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            {/* Imagem do produto */}
            {reel.posterUrl && (
              <div className="mb-4 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={reel.posterUrl} 
                  alt={reel.nome}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Nome do Produto */}
            <h2 className="font-bold text-gray-900 text-xl mb-2 line-clamp-2">
              {reel.nome}
            </h2>

            {/* Descrição */}
            {reel.descricao && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {reel.descricao}
              </p>
            )}

            {/* Preço */}
            <div className="flex items-center gap-3 mb-6">
              <span 
                className="font-bold text-3xl"
                style={{ color: corPrimaria }}
              >
                {formatPrice(reel.preco)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-gray-400 line-through text-lg">
                    {formatPrice(reel.precoOriginal!)}
                  </span>
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Botão Comprar */}
            <Link
              href={`/site/${dominio}/produto/${reel.id}`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: corPrimaria }}
            >
              <ShoppingBag className="w-6 h-6" />
              <span>Comprar Agora</span>
            </Link>

            {/* Botão Favoritar */}
            <button
              onClick={onFavorite}
              className={`flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-2xl font-semibold transition-all border-2 ${
                isFavorited 
                  ? 'border-2' 
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              style={isFavorited ? { 
                backgroundColor: `${corPrimaria}15`, 
                borderColor: corPrimaria, 
                color: corPrimaria 
              } : undefined}
            >
              <Heart className="w-5 h-5" style={isFavorited ? { fill: corPrimaria } : undefined} />
              <span>{isFavorited ? 'Salvo nos Favoritos' : 'Adicionar aos Favoritos'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LAYOUT MOBILE: Fullscreen (original) */}
      {/* ============================================ */}
      <div className="lg:hidden absolute inset-0">
        {/* Poster como background enquanto carrega */}
        {reel.posterUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${reel.posterUrl})` }}
          />
        )}

        {/* Loading/Buffering spinner */}
        {(isLoading || isBuffering) && !hasError && shouldLoad && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Erro ao carregar */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
            <div className="text-center text-white">
              <p className="text-sm">Não foi possível carregar o vídeo</p>
            </div>
          </div>
        )}

        {/* Vídeo em tela cheia - só carrega src se shouldLoad = true */}
        {shouldLoad && (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.posterUrl}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onClick={handleVideoClick}
            onLoadStart={handleLoadStart}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onError={handleError}
          />
        )}

        {/* Overlay escuro para contraste */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />

        {/* Indicador de som mutado - toque para ativar */}
        {isMuted && isPlaying && showMuteHint && (
          <button
            onClick={onToggleMute}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-pulse"
          >
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <VolumeX className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Toque para ativar o som</span>
            </div>
          </button>
        )}

        {/* Botão de Play central (quando pausado) */}
        {showPlayButton && !isPlaying && (
          <button
            onClick={handleVideoClick}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
          </button>
        )}

        {/* BOTÕES DE INTERAÇÃO LATERAL (direita) */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
          {/* Like */}
          <button
            onClick={onFavorite}
            className="flex flex-col items-center group"
          >
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isFavorited 
                  ? 'bg-red-500 scale-110' 
                  : 'bg-black/40 backdrop-blur-sm group-hover:bg-black/60'
              }`}
            >
              <Heart 
                className={`w-6 h-6 transition-colors ${
                  isFavorited ? 'text-white fill-white' : 'text-white'
                }`} 
              />
            </div>
            <span className="text-white text-xs mt-1 drop-shadow-lg">Curtir</span>
          </button>

          {/* Comentários (visual) */}
          <button className="flex flex-col items-center group">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-all">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1 drop-shadow-lg">Comentar</span>
          </button>

          {/* Compartilhar */}
          <button
            onClick={onShare}
            className="flex flex-col items-center group"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-all">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1 drop-shadow-lg">Enviar</span>
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className="flex flex-col items-center group"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-all">
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-white text-xs mt-1 drop-shadow-lg">
              {isMuted ? 'Ativar' : 'Mudo'}
            </span>
          </button>
        </div>

        {/* OVERLAY DE PRODUTO (inferior) - Mobile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-20">
          {/* Info da Loja */}
          {reel.loja && (
            <div className="flex items-center gap-2 mb-3">
              {reel.loja.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={reel.loja.logo} 
                  alt={reel.loja.nome}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: corPrimaria }}
                >
                  {reel.loja.nome.charAt(0)}
                </div>
              )}
              <span className="text-white font-semibold text-sm drop-shadow-lg">
                {reel.loja.nome}
              </span>
            </div>
          )}

          {/* Card do Produto */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl">
            <div className="flex gap-3">
              {/* Thumbnail do produto */}
              {reel.posterUrl && (
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={reel.posterUrl} 
                    alt={reel.nome}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              )}

              {/* Info do Produto */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                  {reel.nome}
                </h3>
                
                <div className="flex items-center gap-2">
                  <span 
                    className="font-bold text-lg"
                    style={{ color: corPrimaria }}
                  >
                    {formatPrice(reel.preco)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-gray-400 line-through text-sm">
                        {formatPrice(reel.precoOriginal!)}
                      </span>
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                        -{discountPercent}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 mt-3">
              {/* Botão Comprar - vai para página do produto */}
              <Link
                href={`/site/${dominio}/produto/${reel.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: corPrimaria }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Comprar</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CSS para line-clamp */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: ReelsFeed
// ============================================================================
export function ReelsFeed({
  reels,
  initialIndex = 0,
  onClose,
  onFavorite,
  onAddToCart,
  onShare,
  corPrimaria = '#DB1472',
  dominio,
  isFavorite: checkIsFavorite,
}: ReelsFeedProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Scroll para o índice inicial
  useEffect(() => {
    if (containerRef.current && initialIndex > 0) {
      const container = containerRef.current;
      const scrollTarget = initialIndex * window.innerHeight;
      container.scrollTo({ top: scrollTarget, behavior: 'instant' });
    }
  }, [initialIndex]);

  // Detectar índice atual baseado no scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      setCurrentIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handlers
  const handleToggleMute = () => setIsMuted(!isMuted);

  const handleFavorite = (id: string) => {
    onFavorite?.(id);
  };

  const handleAddToCart = (id: string) => {
    onAddToCart?.(id);
  };

  const handleShare = async (reel: ReelItem) => {
    const url = `${window.location.origin}/site/${dominio}/reels?produto=${reel.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.nome,
          text: `Confira: ${reel.nome}`,
          url,
        });
      } catch {
        // Usuário cancelou ou erro
      }
    } else {
      await navigator.clipboard.writeText(url);
      onShare?.(reel);
    }
  };

  const handleViewProduct = (id: string) => {
    router.push(`/site/${dominio}/produto/${id}`);
  };

  // Função para determinar se um vídeo deve carregar
  // Carrega: atual, anterior e próximo (janela de 3)
  const shouldLoadVideo = useCallback((index: number) => {
    return Math.abs(index - currentIndex) <= 1;
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 bg-black z-[9999]">
      {/* Header fixo */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <h1 className="text-white font-bold text-lg drop-shadow-lg">Reels</h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Indicador de posição */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30">
        <span className="text-white/70 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {reels.length}
        </span>
      </div>

      {/* Container de Scroll Snap */}
      <div
        ref={containerRef}
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {reels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
            shouldLoad={shouldLoadVideo(index)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onFavorite={() => handleFavorite(reel.id)}
            onAddToCart={() => handleAddToCart(reel.id)}
            onShare={() => handleShare(reel)}
            onViewProduct={() => handleViewProduct(reel.id)}
            isFavorited={checkIsFavorite ? checkIsFavorite(reel.id) : false}
            corPrimaria={corPrimaria}
            dominio={dominio}
          />
        ))}
      </div>

      {/* CSS Global para esconder scrollbar */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default ReelsFeed;
