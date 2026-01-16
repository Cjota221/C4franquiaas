/**
 * 🎬 IMMERSIVE REELS FEED - Estilo TikTok/Instagram Reels
 * 
 * PERFORMANCE FEATURES:
 * 1. Virtualização: Apenas 3 vídeos no DOM (anterior, atual, próximo)
 * 2. Single Player: Apenas 1 vídeo toca por vez
 * 3. Scroll Snap: Trava no vídeo ao soltar o dedo
 * 4. Lazy Loading: Só carrega quando scroll para
 * 5. Debounce: Não carrega durante scroll rápido
 * 
 * @author C4 Franquias
 */

"use client";

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo,
  memo 
} from 'react';
import { 
  X, 
  Heart, 
  ShoppingBag, 
  Share2, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TIPOS
// ============================================================================
export interface ReelProduct {
  id: string;
  nome: string;
  preco: number;
  precoOriginal?: number;
  videoUrl: string;
  posterUrl?: string;
  loja?: {
    nome: string;
    logo?: string;
    slug: string;
  };
}

interface ImmersiveReelsFeedProps {
  products: ReelProduct[];
  initialIndex?: number;
  onClose: () => void;
  onFavorite?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onShare?: (product: ReelProduct) => void;
  corPrimaria?: string;
  dominio?: string;
}

// ============================================================================
// CONFIGURAÇÕES DE PERFORMANCE
// ============================================================================
const CONFIG = {
  // Quantos vídeos manter no DOM (anterior + atual + próximo)
  VIRTUAL_WINDOW_SIZE: 3,
  
  // Threshold para considerar vídeo "em view" (50%)
  INTERSECTION_THRESHOLD: 0.5,
  
  // Delay antes de dar play após scroll parar (ms)
  SCROLL_DEBOUNCE_MS: 150,
  
  // Tempo mínimo de exibição antes de marcar como "visto"
  MIN_VIEW_TIME_MS: 3000,
};

// ============================================================================
// COMPONENTE: Single Reel Item (Memoizado)
// ============================================================================
interface ReelItemProps {
  product: ReelProduct;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onFavorite: () => void;
  onAddToCart: () => void;
  onShare: () => void;
  onViewProduct: () => void;
  isFavorited: boolean;
  corPrimaria: string;
}

const ReelItem = memo(function ReelItem({
  product,
  isActive,
  isMuted,
  onToggleMute,
  onFavorite,
  onAddToCart,
  onShare,
  onViewProduct,
  isFavorited,
  corPrimaria,
}: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  // Controlar play/pause baseado em isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      // Dar play com delay para evitar conflitos
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay bloqueado, ok
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      video.currentTime = 0; // Reset para início
      setIsPlaying(false);
    }
  }, [isActive]);

  // Atualizar mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Toggle play/pause no tap
  const handleVideoTap = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 800);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={isActive ? product.videoUrl : undefined} // Só carrega se ativo
        poster={product.posterUrl}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="none"
        onClick={handleVideoTap}
      />

      {/* POSTER (quando não ativo) */}
      {!isActive && product.posterUrl && (
        <img 
          src={product.posterUrl}
          alt={product.nome}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* PLAY ICON (feedback visual) */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-ping">
            <div className="w-0 h-0 border-l-[30px] border-l-white border-y-[18px] border-y-transparent ml-2" />
          </div>
        </div>
      )}

      {/* GRADIENTES */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradiente superior */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        {/* Gradiente inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* ============================================ */}
      {/* SIDEBAR DIREITA - Ações */}
      {/* ============================================ */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
        {/* Favoritar */}
        <button
          onClick={onFavorite}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className={`p-3 rounded-full ${isFavorited ? 'bg-red-500' : 'bg-black/40 backdrop-blur-sm'}`}>
            <Heart 
              className={`w-7 h-7 ${isFavorited ? 'text-white fill-white' : 'text-white'}`} 
            />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-lg">
            {isFavorited ? 'Salvo' : 'Salvar'}
          </span>
        </button>

        {/* Compartilhar */}
        <button
          onClick={onShare}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-lg">Enviar</span>
        </button>

        {/* Volume */}
        <button
          onClick={onToggleMute}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
            {isMuted ? (
              <VolumeX className="w-7 h-7 text-white" />
            ) : (
              <Volume2 className="w-7 h-7 text-white" />
            )}
          </div>
          <span className="text-white text-xs font-medium drop-shadow-lg">
            {isMuted ? 'Som' : 'Mudo'}
          </span>
        </button>
      </div>

      {/* ============================================ */}
      {/* BOTTOM - Info do Produto */}
      {/* ============================================ */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6">
        {/* Loja */}
        {product.loja && (
          <div className="flex items-center gap-2 mb-3">
            {product.loja.logo && (
              <img 
                src={product.loja.logo} 
                alt={product.loja.nome}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
            )}
            <span className="text-white font-semibold text-sm drop-shadow-lg">
              @{product.loja.nome}
            </span>
          </div>
        )}

        {/* Nome do Produto */}
        <h3 className="text-white font-bold text-lg mb-2 drop-shadow-lg line-clamp-2">
          {product.nome}
        </h3>

        {/* Preço */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-white font-bold text-2xl drop-shadow-lg">
            {formatPrice(product.preco)}
          </span>
          {product.precoOriginal && product.precoOriginal > product.preco && (
            <span className="text-white/60 text-sm line-through">
              {formatPrice(product.precoOriginal)}
            </span>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          {/* Comprar */}
          <button
            onClick={onAddToCart}
            className="flex-1 py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ backgroundColor: corPrimaria }}
          >
            <ShoppingBag className="w-5 h-5" />
            Comprar
          </button>

          {/* Ver Produto */}
          <button
            onClick={onViewProduct}
            className="px-5 py-3.5 rounded-full bg-white/20 backdrop-blur-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar (visual) */}
      {isActive && isPlaying && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/30">
          <div 
            className="h-full bg-white animate-progress"
            style={{ 
              animation: 'progressBar 15s linear infinite',
            }}
          />
        </div>
      )}
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL: ImmersiveReelsFeed
// ============================================================================
export function ImmersiveReelsFeed({
  products,
  initialIndex = 0,
  onClose,
  onFavorite,
  onAddToCart,
  onShare,
  corPrimaria = '#DB1472',
  dominio,
}: ImmersiveReelsFeedProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Refs para controle de scroll
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);

  // ============================================
  // VIRTUALIZAÇÃO: Calcular quais itens renderizar
  // ============================================
  const _virtualItems = useMemo(() => {
    const items: { index: number; product: ReelProduct }[] = [];
    const start = Math.max(0, currentIndex - 1);
    const end = Math.min(products.length - 1, currentIndex + 1);
    
    for (let i = start; i <= end; i++) {
      items.push({ index: i, product: products[i] });
    }
    
    return items;
  }, [currentIndex, products]);

  // ============================================
  // SCROLL HANDLER com Debounce
  // ============================================
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Marcar que está scrollando
    setIsScrolling(true);
    lastScrollTime.current = Date.now();

    // Limpar timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce: só atualiza index após scroll parar
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      
      // Calcular qual vídeo está mais visível
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < products.length) {
        setCurrentIndex(newIndex);
      }
    }, CONFIG.SCROLL_DEBOUNCE_MS);
  }, [currentIndex, products.length]);

  // ============================================
  // SCROLL SNAP: Ir para índice específico
  // ============================================
  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const targetScroll = index * container.clientHeight;
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  }, []);

  // Navegação por botões (setas)
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    }
  }, [currentIndex, scrollToIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < products.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    }
  }, [currentIndex, products.length, scrollToIndex]);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, onClose]);

  // ============================================
  // LOCK BODY SCROLL
  // ============================================
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
    onFavorite?.(productId);
  }, [onFavorite]);

  const handleAddToCart = useCallback((productId: string) => {
    onAddToCart?.(productId);
  }, [onAddToCart]);

  const handleShare = useCallback((product: ReelProduct) => {
    if (navigator.share) {
      navigator.share({
        title: product.nome,
        text: `Confira: ${product.nome}`,
        url: window.location.href,
      }).catch(() => {});
    }
    onShare?.(product);
  }, [onShare]);

  const handleViewProduct = useCallback((product: ReelProduct) => {
    onClose();
    if (dominio) {
      router.push(`/loja/${dominio}/produto/${product.id}`);
    } else if (product.loja?.slug) {
      router.push(`/site/${product.loja.slug}/produto/${product.id}`);
    }
  }, [router, dominio, onClose]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="fixed inset-0 z-[10000] bg-black">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
        {/* Logo/Título */}
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg drop-shadow-lg">Reels</span>
          <span className="text-white/60 text-sm">
            {currentIndex + 1}/{products.length}
          </span>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* ============================================ */}
      {/* NAVEGAÇÃO LATERAL (Desktop) */}
      {/* ============================================ */}
      <div className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all disabled:opacity-30"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className="hidden md:flex absolute left-4 top-1/2 translate-y-8 z-20">
        <button
          onClick={goToNext}
          disabled={currentIndex === products.length - 1}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all disabled:opacity-30"
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* ============================================ */}
      {/* FEED CONTAINER com Scroll Snap */}
      {/* ============================================ */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Renderizar TODOS os slots (para scroll funcionar) */}
        {products.map((product, index) => {
          // Verificar se está na janela virtual
          const isInWindow = Math.abs(index - currentIndex) <= 1;
          const isActive = index === currentIndex && !isScrolling;

          return (
            <div
              key={product.id}
              className="w-full h-full snap-start snap-always flex-shrink-0"
              style={{ 
                height: '100dvh', // Dynamic viewport height
                scrollSnapAlign: 'start',
              }}
            >
              {isInWindow ? (
                <ReelItem
                  product={product}
                  isActive={isActive}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(prev => !prev)}
                  onFavorite={() => handleFavorite(product.id)}
                  onAddToCart={() => handleAddToCart(product.id)}
                  onShare={() => handleShare(product)}
                  onViewProduct={() => handleViewProduct(product)}
                  isFavorited={favorites.has(product.id)}
                  corPrimaria={corPrimaria}
                />
              ) : (
                // Placeholder para manter scroll position
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  {product.posterUrl && (
                    <img 
                      src={product.posterUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-30"
                      loading="lazy"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* INDICADOR DE PROGRESSO */}
      {/* ============================================ */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-1">
        {products.slice(0, Math.min(20, products.length)).map((_, index) => (
          <div
            key={index}
            className={`w-1 rounded-full transition-all ${
              index === currentIndex 
                ? 'h-6 bg-white' 
                : 'h-2 bg-white/30'
            }`}
          />
        ))}
        {products.length > 20 && (
          <span className="text-white/50 text-[10px]">+{products.length - 20}</span>
        )}
      </div>

      {/* CSS para animações */}
      <style jsx global>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .animate-progress {
          animation: progressBar 15s linear infinite;
        }
        
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
    </div>
  );
}

export default ImmersiveReelsFeed;
